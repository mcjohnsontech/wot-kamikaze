import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Stepper,
  Button,
  Card,
  Text,
  Title,
  Group,
  Stack,
  Progress,
  Badge,
  Alert,
  LoadingOverlay,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconUpload } from '@tabler/icons-react';
import FormBuilder from '../components/FormBuilder';
import CSVMapper from '../components/CSVMapper';
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
  const [activeStep, setActiveStep] = useState(0);
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
  const [skipCSV, setSkipCSV] = useState(false);

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
        setActiveStep(1);
      } else {
        setError(json.error || 'Failed to save form schema');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCSVImportComplete = async (rowCount: number) => {
    setIsLoading(true);
    try {
      // Mark user as onboarded
      const { error: updateError } = await supabase.auth.updateUser({
        data: { onboarded: true },
      });

      if (!updateError) {
        navigate('/sme', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipCSV = async () => {
    setIsLoading(true);
    try {
      // Mark user as onboarded without CSV import
      const { error: updateError } = await supabase.auth.updateUser({
        data: { onboarded: true },
      });

      if (!updateError) {
        navigate('/sme', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="xl" py="xl" pos="relative">
      <LoadingOverlay visible={isLoading} zIndex={1000} />

      {/* Header */}
      <Stack gap="xl" mb="xl">
        <div>
          <Title order={1} size="h2" mb="xs">
            Welcome to WOT! 🚀
          </Title>
          <Text c="dimmed" size="lg">
            Let's set up your delivery management system in just a few steps.
          </Text>
        </div>

        <Progress value={(activeStep + 1) * 50} color="blue" size="lg" />

        {/* Stepper */}
        <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false}>
          <Stepper.Step label="Customize Form" description="Set up your order fields">
            <Stack gap="lg" mt="lg">
              <Alert icon={<IconAlertCircle />} title="Create Your Order Form" color="blue">
                Customize the fields that will appear when you create orders. These fields help you capture all
                the information you need for each delivery.
              </Alert>
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
          </Stepper.Step>

          <Stepper.Step label="Import Data (Optional)" description="Migrate your existing orders">
            <Stack gap="lg" mt="lg">
              <Alert icon={<IconAlertCircle />} title="Bulk Import" color="blue">
                If you have existing order data in a CSV file, you can import it now. Otherwise, you can skip
                this step and start creating orders manually.
              </Alert>

              {error && (
                <Alert icon={<IconAlertCircle />} title="Error" color="red">
                  {error}
                </Alert>
              )}

              <Card withBorder padding="lg" radius="md">
                {!skipCSV ? (
                  <CSVMapper
                    schemaId={formSchema.name}
                    formFields={formSchema.fields}
                    onImportComplete={handleCSVImportComplete}
                  />
                ) : (
                  <Stack align="center" gap="lg" py="xl">
                    <IconCheck size={48} color="green" />
                    <Text size="lg" fw={500}>
                      Ready to go! Skip CSV import
                    </Text>
                    <Text c="dimmed" size="sm" ta="center">
                      You can import data later from the CSV Import page in your dashboard.
                    </Text>
                  </Stack>
                )}
              </Card>

              <Group justify="space-between">
                <Button variant="light" onClick={() => setActiveStep(0)}>
                  Back
                </Button>
                {!skipCSV && (
                  <Button variant="subtle" onClick={() => setSkipCSV(true)}>
                    Skip CSV Import
                  </Button>
                )}
                {skipCSV && (
                  <Button onClick={handleSkipCSV} loading={isLoading} color="green">
                    Complete Setup
                  </Button>
                )}
              </Group>
            </Stack>
          </Stepper.Step>
        </Stepper>
      </Stack>

      {/* Progress Indicator */}
      {activeStep === 0 && (
        <Group justify="center" mt="xl">
          <Badge size="lg" color="blue">
            Step 1 of 2
          </Badge>
        </Group>
      )}
      {activeStep === 1 && (
        <Group justify="center" mt="xl">
          <Badge size="lg" color="blue">
            Step 2 of 2
          </Badge>
        </Group>
      )}
    </Container>
  );
};

export default OnboardingWizard;
