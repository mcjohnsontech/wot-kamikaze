import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * GET /api/whatsapp/config
 * Fetch current WhatsApp config for SME
 */
router.get('/whatsapp/config', async (req: Request, res: Response) => {
  try {
    const smeId = req.headers['x-sme-id'] as string;

    if (!smeId) {
      return res.status(401).json({ success: false, error: 'SME ID not provided' });
    }

    const { data: config, error } = await supabase
      .from('whatsapp_configs')
      .select('id, sme_id, provider, is_connected, instance_id, connected_at')
      .eq('sme_id', smeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found (expected if no config yet)
      console.error('[WhatsApp Config] Fetch error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch config' });
    }

    return res.json({
      success: true,
      config: config || null,
    });
  } catch (error) {
    console.error('[WhatsApp Config GET Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/whatsapp/config/twilio
 * Set up Twilio as WhatsApp provider
 */
router.post('/whatsapp/config/twilio', async (req: Request, res: Response) => {
  try {
    const smeId = req.headers['x-sme-id'] as string;
    const { accountSid, authToken, twilioPhoneNumber } = req.body;

    if (!smeId) {
      return res.status(401).json({ success: false, error: 'SME ID not provided' });
    }

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'accountSid, authToken, and twilioPhoneNumber are required',
      });
    }

    // Upsert config
    const { data: config, error } = await supabase
      .from('whatsapp_configs')
      .upsert(
        [
          {
            sme_id: smeId,
            provider: 'twilio',
            provider_config: {
              accountSid,
              authToken,
              twilioPhoneNumber,
            },
            is_connected: true,
            connected_at: new Date().toISOString(),
            instance_id: twilioPhoneNumber,
          },
        ],
        { onConflict: 'sme_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[WhatsApp Twilio] Upsert error:', error);
      return res.status(500).json({ success: false, error: 'Failed to save config' });
    }

    return res.json({
      success: true,
      message: 'Twilio WhatsApp configured successfully',
      config,
    });
  } catch (error) {
    console.error('[WhatsApp Twilio POST Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/whatsapp/config/instance
 * Set up Baileys/Evolution instance-based WhatsApp
 * In production, this would integrate with actual Baileys/Evolution API
 */
router.post('/whatsapp/config/instance', async (req: Request, res: Response) => {
  try {
    const smeId = req.headers['x-sme-id'] as string;
    const { provider, instanceKey, phoneNumber } = req.body;

    if (!smeId) {
      return res.status(401).json({ success: false, error: 'SME ID not provided' });
    }

    if (!provider || !['baileys', 'evolution'].includes(provider)) {
      return res.status(400).json({ success: false, error: 'Invalid provider' });
    }

    if (!instanceKey || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'instanceKey and phoneNumber are required' });
    }

    // TODO: Validate instance with actual Baileys/Evolution API
    // For now, store the configuration
    const { data: config, error } = await supabase
      .from('whatsapp_configs')
      .upsert(
        [
          {
            sme_id: smeId,
            provider,
            provider_config: {
              instanceKey,
              phoneNumber,
              // Additional fields for Baileys/Evolution can be added
            },
            is_connected: true,
            connected_at: new Date().toISOString(),
            instance_id: phoneNumber,
          },
        ],
        { onConflict: 'sme_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[WhatsApp Instance] Upsert error:', error);
      return res.status(500).json({ success: false, error: 'Failed to save config' });
    }

    return res.json({
      success: true,
      message: `${provider} WhatsApp instance configured successfully`,
      config,
    });
  } catch (error) {
    console.error('[WhatsApp Instance POST Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/whatsapp/config/instance/qr
 * Request QR code for Baileys/Evolution connection
 * (Placeholder: actual implementation depends on chosen library)
 */
router.post('/whatsapp/config/instance/qr', async (req: Request, res: Response) => {
  try {
    const smeId = req.headers['x-sme-id'] as string;

    if (!smeId) {
      return res.status(401).json({ success: false, error: 'SME ID not provided' });
    }

    // TODO: Implement actual QR code generation with Baileys/Evolution
    // For now, return a placeholder response
    return res.json({
      success: true,
      message: 'QR code generation not yet implemented',
      qrCode: null,
      sessionId: `session_${Date.now()}`, // Placeholder
    });
  } catch (error) {
    console.error('[WhatsApp QR Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /api/whatsapp/config
 * Disconnect WhatsApp (deactivate config)
 */
router.delete('/whatsapp/config', async (req: Request, res: Response) => {
  try {
    const smeId = req.headers['x-sme-id'] as string;

    if (!smeId) {
      return res.status(401).json({ success: false, error: 'SME ID not provided' });
    }

    const { error } = await supabase
      .from('whatsapp_configs')
      .update({ is_connected: false, updated_at: new Date().toISOString() })
      .eq('sme_id', smeId);

    if (error) {
      console.error('[WhatsApp Delete] Error:', error);
      return res.status(500).json({ success: false, error: 'Failed to disconnect' });
    }

    return res.json({
      success: true,
      message: 'WhatsApp disconnected successfully',
    });
  } catch (error) {
    console.error('[WhatsApp DELETE Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
