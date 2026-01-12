import twilio from 'twilio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading from multiple locations to be robust
dotenv.config({ path: path.join(__dirname, '../../.env') }); // Root if running from server/services
dotenv.config({ path: path.join(__dirname, '../.env') });    // Server dir
dotenv.config(); // CWD

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error('Missing Twilio environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER');
}

const twilioClient = twilio(accountSid, authToken);

export interface WhatsAppPayload {
  phone: string;
  message: string;
  orderId: string;
  mediaUrl?: string;
}


export interface WhatsAppResponse {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Format and validate Nigerian phone numbers
 * Accepts: 2348012345678, 08012345678, +2348012345678
 * Returns: +2348012345678
 */
function formatPhoneNumber(phone: string): string | null {
  // Remove spaces and special characters except +
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Check if already in +234 format
  if (cleaned.startsWith('+234') && cleaned.length === 14) {
    return cleaned;
  }

  // Convert from 0 prefix (08012345678 → +2348012345678)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '+234' + cleaned.substring(1);
  }

  // Convert from 234 prefix (2348012345678 → +2348012345678)
  if (cleaned.startsWith('234') && cleaned.length === 13) {
    return '+' + cleaned;
  }

  // Invalid format
  return null;
}

/**
 * Sends a WhatsApp message via Twilio
 * Phone format: +234XXXXXXXXXX (Nigerian format with country code)
 */
export async function sendWhatsAppMessage(
  payload: WhatsAppPayload
): Promise<WhatsAppResponse> {
  try {
    // Validate phone number format
    const formattedPhone = formatPhoneNumber(payload.phone);
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Invalid phone number format. Use +234XXXXXXXXXX or 0XXXXXXXXXX',
      };
    }

    // Validate message length
    if (!payload.message || payload.message.length === 0) {
      return {
        success: false,
        error: 'Message cannot be empty',
      };
    }

    if (payload.message.length > 4096) {
      return {
        success: false,
        error: 'Message exceeds maximum length of 4096 characters',
      };
    }

    const fromPhoneNumber = twilioPhoneNumber!.replace('whatsapp:', '');

    // Send message via Twilio
    const message = await twilioClient.messages.create({
      from: `whatsapp:${fromPhoneNumber}`,
      to: `whatsapp:${formattedPhone}`,
      body: payload.message,
      ...(payload.mediaUrl && { mediaUrl: [payload.mediaUrl] }),
    });

    console.log(`[WhatsApp] Message sent to ${formattedPhone} (SID: ${message.sid}) from ${fromPhoneNumber}`);

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`[WhatsApp Error] ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Retry logic for failed messages with exponential backoff
 */
export async function sendWhatsAppWithRetry(
  payload: WhatsAppPayload,
  maxRetries: number = 3
): Promise<WhatsAppResponse> {
  let lastError: WhatsAppResponse | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendWhatsAppMessage(payload);

    if (result.success) {
      return result;
    }

    lastError = result;

    // Exponential backoff: 1s, 2s, 4s
    if (attempt < maxRetries) {
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      console.log(
        `[WhatsApp] Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return (
    lastError || {
      success: false,
      error: 'Max retries exceeded',
    }
  );
}

/**
 * Format message template based on order status
 */
export function getOrderStatusMessage(
  status: string,
  orderId: string,
  trackingUrl?: string
): string {
  const messages: Record<string, string> = {
    NEW: `Hello! Your order #${orderId} has been received. We'll start processing it shortly. 🎉`,
    PROCESSING: `Your order #${orderId} is now being processed. ⚙️ We'll notify you when it's ready!`,
    READY: `Great news! Your order #${orderId} is ready and will be dispatched soon. 📦`,
    DISPATCHED: trackingUrl
      ? `Your order #${orderId} is on its way! 🚀\n\nTrack your delivery here: ${trackingUrl}`
      : `Your order #${orderId} is on its way! 🚀 You'll receive a tracking link shortly.`,
    COMPLETED: `Your order #${orderId} has been delivered. Thank you for your purchase! ✅\n\nPlease rate your experience: ${trackingUrl}`,
    CANCELLED: `Your order #${orderId} has been cancelled. Please contact support for more details. ❌`,
  };

  return messages[status] || `Order #${orderId} status: ${status}`;
}
