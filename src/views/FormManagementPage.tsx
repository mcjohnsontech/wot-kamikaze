import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Switch,
  LoadingOverlay,
  Badge,
  rem,
  Divider,
  ThemeIcon,
  Center,
} from '@mantine/core';
import AuthHeader from '../components/AuthHeader';
import { IconDeviceFloppy, IconSettings } from '@tabler/icons-react';

// Define the available optional fields matching the database/form_data requirement
const OPTIONAL_FIELDS = [
  { key: 'email', label: 'Customer Email', type: 'email', description: 'Collect customer email address' },
  { key: 'alt_phone', label: 'Alternative Phone', type: 'phone', description: 'Backup contact number' },
  { key: 'landmark', label: 'Nearest Landmark', type: 'text', description: 'Helpful for locating the address' },
  { key: 'delivery_time', label: 'Preferred Delivery Time', type: 'text', description: 'When the customer wants it delivered' },
  { key: 'payment_method', label: 'Payment Method', type: 'select', description: 'Cash, Transfer, or POS' },
  { key: 'item_desc', label: 'Item Description', type: 'textarea', description: 'Details about the package content' },
  { key: 'quantity', label: 'Quantity', type: 'number', description: 'Number of items' },
  { key: 'notes', label: 'Delivery Notes', type: 'textarea', description: 'Extra instructions for the rider' },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const FormManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Store the ID of the default form to update it, rather than creating new ones
  const [defaultFormId, setDefaultFormId] = useState<string | null>(null);

  // State for which fields are active
  const [activeFields, setActiveFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchDefaultForm();
  }, [user?.id]);

  if (!user) return null;

  const fetchDefaultForm = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('wot_auth_token');
      const response = await fetch(`${API_BASE_URL}/forms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-sme-id': user.id
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const json = await response.json();

      const schemas = json.schemas || [];
      // Find a form named "Default Order Form" or take the first one
      const existingForm = schemas.find((f: { name: string; id: string; fields: any[] }) => f.name === 'Default Order Form') || schemas[0];

      if (existingForm) {
        setDefaultFormId(existingForm.id);

        // Parse the existing fields to set active state
        const currentActive: Record<string, boolean> = {};
        if (existingForm.fields && Array.isArray(existingForm.fields)) {
          existingForm.fields.forEach((field: any) => {
            // If the field key exists in our OPTIONAL_FIELDS, mark it as true
            if (OPTIONAL_FIELDS.some(opt => opt.key === field.field_key)) {
              currentActive[field.field_key] = true;
            }
          });
        }
        setActiveFields(currentActive);
      }
    } catch (error) {
      console.error('Failed to fetch form config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleField = (key: string) => {
    setActiveFields(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveConfig = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('wot_auth_token');

      // Construct the fields array based on active toggles
      // We only include the optional fields that are ACTIVE
      // The fixed compulsory fields are handled by the dashboard UI automatically and don't need to be in this list
      // BUT for the sake of the API expecting a schema, we'll send the active optional ones.

      const fieldsToSave = OPTIONAL_FIELDS
        .filter(opt => activeFields[opt.key])
        .map(opt => ({
          field_key: opt.key,
          label: opt.label,
          type: opt.type,
          required: false, // Optional fields are... optional
          options: opt.key === 'payment_method' ? [
            { label: 'Cash', value: 'cash' },
            { label: 'Transfer', value: 'transfer' },
            { label: 'POS', value: 'pos' }
          ] : []
        }));

      const body = {
        name: 'Default Order Form',
        description: 'Standard delivery form with customized optional fields',
        brand_color: '#3b82f6',
        fields: fieldsToSave,
        is_active: true
      };

      const method = defaultFormId ? 'PUT' : 'POST';
      const endpoint = defaultFormId ? `/forms/${defaultFormId}` : '/forms';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-sme-id': user.id,
        },
        body: JSON.stringify(body),
      });

      const json = await response.json();
      if (json.success) {
        // If we just created it, save the ID
        if (!defaultFormId && json.schema?.id) {
          setDefaultFormId(json.schema.id);
        }
        alert('Form configuration saved successfully!');
      } else {
        alert('Failed to save configuration.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <AuthHeader title="Form Settings" />

      <Paper p="xl" radius="lg" withBorder shadow="sm" pos="relative">
        <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

        <Group justify="space-between" mb="xl">
          <div>
            <Title order={3}>Customize Delivery Form</Title>
            <Text c="dimmed">Enable the fields you want to appear on your order creation form.</Text>
          </div>
          <ThemeIcon size={40} radius="md" variant="light" color="blue">
            <IconSettings size={22} />
          </ThemeIcon>
        </Group>

        <Divider mb="lg" label="Compulsory Fields (Always Visible)" labelPosition="center" />

        <Group gap="sm" mb="xl" justify="center">
          {['Customer Name', 'Phone Number', 'Delivery Address', 'Total Price'].map(field => (
            <Badge key={field} size="lg" variant="filled" color="gray" leftSection={<IconDeviceFloppy size={12} />}>
              {field}
            </Badge>
          ))}
        </Group>

        <Divider mb="lg" label="Optional Fields (Toggle On/Off)" labelPosition="center" />

        <Stack gap="lg">
          {OPTIONAL_FIELDS.map((field) => (
            <Paper key={field.key} withBorder p="md" radius="md" style={{ borderColor: activeFields[field.key] ? 'var(--mantine-color-blue-3)' : undefined }}>
              <Group justify="space-between">
                <div>
                  <Text fw={700}>{field.label}</Text>
                  <Text size="sm" c="dimmed">{field.description}</Text>
                </div>
                <Switch
                  size="lg"
                  onLabel="ON"
                  offLabel="OFF"
                  checked={!!activeFields[field.key]}
                  onChange={() => toggleField(field.key)}
                />
              </Group>
            </Paper>
          ))}
        </Stack>

        <Divider my="xl" />

        <Group justify="flex-end">
          <Button
            size="lg"
            radius="md"
            leftSection={<IconDeviceFloppy size={20} />}
            loading={isSaving}
            onClick={handleSaveConfig}
          >
            Save Configuration
          </Button>
        </Group>

      </Paper>
    </Container>
  );
};

export default FormManagementPage;