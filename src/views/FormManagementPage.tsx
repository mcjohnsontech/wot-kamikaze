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
  LoadingOverlay,
  Badge,
  Divider,
  ThemeIcon,
  Alert,
} from '@mantine/core';
import AuthHeader from '../components/AuthHeader';
import FormBuilder from '../components/FormBuilder';
import { IconSettings, IconAlertCircle } from '@tabler/icons-react';
import type { FormField } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const FormManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Store the ID of the default form to update it, rather than creating new ones
  const [defaultFormId, setDefaultFormId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('Default Order Form');
  const [formDesc, setFormDesc] = useState('Standard delivery form');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formColor, setFormColor] = useState('#3b82f6');

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
      const existingForm = schemas.find((f: any) => f.name === 'Default Order Form') || schemas[0];

      if (existingForm) {
        setDefaultFormId(existingForm.id);
        setFormName(existingForm.name);
        setFormDesc(existingForm.description || '');
        setFormColor(existingForm.brand_color || '#3b82f6');

        // Ensure fields are properly typed
        if (existingForm.fields && Array.isArray(existingForm.fields)) {
          setFormFields(existingForm.fields);
        }
      }
    } catch (error) {
      console.error('Failed to fetch form config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async (name: string, description: string, fields: FormField[], color: string) => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('wot_auth_token');

      const body = {
        name,
        description,
        brand_color: color,
        fields,
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
        // Update local state to match saved
        setFormName(name);
        setFormDesc(description);
        setFormFields(fields);
        setFormColor(color);

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

      <Stack gap="xl">
        <Paper p="xl" radius="lg" withBorder shadow="sm" pos="relative">
          <Group justify="space-between" mb="md">
            <div>
              <Title order={3}>Customize Delivery Form</Title>
              <Text c="dimmed">Design the exact questions you need specifically for your business.</Text>
            </div>
            <ThemeIcon size={40} radius="md" variant="light" color="blue">
              <IconSettings size={22} />
            </ThemeIcon>
          </Group>

          <Alert icon={<IconAlertCircle size={16} />} title="How this works" color="blue" mb="xl">
            The form below shows what you will see when creating orders.
            Use the "Add" buttons at the bottom to create new fields like "Gate Code", "Fragile Item?", etc.
          </Alert>

          <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

          {!isLoading && (
            <FormBuilder
              initialName={formName}
              initialDescription={formDesc}
              initialFields={formFields}
              initialColor={formColor}
              onSave={handleSaveConfig}
              isLoading={isSaving}
            />
          )}
        </Paper>
      </Stack>
    </Container>
  );
};

export default FormManagementPage;