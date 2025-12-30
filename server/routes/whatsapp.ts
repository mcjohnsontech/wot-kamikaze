import { Router, Request, Response } from 'express';
import { sendWhatsAppWithRetry } from '../services/whatsapp.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const router = Router();

// Initialize Supabase client using server-only service role key
// NOTE: For security, server processes must use SUPABASE_SERVICE_ROLE_KEY
// Frontend should continue to use `VITE_SUPABASE_ANON_KEY` (public, limited access)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for server: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface SendWhatsAppRequest {
  phone: string;
  message: string;
  orderId: string;
}

/**
 * POST /api/send-whatsapp
 * Send a WhatsApp message to customer/rider
 */
router.post('/send-whatsapp', async (req: Request, res: Response) => {
  try {
    const { phone, message, orderId } = req.body as SendWhatsAppRequest;

    // Validate required fields
    if (!phone || !message || !orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phone, message, orderId',
      });
    }

    // Send WhatsApp message with retry logic
    const result = await sendWhatsAppWithRetry({
      phone,
      message,
      orderId,
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Log the message send to database for audit trail
    try {
      await supabase.from('whatsapp_logs').insert([
        {
          order_id: orderId,
          recipient_phone: phone,
          message_body: message,
          twilio_sid: result.messageSid,
          status: 'sent',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (dbError) {
      console.warn('[WhatsApp] Failed to log message to database:', dbError);
      // Don't fail the response, just warn
    }

    res.json({
      success: true,
      messageSid: result.messageSid,
      message: 'WhatsApp message sent successfully',
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[WhatsApp Route Error]', errorMessage);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/whatsapp-logs/:orderId
 * Retrieve WhatsApp message history for an order
 */
router.get('/whatsapp-logs/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required',
      });
    }

    const { data, error } = await supabase
      .from('whatsapp_logs')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      logs: data || [],
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[WhatsApp Logs Error]', errorMessage);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve logs',
    });
  }
});

/**
 * POST /api/whatsapp/webhook
 * Twilio webhook for message delivery status updates
 */
router.post('/whatsapp/webhook', async (req: Request, res: Response) => {
  try {
    const { MessageSid, MessageStatus, To } = req.body;

    console.log(
      `[WhatsApp Webhook] ${MessageSid} status: ${MessageStatus} to ${To}`
    );

    // Update the log with delivery status
    if (MessageSid) {
      const { error } = await supabase
        .from('whatsapp_logs')
        .update({
          status: MessageStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('twilio_sid', MessageSid);

      if (error) {
        console.error('[WhatsApp Webhook] Failed to update status:', error);
      }
    }

    // Acknowledge receipt to Twilio
    res.json({ success: true });
  } catch (error) {
    console.error('[WhatsApp Webhook Error]', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

export default router;
