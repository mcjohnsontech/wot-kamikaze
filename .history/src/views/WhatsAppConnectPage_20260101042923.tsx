import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Loader,
  Center,
  Alert,
  Button,
  Tabs,
  TextInput,
  PasswordInput,
  ThemeIcon,
  Divider,
  List,
  Anchor,
  Box,
  rem,
} from '@mantine/core';
import AuthHeader from '../components/AuthHeader';
import {
  IconCheck,
  IconAlertCircle,
  IconPlugConnected,
  IconBrandWhatsapp,
  IconSettings,
  IconTrash,
  IconExternalLink,
  IconLock,
  IconPhone,
  IconKey,
} from '@tabler/icons-react';

interface WhatsAppConfig {
  id: string;
  provider: 'twilio' | 'baileys' | 'evolution';
  is_connected: boolean;
  instance_id?: string;
  connected_at?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const WhatsAppConnectPage: React.FC = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [twilioForm, setTwilioForm] = useState({ accountSid: '', authToken: '', twilioPhoneNumber: '' });
  const [baileysForm, setBaileysForm] = useState({ phoneNumber: '', instanceKey: '' });

  const fetchConfig = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/whatsapp/config`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-sme-id': user.id },
      });
      const json = await response.json();
      if (json.success && json.config) setConfig(json.config);
    } catch (error) {
      console.error('Failed to fetch WhatsApp config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleTwilioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/config/twilio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-sme-id': user?.id || '' },
        body: JSON.stringify(twilioForm),
      });
      const json = await response.json();
      if (json.success) {
        setConfig(json.config);
        setTwilioForm({ accountSid: '', authToken: '', twilioPhoneNumber: '' });
      } else { alert(`Error: ${json.error}`); }
    } finally { setIsSaving(false); }
  };

  const handleBaileysSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/config/instance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-sme-id': user?.id || '' },
        body: JSON.stringify({ provider: 'baileys', ...baileysForm }),
      });
      const json = await response.json();
      if (json.success) {
        setConfig(json.config);
        setBaileysForm({ phoneNumber: '', instanceKey: '' });
      } else { alert(`Error: ${json.error}`); }
    } finally { setIsSaving(false); }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect WhatsApp?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/config`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-sme-id': user?.id || '' },
      });
      const json = await response.json();
      if (json.success) setConfig(null);
    } catch (error) { console.error(error); }
  };

  if (isLoading) {
    return (
      <Center mih="80vh">
        <Stack align="center">
          <Loader size="xl" color="green" variant="dots" />
          <Text c="dimmed" fw={500}>Syncing WhatsApp settings...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <AuthHeader title="WhatsApp Setup" />
        {/* Header Hero */}
        <Paper
          p="xl"
          radius="lg"
          style={{
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            color: 'white',
          }}
        >
          <Group justify="space-between">
            <Box>
              <Title order={1} size="h2" mb={4}>WhatsApp Setup</Title>
              <Text size="sm" opacity={0.9}>
                Communicate with customers directly from your business number
              </Text>
            </Box>
            <ThemeIcon size={60} radius="xl" color="rgba(255,255,255,0.2)">
              <IconBrandWhatsapp size={40} />
            </ThemeIcon>
          </Group>
        </Paper>

        {/* Status Section */}
        {config?.is_connected ? (
          <Alert
            variant="light"
            color="green"
            title="Account Connected"
            icon={<IconCheck size={18} />}
            radius="md"
          >
            <Stack gap="xs" mt="sm">
              <Group gap="xl">
                <Box>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">Provider</Text>
                  <Badge color="green" variant="outline">{config.provider.toUpperCase()}</Badge>
                </Box>
                <Box>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">Number</Text>
                  <Text fw={700}>{config.instance_id || 'Not specified'}</Text>
                </Box>
              </Group>
              <Button
                variant="light"
                color="red"
                size="xs"
                onClick={handleDisconnect}
                leftSection={<IconTrash size={14} />}
                style={{ width: 'fit-content' }}
              >
                Disconnect WhatsApp
              </Button>
            </Stack>
          </Alert>
        ) : (
          <Alert
            variant="light"
            color="orange"
            title="Action Required"
            icon={<IconAlertCircle size={18} />}
            radius="md"
          >
            Your account is not connected. Customers will receive messages from our default system number until you configure a provider.
          </Alert>
        )}

        {/* Configuration Tabs */}
        <Paper withBorder radius="lg" shadow="sm" overflow="hidden">
          <Tabs defaultValue="twilio" variant="outline" radius="lg">
            <Tabs.List grow>
              <Tabs.Tab value="twilio" leftSection={<IconSettings size={16} />} py="md">
                Twilio (Official)
              </Tabs.Tab>
              <Tabs.Tab value="baileys" leftSection={<IconPlugConnected size={16} />} py="md">
                Baileys (Self-Hosted)
              </Tabs.Tab>
            </Tabs.List>

            <Box p="xl">
              <Tabs.Panel value="twilio">
                <form onSubmit={handleTwilioSubmit}>
                  <Stack gap="md">
                    <Box>
                      <Text fw={700} size="sm">Connect via Twilio Business API</Text>
                      <Text size="xs" c="dimmed" mb="sm">
                        Enterprise-grade reliability using Twilio's official cloud.
                      </Text>
                      <Anchor
                        href="https://www.twilio.com/whatsapp"
                        target="_blank"
                        size="xs"
                        underline="hover"
                        display="flex"
                        style={{ alignItems: 'center', gap: rem(4) }}
                      >
                        Create Twilio Account <IconExternalLink size={12} />
                      </Anchor>
                    </Box>

                    <PasswordInput
                      label="Account SID"
                      placeholder="AC..."
                      required
                      leftSection={<IconLock size={16} />}
                      value={twilioForm.accountSid}
                      onChange={(e) => setTwilioForm({ ...twilioForm, accountSid: e.target.value })}
                    />

                    <PasswordInput
                      label="Auth Token"
                      placeholder="Your secret token"
                      required
                      leftSection={<IconKey size={16} />}
                      value={twilioForm.authToken}
                      onChange={(e) => setTwilioForm({ ...twilioForm, authToken: e.target.value })}
                    />

                    <TextInput
                      label="WhatsApp Phone Number"
                      placeholder="+234..."
                      required
                      leftSection={<IconPhone size={16} />}
                      value={twilioForm.twilioPhoneNumber}
                      onChange={(e) => setTwilioForm({ ...twilioForm, twilioPhoneNumber: e.target.value })}
                    />

                    <Button type="submit" loading={isSaving} fullWidth color="blue" radius="md">
                      Connect Twilio Provider
                    </Button>
                  </Stack>
                </form>
              </Tabs.Panel>

              <Tabs.Panel value="baileys">
                <form onSubmit={handleBaileysSubmit}>
                  <Stack gap="md">
                    <Box>
                      <Text fw={700} size="sm">Connect via Baileys API</Text>
                      <Text size="xs" c="dimmed" mb="sm">
                        Uses your personal/business WhatsApp account.
                      </Text>
                    </Box>

                    <TextInput
                      label="Your WhatsApp Number"
                      placeholder="+234..."
                      required
                      leftSection={<IconPhone size={16} />}
                      value={baileysForm.phoneNumber}
                      onChange={(e) => setBaileysForm({ ...baileysForm, phoneNumber: e.target.value })}
                      description="Include country code (e.g. +234)"
                    />

                    <TextInput
                      label="Instance Key"
                      placeholder="API instance key"
                      required
                      leftSection={<IconKey size={16} />}
                      value={baileysForm.instanceKey}
                      onChange={(e) => setBaileysForm({ ...baileysForm, instanceKey: e.target.value })}
                    />

                    <Button type="submit" loading={isSaving} fullWidth color="green" radius="md">
                      Connect Baileys Instance
                    </Button>
                  </Stack>
                </form>
              </Tabs.Panel>
            </Box>
          </Tabs>
        </Paper>

        {/* Footer Info */}
        <Paper withBorder p="lg" radius="lg" bg="var(--mantine-color-gray-0)">
          <Title order={6} mb="xs" c="dimmed" tt="uppercase">Platform Benefits</Title>
          <List
            spacing="xs"
            size="sm"
            center
            icon={
              <ThemeIcon color="green" size={20} radius="xl">
                <IconCheck size={12} />
              </ThemeIcon>
            }
          >
            <List.Item>Send order receipts automatically</List.Item>
            <List.Item>Real-time delivery tracking for customers</List.Item>
            <List.Item>Communicate using your own business identity</List.Item>
            <List.Item>Encrypted and secure API connections</List.Item>
          </List>
        </Paper>
      </Stack>
    </Container>
  );
};

export default WhatsAppConnectPage;