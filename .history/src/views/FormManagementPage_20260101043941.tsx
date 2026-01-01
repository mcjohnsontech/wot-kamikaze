import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FormBuilder from '../components/FormBuilder';
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
  SimpleGrid,
  ThemeIcon,
  ActionIcon,
  Box,
  rem,
  Divider,
  Tooltip,
} from '@mantine/core';
import AuthHeader from '../components/AuthHeader';
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconArrowLeft,
  IconFileText,
  IconCalendar,
  IconAlertCircle,
  IconLayersIntersect,
} from '@tabler/icons-react';

interface FormField {
  field_key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'email' | 'phone' | 'date';
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: any;
  logic?: any;
}

interface FormSchema {
  id: string;
  name: string;
  description?: string;
  brand_color?: string;
  version: number;
  is_active: boolean;
  created_at: string;
  fields?: FormField[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const FormManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [editingForm, setEditingForm] = useState<FormSchema | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchForms();
  }, [user?.id]);

  const fetchForms = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/forms`, {
        headers: { 'x-sme-id': user.id },
      });
      const json = await response.json();
      if (json.success) setForms(json.schemas || []);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = async (formId: string) => {
    try {
      setIsFetchingDetails(true);
      const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
        headers: { 'x-sme-id': user?.id || '' },
      });
      const json = await response.json();
      if (json.success) {
        setEditingForm(json.schema);
      }
    } catch (error) {
      console.error("Error loading form:", error);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleSaveForm = async (name: string, description: string, fields: FormField[], brandColor: string) => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const method = editingForm ? 'PUT' : 'POST';
      const endpoint = editingForm ? `/forms/${editingForm.id}` : '/forms';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-sme-id': user.id,
        },
        body: JSON.stringify({ name, description, fields, brand_color: brandColor }),
      });

      const json = await response.json();
      if (json.success) {
        setEditingForm(null);
        setIsCreating(false);
        fetchForms();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!user?.id || !window.confirm('Delete this form? Previous responses will be hidden.')) return;
    try {
      await fetch(`${API_BASE_URL}/forms/${formId}`, {
        method: 'DELETE',
        headers: { 'x-sme-id': user.id },
      });
      fetchForms();
    } catch (error) {
      console.error(error);
    }
  };

  if (isCreating || editingForm) {
    return (
      <Container size="lg" py="xl">
        <AuthHeader title={editingForm ? editingForm.name : 'Create Form'} />
        <Button
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => { setIsCreating(false); setEditingForm(null); }}
          mb="xl"
        >
          Back to Dashboard
        </Button>
        
        <FormBuilder
          initialName={editingForm?.name}
          initialDescription={editingForm?.description}
          initialFields={editingForm?.fields}
          initialColor={editingForm?.brand_color}
          onSave={handleSaveForm}
          isLoading={isSaving}
        />
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Page Header */}
        <Paper
          withBorder
          p="xl"
          radius="lg"
          shadow="sm"
          bg="var(--mantine-color-body)"
        >
          <Group justify="space-between">
            <Box>
              <Group gap="sm">
                <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                  <IconFileText size={24} />
                </ThemeIcon>
                <Title order={1} size="h2" fw={900}>Custom Forms</Title>
              </Group>
              <Text c="dimmed" mt="xs">
                Design and manage bespoke data collection flows for your clients.
              </Text>
            </Box>
            <Button
              size="lg"
              radius="md"
              leftSection={<IconPlus size={20} />}
              onClick={() => setIsCreating(true)}
            >
              Create New Form
            </Button>
          </Group>
        </Paper>

        {/* Dashboard Content */}
        {isLoading ? (
          <Center py={100}>
            <Stack align="center" gap="xs">
              <Loader size="lg" />
              <Text fw={700} c="dimmed">Loading your forms...</Text>
            </Stack>
          </Center>
        ) : forms.length === 0 ? (
          <Paper
            withBorder
            p={100}
            radius="lg"
            style={{ borderStyle: 'dashed' }}
            bg="transparent"
          >
            <Stack align="center" gap="md">
              <ThemeIcon variant="light" size={80} radius="xl" color="gray">
                <IconPlus size={40} />
              </ThemeIcon>
              <Box ta="center">
                <Title order={3} c="gray.7">No forms found</Title>
                <Text c="dimmed">Start by creating a form to collect customer requirements.</Text>
              </Box>
              <Button variant="outline" onClick={() => setIsCreating(true)}>
                Build your first form
              </Button>
            </Stack>
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {forms.map((form) => {
              const typedForm = form as FormSchema;
              return (
              <Paper
                key={form.id}
                withBorder
                radius="lg"
                p="lg"
                shadow="xs"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                {/* Visual Accent Stripe */}
                <Box
                  h={6}
                  mb="md"
                  style={{
                    backgroundColor: form.brand_color || 'var(--mantine-color-blue-filled)',
                    borderRadius: rem(10)
                  }}
                />

                <Group justify="space-between" align="flex-start" mb="xs">
                  <Title order={4} lineClamp={1} style={{ flex: 1 }}>{form.name}</Title>
                  {!form.is_active && (
                    <Badge color="red" variant="light">Inactive</Badge>
                  )}
                </Group>

                <Text size="sm" c="dimmed" mb="xl" lineClamp={2} style={{ flex: 1 }}>
                  {form.description || 'No description provided.'}
                </Text>

                <Divider variant="dashed" mb="md" />

                <Group justify="space-between" mb="lg">
                  <Group gap={8}>
                    <Tooltip label="Creation Date">
                      <ThemeIcon variant="transparent" color="gray" size="sm">
                        <IconCalendar size={14} />
                      </ThemeIcon>
                    </Tooltip>
                    <Text size="xs" fw={700} c="dimmed">
                      {new Date(form.created_at).toLocaleDateString()}
                    </Text>
                  </Group>
                  <Badge variant="outline" color="gray" radius="sm">v{form.version}</Badge>
                </Group>

                <Group gap="sm">
                  <Button
                    flex={1}
                    variant="light"
                    radius="md"
                    loading={isFetchingDetails && editingForm?.id === form.id}
                    leftSection={<IconEdit size={16} />}
                    onClick={() => handleEditClick(form.id)}
                  >
                    Edit
                  </Button>
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="lg"
                    radius="md"
                    onClick={() => handleDeleteForm(form.id)}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
};

export default FormManagementPage;