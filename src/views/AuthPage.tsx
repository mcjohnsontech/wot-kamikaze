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
  Alert,
  Box,
  Divider,
  ThemeIcon,
  rem,
  Anchor,
} from '@mantine/core';
import { 
  IconAlertCircle, 
  IconCheck, 
  IconAt, 
  IconLock, 
  IconRocket, 
  IconMailOpened,
  IconArrowLeft
} from '@tabler/icons-react';
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
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
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
        background: 'linear-gradient(135deg, var(--mantine-color-indigo-9) 0%, var(--mantine-color-violet-9) 100%)',
      }}
    >
      <Container size={420} my={40}>
        {/* App Logo/Branding */}
        <Stack align="center" gap="xs" mb={30}>
          <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconRocket size={34} />
          </ThemeIcon>
          <Title ta="center" c="white" order={1} fw={900} lts={-1}>
            WOT Logistics
          </Title>
          <Text c="indigo.1" size="sm" ta="center" fw={500}>
            The SME Operating System for Deliveries
          </Text>
        </Stack>

        <Paper radius="md" p="xl" withBorder shadow="xl">
          <Title order={2} size="h3" ta="center" mb="md">
            {verificationPending ? 'Verify your email' : isLogin ? 'Welcome back!' : 'Create account'}
          </Title>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mb="lg" radius="md">
              {error}
            </Alert>
          )}

          {success && !verificationPending && (
            <Alert icon={<IconCheck size={16} />} color="green" variant="light" mb="lg" radius="md">
              {success}
            </Alert>
          )}

          {verificationPending ? (
            <Stack align="center" gap="md">
              <ThemeIcon size={80} radius="xl" color="indigo.0" c="indigo.6">
                <IconMailOpened size={44} />
              </ThemeIcon>
              <Text ta="center" size="sm" c="dimmed">
                We've sent a magic link to <Text span fw={700} c="dark">{email}</Text>. 
                Please click the link in the email to activate your account.
              </Text>
              
              <Button 
                variant="light" 
                fullWidth 
                onClick={handleResendVerification} 
                loading={isProcessing}
                radius="md"
              >
                Resend verification email
              </Button>

              <Button 
                variant="subtle" 
                color="gray" 
                size="xs" 
                leftSection={<IconArrowLeft size={14} />}
                onClick={() => {
                  setVerificationPending(false);
                  setSuccess(null);
                }}
              >
                Back to {isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </Stack>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <Stack>
                  <TextInput
                    label="Email address"
                    placeholder="hello@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    leftSection={<IconAt size={16} stroke={1.5} />}
                    radius="md"
                  />
                  <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    leftSection={<IconLock size={16} stroke={1.5} />}
                    radius="md"
                  />
                  
                  <Button 
                    type="submit" 
                    fullWidth 
                    mt="md" 
                    size="md" 
                    radius="md" 
                    loading={isProcessing}
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'cyan' }}
                  >
                    {isLogin ? 'Sign in' : 'Get started'}
                  </Button>
                </Stack>
              </form>

              <Divider label="or" labelPosition="center" my="lg" />

              <Text c="dimmed" size="sm" ta="center">
                {isLogin ? "New to WOT?" : "Already have an account?"}{' '}
                <Anchor
                  size="sm"
                  fw={700}
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  {isLogin ? 'Create account' : 'Sign in instead'}
                </Anchor>
              </Text>
            </>
          )}
        </Paper>

        {/* Footer Legal */}
        <Text ta="center" c="indigo.1" size="xs" mt="xl" opacity={0.7}>
          By continuing, you agree to WOT's Terms of Service and Privacy Policy.
        </Text>
      </Container>
    </Box>
  );
};

export default AuthPage;