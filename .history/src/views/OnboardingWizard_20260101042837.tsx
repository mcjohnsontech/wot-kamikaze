import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Button,
  Card,
  Text,
  Title,
  Stack,
  Alert,
  LoadingOverlay,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import FormBuilder from '../components/FormBuilder';
import AuthHeader from '../components/AuthHeader';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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
  name: string;
  description: string;
  fields: FormField[];
  brand_color: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formSchema, setFormSchema] = useState<FormSchema>({
    name: 'Order Form',
    description: 'Collect order details',
    fields: [
      {
        field_key: 'customer_name',
        label: 'Customer Name',
        type: 'text',
        required: true,
        placeholder: 'Enter customer name',
      },
      {
        field_key: 'customer_phone',
        label: 'Phone Number',
        type: 'phone',
        required: true,
        placeholder: '+234...',
      },
      {
        field_key: 'delivery_address',
        label: 'Delivery Address',
        type: 'text',
        required: true,
        placeholder: 'Enter delivery address',
      },
      {
        field_key: 'price_total',
        label: 'Amount (₦)',
        type: 'number',
        required: true,
        placeholder: '0',
      },
    ],
    brand_color: '#3b82f6',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const handleFormSave = async (name: string, description: string, fields: FormField[], brandColor: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const schema = {
        name,
        description,
        fields,
        brand_color: brandColor,
      };
      setFormSchema(schema);
      
      // Save form schema to backend
      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sme-id': user?.id || '',
        },
        body: JSON.stringify(schema),
      });

      const json = await response.json();
      if (json.success) {
        // Mark user as onboarded and navigate to SME dashboard
        try {
          const { error: updateError } = await supabase.auth.updateUser({ data: { onboarded: true } });
          if (updateError) {
            setError(updateError.message || 'Failed to mark user as onboarded');
          } else {
            navigate('/sme', { replace: true });
          }
        } catch (uErr) {
          setError(uErr instanceof Error ? uErr.message : 'Failed to complete onboarding');
        }
      } else {
        setError(json.error || 'Failed to save form schema');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // onboarding now only customizes the form; saving will mark user onboarded

  return (
    <Container size="xl" py="xl" pos="relative">
      <AuthHeader title="Setup Order Form" />
      <LoadingOverlay visible={isLoading} zIndex={1000} />

      <Stack gap="md" mb="lg">
        <div>
          <Title order={1} size="h2" mb="xs">
            Customize Your Order Form
          </Title>
          <Text c="dimmed" size="lg">
            Select the fields you want on your order form. These will be the questions shown when creating orders.
          </Text>
        </div>

        <Alert icon={<IconAlertCircle />} title="Create Your Order Form" color="blue">
          Choose only the fields you need. This controls the form displayed on your SME dashboard when creating orders.
        </Alert>

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        <Card withBorder padding="lg" radius="md">
          <FormBuilder
            initialName={formSchema.name}
            initialDescription={formSchema.description}
            initialFields={formSchema.fields}
            initialColor={formSchema.brand_color}
            onSave={handleFormSave}
            isLoading={isLoading}
          />
        </Card>
      </Stack>
    </Container>
  );
};

export default OnboardingWizard;
