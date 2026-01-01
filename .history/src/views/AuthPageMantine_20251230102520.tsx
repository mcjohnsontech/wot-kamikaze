import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  TextInput,
  PasswordInput,
  Tabs,
  Alert,
  Loader,
  Center,
  Box,
  Divider,
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
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

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsProcessing(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;

        if (!data?.user?.email_confirmed_at) {
          setVerificationPending(true);
          setSuccess('Email verification required. Check your inbox for verification link.');
          setIsProcessing(false);
          return;
        }

        const token = data?.session?.access_token;
        const user = data?.user;
        login(token ?? '', {
          id: user?.id ?? 'unknown',
          name: (user?.user_metadata as any)?.name || user?.email || 'SME',
        });
        const hasOnboarded = user?.user_metadata?.onboarded;
        navigate(hasOnboarded ? '/sme' : '/onboarding', { replace: true });
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (authError) throw authError;

        if (!data?.session) {
          setVerificationPending(true);
          setSuccess('Account created! Please verify your email before signing in. Check your inbox for the verification link.');
          setEmail('');
          setPassword('');
          setIsProcessing(false);
          return;
        }

        const token = data?.session?.access_token;
        const user = data?.user;
        login(token ?? '', {
          id: user?.id ?? 'unknown',
          name: (user?.user_metadata as any)?.name || user?.email || 'SME',
        });
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
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
      p="xl"
    >
      <Container size="sm">
        <Paper radius="lg" p="xl" shadow="xl" withBorder>
          {/* Logo/Header */}
          <Stack align="center" mb="xl">
            <Title order={1} size="h2">
              🚀 WOT
            </Title>
            <Text c="dimmed" ta="center">
              {isLogin ? 'Sign in to your SME Dashboard' : 'Create your account to get started'}
            </Text>
          </Stack>

          {/* Alerts */}
          {error && <Alert icon={<IconAlertCircle />} title="Error" color="red" mb="lg">{error}</Alert>}
          {success && <Alert icon={<IconCheck />} title="Success" color="green" mb="lg">{success}</Alert>}

          {/* Auth Form */}
          {verificationPending ? (
            <Stack gap="lg" align="center">
              <Text ta="center" c="dimmed">
                A verification link has been sent to your email. Please check your inbox to verify your account.
              </Text>
              <Button onClick={handleResendVerification} loading={isProcessing} variant="light">
                Resend Verification Email
              </Button>
              <Divider label="or" />
              <Button
                fullWidth
                variant="subtle"
                onClick={() => {
                  setVerificationPending(false);
                  setEmail('');
                  setPassword('');
                }}
              >
                Back to {isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </Stack>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack gap="lg">
                <TextInput
                  label="Email"
                  placeholder="your@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  disabled={isProcessing}
                />
                <PasswordInput
                  label="Password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  disabled={isProcessing}
                />
                <Button
                  fullWidth
                  loading={isProcessing}
                  type="submit"
                  size="lg"
                  color="violet"
                >
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Button>
              </Stack>
            </form>
          )}

          {/* Toggle Auth Mode */}
          <Divider my="lg" />
          <Text ta="center" size="sm" c="dimmed" mb="lg">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <Text
              component="button"
              c="violet"
              fw={600}
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccess(null);
                setEmail('');
                setPassword('');
              }}
              style={{ cursor: 'pointer', border: 'none', background: 'none' }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Text>
          </Text>
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthPage;
