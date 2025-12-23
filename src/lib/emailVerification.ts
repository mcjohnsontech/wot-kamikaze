import { supabase } from './supabase';

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  requiresVerification: boolean;
}

/**
 * Handles post-signup email verification flow
 * Checks if user email is confirmed and handles verification requirements
 */
export async function handleEmailVerification(email: string): Promise<EmailVerificationResult> {
  try {
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return {
        success: false,
        message: 'Failed to verify session',
        requiresVerification: true,
      };
    }

    // Check if email is confirmed
    if (session?.user?.email_confirmed_at) {
      return {
        success: true,
        message: 'Email is verified',
        requiresVerification: false,
      };
    }

    // Email verification is pending
    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      requiresVerification: true,
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      message: 'An error occurred during verification',
      requiresVerification: true,
    };
  }
}

/**
 * Resend verification email to user
 */
export async function resendVerificationEmail(email: string): Promise<EmailVerificationResult> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message || 'Failed to resend verification email',
        requiresVerification: true,
      };
    }

    return {
      success: true,
      message: 'Verification email resent. Check your inbox.',
      requiresVerification: true,
    };
  } catch (error) {
    console.error('Resend verification error:', error);
    return {
      success: false,
      message: 'An error occurred while resending verification',
      requiresVerification: true,
    };
  }
}

/**
 * Check if user has confirmed their email
 */
export async function isEmailConfirmed(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user?.email_confirmed_at;
  } catch (error) {
    console.error('Email confirmation check error:', error);
    return false;
  }
}

/**
 * Get verification status message
 */
export function getVerificationStatusMessage(emailConfirmedAt: string | null): string {
  if (!emailConfirmedAt) {
    return 'Please verify your email to complete account setup.';
  }
  return 'Email verified. Your account is fully activated.';
}
