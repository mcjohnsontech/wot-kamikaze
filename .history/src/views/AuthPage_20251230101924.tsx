import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { resendVerificationEmail } from '../lib/emailVerification';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const title = isLogin ? "Welcome Back" : "Join WOT";
  const subtitle = isLogin ? "Sign in to your SME Dashboard" : "Create your account to get started";
  const buttonText = isLogin ? "Sign In" : "Create Account";

  const handleResendVerification = async () => {
    setIsProcessing(true);
    const result = await resendVerificationEmail(email);
    if (result.success) {
      setSuccess('Verification email sent! Check your inbox.');
      setError(null);
    } else {
      setError(result.message);
      setSuccess(null);
    }
    setIsProcessing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    if (!email || !password) {
      setError("Email and password are required.");
      setIsProcessing(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsProcessing(false);
      return;
    }

    try {
        if (isLogin) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          
          // Check if email is verified
          if (!data?.user?.email_confirmed_at) {
            setVerificationPending(true);
            setSuccess('Email verification required. Check your inbox for verification link.');
            setIsProcessing(false);
            return;
          }

          const token = data?.session?.access_token;
          const user = data?.user;
          login(token ?? '', { id: user?.id ?? 'unknown', name: (user?.user_metadata as any)?.name || user?.email || 'SME' });
          // On login, check if user has completed onboarding
          const hasOnboarded = user?.user_metadata?.onboarded;
          navigate(hasOnboarded ? '/sme' : '/onboarding', { replace: true });
        } else {
          const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
          });
          
          if (error) throw error;

          // Supabase signup returns null session if email confirmation is required
          if (!data?.session) {
            setVerificationPending(true);
            setSuccess('Account created! Please verify your email before signing in. Check your inbox for the verification link.');
            setEmail('');
            setPassword('');
            setIsProcessing(false);
            return;
          }

          // If session exists, auto-login
          const token = data?.session?.access_token;
          const user = data?.user;
          login(token ?? '', { id: user?.id ?? 'unknown', name: (user?.user_metadata as any)?.name || user?.email || 'SME' });
          // Check if user is new (onboarded field doesn't exist)
          const isNewUser = !user?.user_metadata?.onboarded;
          navigate(isNewUser ? '/onboarding' : '/sme', { replace: true });
        }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed. Please check your credentials or try again later.';
      setError(errorMessage);
      console.error('Auth error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-blue-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">WOT</h1>
          <p className="text-slate-600 text-sm">Smarter Workflows, Faster Deliveries</p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow-lg p-8 mb-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-600 text-sm">{subtitle}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* Verification Pending State */}
          {verificationPending && (
            <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-blue-900 text-sm font-semibold mb-3">Email Verification Pending</p>
              <p className="text-blue-800 text-sm mb-4">Didn't receive the email? Click below to resend.</p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isProcessing}
                className="w-full py-2 px-4 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend Verification Email
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2" htmlFor="email">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Address
                </span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="mama.ngozi@wot.ng"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2" htmlFor="password">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Password
                </span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 px-4 mt-8 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              {isProcessing ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  {buttonText}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-blue-100"></div>
            <span className="text-slate-500 text-xs">OR</span>
            <div className="flex-1 h-px bg-blue-100"></div>
          </div>

          {/* Toggle Auth Mode */}
          <p className="text-center text-slate-600 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setEmail('');
                setPassword('');
              }}
              type="button"
              className="ml-2 font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200 inline-flex items-center gap-1 group"
            >
              {isLogin ? "Sign Up" : "Sign In"}
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs">
          By signing in, you agree to our
          <a href="#" className="text-blue-600 hover:text-blue-700 mx-1">Terms of Service</a>
          and
          <a href="#" className="text-blue-600 hover:text-blue-700 ml-1">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;