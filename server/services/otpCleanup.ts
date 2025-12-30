import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for OTP cleanup: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Delete expired OTP records from the database
 * Run periodically (e.g., every hour) to clean up old/expired OTPs
 */
export async function cleanupExpiredOtps(): Promise<{ deleted: number; error?: string }> {
  try {
    const now = new Date().toISOString();

    // Delete OTP records that have expired
    const { data, error } = await supabase
      .from('orders_otp')
      .delete()
      .lt('expires_at', now);

    if (error) {
      console.error('[OTP Cleanup] Delete error:', error);
      return { deleted: 0, error: error.message };
    }

    const deletedCount = data ? (Array.isArray(data) ? data.length : 1) : 0;
    console.log(`[OTP Cleanup] Deleted ${deletedCount} expired OTP records`);

    return { deleted: deletedCount };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[OTP Cleanup] Unexpected error:', errorMessage);
    return { deleted: 0, error: errorMessage };
  }
}

/**
 * Start a periodic cleanup job
 * Runs every hour by default (configurable via OTP_CLEANUP_INTERVAL_MINUTES env var)
 */
export function startOtpCleanupSchedule(intervalMinutes: number = 60): NodeJS.Timer {
  console.log(`[OTP Cleanup] Starting cleanup schedule every ${intervalMinutes} minutes`);

  // Run immediately on startup
  cleanupExpiredOtps().catch((err) => console.error('[OTP Cleanup] Initial run failed:', err));

  // Schedule periodic cleanup
  const timer = setInterval(async () => {
    await cleanupExpiredOtps();
  }, intervalMinutes * 60 * 1000);

  // Allow graceful shutdown
  timer.unref();

  return timer;
}
