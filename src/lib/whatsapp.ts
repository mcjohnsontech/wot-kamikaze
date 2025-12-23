/**
 * WhatsApp API Client for Frontend
 * Communicates with backend WhatsApp service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface WhatsAppMessagePayload {
  phone: string;
  message: string;
  orderId: string;
  mediaUrl?: string;
}

export interface WhatsAppLog {
  id: string;
  order_id: string;
  recipient_phone: string;
  message_body: string;
  twilio_sid?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  created_at: string;
  updated_at?: string;
}

/**
 * Send a WhatsApp message via backend API
 */
export async function sendWhatsAppMessage(
  payload: WhatsAppMessagePayload
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send WhatsApp message');
    }

    return await response.json();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[WhatsApp Client Error]', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get WhatsApp message history for an order
 */
export async function getWhatsAppLogs(
  orderId: string
): Promise<{
  success: boolean;
  logs?: WhatsAppLog[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/whatsapp-logs/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch WhatsApp logs');
    }

    return await response.json();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[WhatsApp Logs Error]', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate order status message templates
 */
export function generateOrderStatusMessage(
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
    COMPLETED: trackingUrl
      ? `Your order #${orderId} has been delivered. Thank you for your purchase! ✅\n\nPlease rate your experience: ${trackingUrl}`
      : `Your order #${orderId} has been delivered. Thank you for your purchase! ✅`,
    CANCELLED: `Your order #${orderId} has been cancelled. Please contact support for more details. ❌`,
  };

  return messages[status] || `Order #${orderId} status: ${status}`;
}
