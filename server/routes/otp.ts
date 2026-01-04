import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { sendWhatsAppWithRetry, getOrderStatusMessage } from '../services/whatsapp.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

dotenv.config({ path: './server/.env' });

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for server: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Rate limiters for OTP endpoints
const otpGenerateRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 OTP generations per hour per IP
});

const otpVerifyRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 verify attempts per 15 minutes per IP
});

// Generate a 4-digit numeric OTP
function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * POST /api/orders/:orderId/otp/generate
 * Generate an OTP for the order and send it to the customer's WhatsApp
 */
router.post('/orders/:orderId/otp/generate', otpGenerateRateLimiter, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    // Fetch order to get customer phone
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, customer_phone')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const phone = order.customer_phone;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Customer phone not found on order' });
    }

    const otp = generateOtp();
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = crypto.scryptSync(otp, salt, 64).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Insert OTP record
    const { error: insertError } = await supabase.from('orders_otp').insert([
      {
        order_id: orderId,
        otp_hash: otpHash,
        salt,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error('[OTP] Failed to persist OTP record', insertError);
      return res.status(500).json({ success: false, error: 'Failed to create OTP' });
    }

    // Send OTP via WhatsApp using existing service
    const message = `Your delivery OTP is ${otp}. It expires in 5 minutes.`;
    const sendResult = await sendWhatsAppWithRetry({ phone, message, orderId });

    if (!sendResult.success) {
      console.warn('[OTP] WhatsApp send failed', sendResult.error);
      // Still return success for OTP creation, but warn client
    }

    const responsePayload: any = { success: true, message: 'OTP generated and sent' };
    return res.json(responsePayload);
  } catch (error) {
    console.error('[OTP Generate Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/orders/:orderId/otp/verify
 * Verify OTP provided by rider; on success mark order as COMPLETED
 */
router.post('/orders/:orderId/otp/verify', otpVerifyRateLimiter, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body as { otp?: string };

    if (!orderId) return res.status(400).json({ success: false, error: 'Order ID is required' });
    if (!otp) return res.status(400).json({ success: false, error: 'OTP is required' });

    // Fetch latest OTP record for order
    const { data: records, error: fetchError } = await supabase
      .from('orders_otp')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('[OTP] Fetch error', fetchError);
      return res.status(500).json({ success: false, error: 'Failed to fetch OTP record' });
    }

    const record = Array.isArray(records) && records.length ? records[0] as any : null;
    if (!record) return res.status(404).json({ success: false, error: 'OTP not found for order' });

    if (record.attempts >= 5) return res.status(429).json({ success: false, error: 'Too many attempts' });

    const now = new Date();
    const parsedExpires = new Date(record.expires_at);
    console.log('[OTP] expires_at raw:', record.expires_at, 'parsed:', parsedExpires.toISOString(), 'now:', now.toISOString());
    if (parsedExpires < now) {
      const debugPayload: any = { success: false, error: 'OTP expired' };
      if (process.env.NODE_ENV === 'development') {
        debugPayload.debug = {
          expiresAtRaw: record.expires_at,
          expiresAtParsed: parsedExpires.toISOString(),
          now: now.toISOString(),
        };
      }
      return res.status(400).json(debugPayload);
    }

    const providedHash = crypto.scryptSync(otp, record.salt, 64).toString('hex');
    const storedHash = record.otp_hash as string;

    const match = crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(storedHash));

    if (!match) {
      // increment attempts
      await supabase.from('orders_otp').update({ attempts: (record.attempts || 0) + 1, updated_at: new Date().toISOString() }).eq('id', record.id);
      return res.status(401).json({ success: false, error: 'Invalid OTP' });
    }

    // OTP valid - mark order as COMPLETED
    const { data: updatedOrder, error: updateOrderError } = await supabase
      .from('orders')
      .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('id, customer_phone, readable_id, sme_id, rider_token')
      .single();

    if (updateOrderError) {
      console.error('[OTP] Failed to update order status', updateOrderError);
      return res.status(500).json({ success: false, error: 'Failed to update order status' });
    }

    // Send confirmation WhatsApp message
    if (updatedOrder && updatedOrder.customer_phone) {
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const csatUrl = updatedOrder.rider_token
          ? `${frontendUrl}/csat/${updatedOrder.rider_token}`
          : undefined;

        const message = getOrderStatusMessage('COMPLETED', updatedOrder.readable_id, csatUrl);
        await sendWhatsAppWithRetry({
          phone: updatedOrder.customer_phone,
          message,
          orderId: updatedOrder.id,
          smeId: updatedOrder.sme_id
        });
      } catch (waError) {
        console.warn('[OTP] Failed to send completion WhatsApp', waError);
        // Don't fail the request as main action succeeded
      }
    }

    // Invalidate OTP record
    await supabase.from('orders_otp').update({ attempts: (record.attempts || 0) + 1, expires_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', record.id);

    return res.json({ success: true, message: 'OTP verified, order marked as COMPLETED' });
  } catch (error) {
    console.error('[OTP Verify Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
