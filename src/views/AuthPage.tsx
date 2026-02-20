import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconAlertCircle,
  IconCheck,
  IconAt,
  IconLock,
  IconTruckDelivery,
  IconMailOpened,
  IconArrowLeft,
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconSun,
  IconMoon,
  IconShieldCheck,
  IconMapPinCheck,
  IconChartBar,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { resendVerificationEmail } from '../lib/emailVerification';

/* ─── Theme Hook ─── */
const useTheme = () => {
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
  };
  return { dark, toggle };
};

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { dark, toggle } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setMounted(true); }, []);

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
      setError('Email and password are required.');
      setIsProcessing(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;

        if (!data?.user?.email_confirmed_at) {
          setVerificationPending(true);
          setSuccess('Email verification required.');
          setIsProcessing(false);
          return;
        }

        const token = data?.session?.access_token;
        const user = data?.user;
        login(token ?? '', {
          id: user?.id ?? 'unknown',
          name: (user?.user_metadata as any)?.name || user?.email || 'SME',
        });
        navigate('/sme', { replace: true });
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });

        if (authError) throw authError;

        if (!data?.session) {
          setVerificationPending(true);
          setSuccess('Account created! Verification required.');
          setIsProcessing(false);
          return;
        }

        const token = data?.session?.access_token;
        const user = data?.user;
        login(token ?? '', {
          id: user?.id ?? 'unknown',
          name: (user?.user_metadata as any)?.name || user?.email || 'SME',
        });
        navigate('/sme', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const switchMode = () => {
    setIsLogin(v => !v);
    setError(null);
    setSuccess(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@700;800;900&display=swap');

        :root, [data-theme="light"] {
          --bg: #ffffff;
          --bg2: #f0f4ff;
          --surface: #ffffff;
          --surface2: #f8faff;
          --border: rgba(0,0,0,0.08);
          --text: #0a0e1a;
          --text2: #3d4663;
          --text3: #6b7594;
          --blue: #1a6dff;
          --blue2: #0052e0;
          --blue3: #4d94ff;
          --blue-glow: rgba(26,109,255,0.15);
          --blue-glow2: rgba(26,109,255,0.06);
          --card-border: rgba(26,109,255,0.12);
          --shadow-blue: 0 8px 32px rgba(26,109,255,0.2);
          --input-bg: #f8faff;
        }
        [data-theme="dark"] {
          --bg: #03070f;
          --bg2: #070d1c;
          --surface: #0d1624;
          --surface2: #111e33;
          --border: rgba(255,255,255,0.06);
          --text: #e8eeff;
          --text2: #9badd4;
          --text3: #5b6f9a;
          --blue: #4d94ff;
          --blue2: #2b7bff;
          --blue3: #80b3ff;
          --blue-glow: rgba(77,148,255,0.2);
          --blue-glow2: rgba(77,148,255,0.07);
          --card-border: rgba(77,148,255,0.15);
          --shadow-blue: 0 8px 32px rgba(77,148,255,0.25);
          --input-bg: #0a1020;
        }

        .auth-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
        }
        @media (max-width: 900px) {
          .auth-root { grid-template-columns: 1fr; }
          .auth-left { display: none; }
        }

        /* ── Left Panel ── */
        .auth-left {
          position: relative;
          background: linear-gradient(145deg, #0a1628 0%, #03070f 50%, #0d1e40 100%);
          display: flex; flex-direction: column;
          justify-content: center; padding: 64px;
          overflow: hidden;
        }
        .auth-left-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(77,148,255,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(77,148,255,0.07) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .auth-left-blob {
          position: absolute; border-radius: 50%; filter: blur(80px);
          background: radial-gradient(circle, rgba(26,109,255,0.25), transparent 70%);
        }
        .auth-left-blob-1 { width: 400px; height: 400px; top: -100px; left: -100px; animation: blobDrift 10s ease-in-out infinite alternate; }
        .auth-left-blob-2 { width: 300px; height: 300px; bottom: -80px; right: -80px; animation: blobDrift 8s 3s ease-in-out infinite alternate-reverse; }
        @keyframes blobDrift { from { transform: translate(0,0) scale(1); } to { transform: translate(20px,15px) scale(1.08); } }

        .auth-left-content { position: relative; z-index: 1; }
        .auth-left-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 64px; }
        .auth-left-logo-icon {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #1a6dff, #0052e0);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(26,109,255,0.4);
        }
        .auth-left-logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 24px; color: #fff; }

        .auth-left-heading {
          font-family: 'Syne', sans-serif;
          font-size: clamp(36px, 4vw, 52px);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -2px;
          color: #fff;
          margin-bottom: 20px;
        }
        .auth-left-heading .blue-accent {
          background: linear-gradient(135deg, #4d94ff, #80b3ff);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .auth-left-sub {
          font-size: 16px; color: rgba(155,173,212,0.9); line-height: 1.7;
          margin-bottom: 56px; max-width: 360px;
        }

        .feature-list { display: flex; flex-direction: column; gap: 20px; }
        .feature-item { display: flex; align-items: center; gap: 16px; }
        .feature-item-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: rgba(77,148,255,0.12);
          border: 1px solid rgba(77,148,255,0.2);
          display: flex; align-items: center; justify-content: center;
          color: #4d94ff; flex-shrink: 0;
        }
        .feature-item-text { font-size: 14px; color: rgba(155,173,212,0.9); font-weight: 500; }

        .auth-left-footer {
          position: absolute; bottom: 32px; left: 64px; right: 64px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .auth-trust {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: rgba(91,111,154,0.8); font-weight: 500;
        }
        .trust-dots { display: flex; gap: 4px; }
        .trust-dot {
          width: 24px; height: 24px; border-radius: 50%;
          background: linear-gradient(135deg, #1a6dff, #4d94ff);
          border: 2px solid #0a1628;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #fff;
          margin-left: -8px;
        }
        .trust-dot:first-child { margin-left: 0; }

        /* ── Right Panel ── */
        .auth-right {
          display: flex; flex-direction: column;
          background: var(--bg); position: relative;
        }
        .auth-right-top {
          display: flex; justify-content: space-between; align-items: center;
          padding: 24px 40px;
        }
        .auth-mobile-logo {
          display: none; align-items: center; gap: 10px;
        }
        @media (max-width: 900px) {
          .auth-mobile-logo { display: flex; }
        }
        .auth-mobile-logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .auth-mobile-logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; color: var(--text); }

        .theme-btn {
          width: 38px; height: 38px;
          border: 1px solid var(--border); border-radius: 10px;
          background: var(--surface2); color: var(--text2);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        .theme-btn:hover { border-color: var(--blue); color: var(--blue); }

        .auth-form-wrapper {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 40px;
          opacity: ${mounted ? 1 : 0};
          transform: ${mounted ? 'translateY(0)' : 'translateY(24px)'};
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .auth-form-inner { width: 100%; max-width: 400px; }

        .auth-form-header { margin-bottom: 36px; }
        .auth-form-title {
          font-family: 'Syne', sans-serif;
          font-size: 32px; font-weight: 900; letter-spacing: -1px;
          color: var(--text); margin-bottom: 8px;
        }
        .auth-form-sub { font-size: 15px; color: var(--text2); }
        .auth-form-sub a { color: var(--blue); font-weight: 600; text-decoration: none; cursor: pointer; }
        .auth-form-sub a:hover { text-decoration: underline; }

        /* ── Form Elements ── */
        .field { margin-bottom: 20px; }
        .field-label {
          display: block; font-size: 13px; font-weight: 600;
          color: var(--text2); margin-bottom: 8px; letter-spacing: 0.2px;
        }
        .field-wrap { position: relative; }
        .field-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: var(--text3); pointer-events: none; display: flex; align-items: center;
        }
        .field-input {
          width: 100%; padding: 13px 14px 13px 42px;
          background: var(--input-bg); border: 1.5px solid var(--border);
          border-radius: 12px; color: var(--text);
          font-size: 15px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field-input::placeholder { color: var(--text3); }
        .field-input:focus { border-color: var(--blue); box-shadow: 0 0 0 4px var(--blue-glow); }
        .field-input.error { border-color: #ef4444; box-shadow: 0 0 0 4px rgba(239,68,68,0.1); }
        .pw-toggle {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          color: var(--text3); cursor: pointer; display: flex; align-items: center;
          background: none; border: none; padding: 0; transition: color 0.2s;
        }
        .pw-toggle:hover { color: var(--blue); }

        /* ── Alerts ── */
        .alert {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 16px; border-radius: 12px;
          font-size: 13px; font-weight: 500; margin-bottom: 20px;
          line-height: 1.5;
        }
        .alert-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; }
        .alert-success { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: #16a34a; }
        .alert-icon { flex-shrink: 0; margin-top: 1px; }

        /* ── Submit Button ── */
        .submit-btn {
          width: 100%; padding: 15px 24px; margin-top: 8px;
          background: linear-gradient(135deg, var(--blue), var(--blue2));
          color: #fff; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.3s; box-shadow: var(--shadow-blue);
          position: relative; overflow: hidden;
        }
        .submit-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(26,109,255,0.4); }
        .submit-btn:hover::before { opacity: 1; }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
        .spinner {
          width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Divider ── */
        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 24px 0; color: var(--text3); font-size: 13px;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }

        /* ── Switch Toggle ── */
        .mode-switch { text-align: center; margin-top: 20px; font-size: 14px; color: var(--text2); }
        .mode-switch button {
          background: none; border: none; color: var(--blue);
          font-weight: 700; font-size: 14px; cursor: pointer;
          padding: 0; font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s;
        }
        .mode-switch button:hover { opacity: 0.75; }

        /* ── Verification State ── */
        .verify-wrapper { text-align: center; }
        .verify-icon-wrap {
          width: 80px; height: 80px; border-radius: 24px;
          background: var(--blue-glow2); border: 1px solid var(--card-border);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px; color: var(--blue);
          animation: iconPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes iconPop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .verify-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: var(--text); margin-bottom: 12px; }
        .verify-sub { font-size: 14px; color: var(--text2); line-height: 1.7; margin-bottom: 32px; }
        .verify-email { font-weight: 700; color: var(--text); }

        .resend-btn {
          width: 100%; padding: 14px 24px;
          background: var(--blue-glow2); border: 1.5px solid var(--card-border);
          color: var(--blue); border-radius: 12px;
          font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.2s; margin-bottom: 12px;
        }
        .resend-btn:hover { background: var(--blue-glow); }
        .resend-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .back-btn {
          background: none; border: none; color: var(--text3);
          font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          margin: 0 auto; transition: color 0.2s;
        }
        .back-btn:hover { color: var(--text); }

        /* ── Legal ── */
        .auth-legal {
          text-align: center; padding: 24px 40px;
          font-size: 12px; color: var(--text3);
        }

        ::selection { background: var(--blue); color: #fff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg2); }
        ::-webkit-scrollbar-thumb { background: var(--blue); border-radius: 3px; }
      `}</style>

      <div className="auth-root">
        {/* ─── Left Panel ─── */}
        <div className="auth-left">
          <div className="auth-left-grid" />
          <div className="auth-left-blob auth-left-blob-1" />
          <div className="auth-left-blob auth-left-blob-2" />

          <div className="auth-left-content">
            <div className="auth-left-logo">
              <div className="auth-left-logo-icon">
                <IconTruckDelivery size={22} color="#fff" />
              </div>
              <span className="auth-left-logo-text">WOT</span>
            </div>

            <h2 className="auth-left-heading">
              The Delivery OS<br />Built for{' '}
              <span className="blue-accent">Nigerian SMEs</span>
            </h2>

            <p className="auth-left-sub">
              Automate every customer conversation from order to doorstep — with live tracking, WhatsApp updates, and verified delivery.
            </p>

            <div className="feature-list">
              {[
                { icon: IconMapPinCheck, text: 'Live GPS tracking on every delivery' },
                { icon: IconShieldCheck, text: 'OTP verification eliminates fraud' },
                { icon: IconChartBar, text: 'Analytics to optimize rider performance' },
              ].map(({ icon: Icon, text }) => (
                <div className="feature-item" key={text}>
                  <div className="feature-item-icon"><Icon size={18} /></div>
                  <span className="feature-item-text">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-left-footer">
            <div className="auth-trust">
              <div className="trust-dots">
                {['C', 'T', 'A', 'Z'].map(l => (
                  <div className="trust-dot" key={l}>{l}</div>
                ))}
              </div>
              <span>100+ merchants trust WOT</span>
            </div>
          </div>
        </div>

        {/* ─── Right Panel ─── */}
        <div className="auth-right">
          <div className="auth-right-top">
            <div className="auth-mobile-logo">
              <div className="auth-mobile-logo-icon">
                <IconTruckDelivery size={18} color="#fff" />
              </div>
              <span className="auth-mobile-logo-text">WOT</span>
            </div>
            <div style={{ flex: 1 }} />
            <button className="theme-btn" onClick={toggle} aria-label="Toggle theme">
              {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
          </div>

          <div className="auth-form-wrapper">
            <div className="auth-form-inner">
              {verificationPending ? (
                /* ─── Verification State ─── */
                <div className="verify-wrapper">
                  <div className="verify-icon-wrap">
                    <IconMailOpened size={40} />
                  </div>
                  <div className="verify-title">Check your inbox</div>
                  <p className="verify-sub">
                    We sent a magic link to{' '}
                    <span className="verify-email">{email}</span>.
                    <br />Click the link to activate your account.
                  </p>

                  {error && (
                    <div className="alert alert-error" style={{ textAlign: 'left' }}>
                      <span className="alert-icon"><IconAlertCircle size={16} /></span>
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="alert alert-success" style={{ textAlign: 'left' }}>
                      <span className="alert-icon"><IconCheck size={16} /></span>
                      {success}
                    </div>
                  )}

                  <button className="resend-btn" onClick={handleResendVerification} disabled={isProcessing}>
                    {isProcessing ? 'Sending...' : 'Resend verification email'}
                  </button>

                  <button
                    className="back-btn"
                    onClick={() => { setVerificationPending(false); setSuccess(null); setError(null); }}
                  >
                    <IconArrowLeft size={14} />
                    Back to {isLogin ? 'Sign In' : 'Sign Up'}
                  </button>
                </div>
              ) : (
                /* ─── Auth Form ─── */
                <>
                  <div className="auth-form-header">
                    <h1 className="auth-form-title">
                      {isLogin ? 'Welcome back' : 'Get started'}
                    </h1>
                    <p className="auth-form-sub">
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                      <a onClick={switchMode}>{isLogin ? 'Create one' : 'Sign in'}</a>
                    </p>
                  </div>

                  {error && (
                    <div className="alert alert-error">
                      <span className="alert-icon"><IconAlertCircle size={16} /></span>
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="alert alert-success">
                      <span className="alert-icon"><IconCheck size={16} /></span>
                      {success}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="field">
                      <label className="field-label">Email address</label>
                      <div className="field-wrap">
                        <span className="field-icon"><IconAt size={16} /></span>
                        <input
                          type="email"
                          className={`field-input${error ? ' error' : ''}`}
                          placeholder="hello@company.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label">Password</label>
                      <div className="field-wrap">
                        <span className="field-icon"><IconLock size={16} /></span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className={`field-input${error ? ' error' : ''}`}
                          placeholder="Your password"
                          style={{ paddingRight: 44 }}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="pw-toggle"
                          onClick={() => setShowPassword(v => !v)}
                          tabIndex={-1}
                        >
                          {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={isProcessing}>
                      {isProcessing ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          {isLogin ? 'Sign in' : 'Create account'}
                          <IconArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="divider">or</div>

                  <div className="mode-switch">
                    {isLogin ? 'New to WOT?' : 'Already have an account?'}{' '}
                    <button onClick={switchMode}>
                      {isLogin ? 'Create an account' : 'Sign in instead'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="auth-legal">
            By continuing, you agree to WOT's{' '}
            <a href="#" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Privacy Policy</a>.
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;