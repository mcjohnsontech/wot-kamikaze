import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const title = isLogin ? "Welcome Back" : "Join WOT";
  const subtitle = isLogin ? "Sign in to your SME Dashboard" : "Create your account to get started";
  const buttonText = isLogin ? "Sign In" : "Create Account";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    if (!email || !password) {
      setError("Email and password are required.");
      setIsProcessing(false);
      return;
    }

    try {
      // --- MOCK AUTHENTICATION LOGIC ---
      console.log(`${isLogin ? 'Login' : 'Signup'} attempt for: ${email}`);

      // In a real application, this is where you would call the NestJS Auth API:
      // const response = await fetch('/api/v1/auth/login', { ... });
      // const { token } = await response.json();

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      // Mock success: Use the mock token from AuthContext
      login('MOCK_SME_TOKEN'); 

      // Redirect to the protected dashboard
      navigate('/sme', { replace: true });

    } catch (err) {
      console.error(err);
      setError("Authentication failed. Please check your credentials or try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-linear-to-br from-blue-400 to-blue-600 shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">WOT</h1>
          <p className="text-slate-400 text-sm">Smarter Workflows, Faster Deliveries</p>
        </div>

        {/* Main Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 mb-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
            <p className="text-slate-300 text-sm">{subtitle}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 flex items-start gap-3 animate-pulse">
              <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-200 text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2" htmlFor="email">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:bg-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                placeholder="mama.ngozi@wot.ng"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2" htmlFor="password">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:bg-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 px-4 mt-8 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group"
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
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-slate-400 text-xs">OR</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Toggle Auth Mode */}
          <p className="text-center text-slate-300 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setEmail('');
                setPassword('');
              }}
              type="button"
              className="ml-2 font-bold text-blue-400 hover:text-blue-300 transition-colors duration-200 inline-flex items-center gap-1 group"
            >
              {isLogin ? "Sign Up" : "Sign In"}
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs">
          By signing in, you agree to our
          <a href="#" className="text-blue-400 hover:text-blue-300 mx-1">Terms of Service</a>
          and
          <a href="#" className="text-blue-400 hover:text-blue-300 ml-1">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;