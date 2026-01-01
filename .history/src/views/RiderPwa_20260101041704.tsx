import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderByToken, useUpdateRiderLocation } from '../hooks/useOrders';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Badge,
  Alert,
  Loader,
  Center,
  TextInput,
  ThemeIcon,
  Box,
  Divider,
  rem,
} from '@mantine/core';
import {
  IconPower,
  IconMapPin,
  IconCheck,
  IconAlertCircle,
  IconNavigation,
  IconCurrencyNaira,
  IconUser,
  IconGps,
  IconShieldLock,
} from '@tabler/icons-react';

const RiderPwa: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error } = useOrderByToken(token);
  const { updateLocation } = useUpdateRiderLocation(order?.id || '');

  const [isTracking, setIsTracking] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const [isCompleting, setIsCompleting] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Start GPS tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }

    setIsTracking(true);
    setGpsStatus('active');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (order?.id) {
          updateLocation(latitude, longitude);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Stop GPS tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setGpsStatus('idle');
  };

  // OTP flow
  const handleMarkDelivered = async () => {
    if (!order) return;
    setIsCompleting(true);

    try {
      if (!otpRequested) {
        const resp = await fetch(`${API_BASE_URL}/orders/${order.id}/otp/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error || 'Failed to generate OTP');

        setOtpRequested(true);
        let msg = 'OTP sent to customer. Enter it below.';
        if (json.debugOtp) msg += ` (Debug: ${json.debugOtp})`;
        setOtpMessage(msg);
      } else {
        const resp = await fetch(`${API_BASE_URL}/orders/${order.id}/otp/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp: otpInput }),
        });
        if (!resp.ok) throw new Error('Invalid OTP');

        stopTracking();
        alert('✅ Delivery completed!');
        navigate('/');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsCompleting(false);
    }
  };

  useEffect(() => {
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  if (isLoading) {
    return (
      <Center mih="100vh" bg="dark.8">
        <Stack align="center">
          <Loader size="xl" color="blue" />
          <Text c="white" fw={500}>Loading Delivery Details...</Text>
        </Stack>
      </Center>
    );
  }

  if (error || !order) {
    return (
      <Center mih="100vh" bg="dark.8" p="md">
        <Paper p="xl" radius="lg" withBorder bg="dark.7" style={{ maxWidth: 400, textAlign: 'center' }}>
          <ThemeIcon size={60} radius="xl" color="red" variant="light" mb="md">
            <IconAlertCircle size={34} />
          </ThemeIcon>
          <Title order={3} c="white" mb="xs">Link Expired</Title>
          <Text c="dimmed" mb="xl">This delivery link is no longer valid or the order was not found.</Text>
          <Button fullWidth radius="md" color="red" onClick={() => navigate('/')}>Return Home</Button>
        </Paper>
      </Center>
    );
  }

  return (
    <Box bg="dark.8" mih="100vh" pb={rem(40)}>
      <Container size="xs" p="md">
        <Stack gap="md">
          {/* Header Hero */}
          <Paper
            p="xl"
            radius="lg"
            style={{
              background: 'linear-gradient(135deg, var(--mantine-color-blue-7) 0%, var(--mantine-color-indigo-8) 100%)',
              color: 'white',
            }}
          >
            <Stack gap={0}>
              <Group justify="space-between" align="flex-start">
                <Title order={1} size="h2">Rider App</Title>
                <Badge variant="white" color="blue">LIVE</Badge>
              </Group>
              <Text opacity={0.8} fw={700}>Order #{order.readable_id}</Text>
            </Stack>
          </Paper>

          {/* Delivery Info */}
          <Paper withBorder p="lg" radius="lg" bg="dark.7">
            <Stack gap="md">
              <Group wrap="nowrap" align="flex-start">
                <ThemeIcon variant="light" color="blue" radius="md"><IconUser size={18}/></ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Customer</Text>
                  <Text fw={700} c="white">{order.customer_name}</Text>
                </Box>
              </Group>

              <Group wrap="nowrap" align="flex-start">
                <ThemeIcon variant="light" color="red" radius="md"><IconMapPin size={18}/></ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Address</Text>
                  <Text size="sm" c="white" fw={500}>{order.delivery_address}</Text>
                </Box>
              </Group>

              <Divider variant="dashed" />

              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Payment</Text>
                  <Text c="teal" fw={800} size="lg">₦{order.price_total.toLocaleString()}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Status</Text>
                  <Badge color="blue">{order.status}</Badge>
                </Box>
              </Group>
            </Stack>
          </Paper>

          {/* Tracking Control */}
          <Paper withBorder p="lg" radius="lg" bg="dark.7">
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <IconGps size={20} color="var(--mantine-color-blue-4)" />
                <Text fw={700} c="white">GPS Broadcast</Text>
              </Group>
              <Badge 
                color={gpsStatus === 'active' ? 'green' : gpsStatus === 'error' ? 'red' : 'gray'} 
                variant="dot"
              >
                {gpsStatus.toUpperCase()}
              </Badge>
            </Group>

            <Button
              fullWidth
              size="lg"
              radius="md"
              variant="gradient"
              gradient={isTracking 
                ? { from: 'red.6', to: 'red.8' } 
                : { from: 'teal.6', to: 'green.7' }
              }
              leftSection={<IconPower size={20} />}
              onClick={isTracking ? stopTracking : startTracking}
            >
              {isTracking ? 'STOP TRACKING' : 'START TRACKING'}
            </Button>

            {isTracking && (
              <Text size="xs" c="green.4" ta="center" mt="sm" fw={600}>
                ● Customer is watching your location
              </Text>
            )}
          </Paper>

          {/* Navigation Button */}
          <Button
            component="a"
            href={`https://www.google.com/maps/search/${encodeURIComponent(order.delivery_address)}`}
            target="_blank"
            size="lg"
            radius="md"
            variant="light"
            color="orange"
            leftSection={<IconNavigation size={20} />}
          >
            Open in Google Maps
          </Button>

          {/* Delivery Confirmation */}
          <Paper withBorder p="lg" radius="lg" bg="dark.7" style={{ border: otpRequested ? `${rem(2)} solid var(--mantine-color-blue-6)` : undefined }}>
            <Stack gap="md">
              {!otpRequested ? (
                <Button
                  size="xl"
                  radius="md"
                  color="green"
                  fullWidth
                  leftSection={<IconCheck size={20} />}
                  onClick={handleMarkDelivered}
                  loading={isCompleting}
                >
                  Send OTP to Confirm
                </Button>
              ) : (
                <Stack gap="sm">
                  <Group gap="xs">
                    <IconShieldLock size={18} color="var(--mantine-color-blue-4)" />
                    <Text fw={700} c="white" size="sm">Verify Delivery</Text>
                  </Group>
                  
                  {otpMessage && <Text size="xs" c="blue.2" ta="center" fw={500}>{otpMessage}</Text>}
                  
                  <TextInput
                    size="lg"
                    radius="md"
                    placeholder="Enter 4-digit code"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    styles={{ input: { textAlign: 'center', fontSize: rem(24), fontWeight: 800, letterSpacing: rem(4) } }}
                  />
                  
                  <Button
                    size="lg"
                    radius="md"
                    fullWidth
                    color="blue"
                    onClick={handleMarkDelivered}
                    loading={isCompleting}
                    disabled={otpInput.length < 4}
                  >
                    Confirm Order Delivery
                  </Button>
                </Stack>
              )}
            </Stack>
          </Paper>

          {/* Support Info */}
          <Text size="xs" c="dimmed" ta="center" px="xl">
            Keep this app open during delivery. Location is only shared while the Start button is active.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
};

export default RiderPwa;