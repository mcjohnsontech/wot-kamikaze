import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CSVMapper from '../components/CSVMapper';
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
  Grid,
  ThemeIcon,
  ActionIcon,
  Divider,
  Box,
  rem,
  UnstyledButton,
  List,
} from '@mantine/core';
import {
  IconDownload,
  IconFileSpreadsheet,
  IconAlertCircle,
  IconArrowLeft,
  IconChevronRight,
  IconBulb,
  IconFileTypeCsv,
} from '@tabler/icons-react';
import Papa from 'papaparse';

interface FormSchema {
  id: string;
  name: string;
  description?: string;
  brand_color?: string;
}

interface FormField {
  id?: string;
  field_key: string;
  label: string;
  type: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CSVImportPage: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<FormSchema | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingFields, setIsFetchingFields] = useState(false);

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

  const handleSelectSchema = async (schema: FormSchema) => {
    try {
      setIsFetchingFields(true);
      const response = await fetch(`${API_BASE_URL}/forms/${schema.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-sme-id': user?.id || '',
        },
      });

      const json = await response.json();
      if (json.success) {
        setFormFields(json.schema.fields || []);
        setSelectedSchema(schema);
      }
    } catch (error) {
      console.error('Failed to fetch form fields:', error);
    } finally {
      setIsFetchingFields(false);
    }
  };

  const downloadTemplate = (e: React.MouseEvent, schema: FormSchema, fields: FormField[]) => {
    e.stopPropagation();
    const headers = fields.map((f) => f.label);
    const csvContent = Papa.unparse([headers]);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${schema.name.replace(/\s+/g, '_')}_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDERING: Mapping View ---
  if (selectedSchema && formFields.length > 0) {
    return (
      <Container size="md" py="xl">
        <Group justify="space-between" mb="xl">
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => {
              setSelectedSchema(null);
              setFormFields([]);
            }}
          >
            Back to Selection
          </Button>
          <Box ta="right">
            <Text size="xs" fw={900} c="indigo" tt="uppercase" lts={1}>
              Target Form
            </Text>
            <Title order={3}>{selectedSchema.name}</Title>
          </Box>
        </Group>

        <CSVMapper
          schemaId={selectedSchema.id}
          formFields={formFields}
          onImportComplete={() => {
            setSelectedSchema(null);
            setFormFields([]);
          }}
        />
      </Container>
    );
  }

  // --- RENDERING: Selection View ---
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header Hero */}
        <Paper
          p={rem(40)}
          radius="lg"
          shadow="md"
          style={{
            background: 'linear-gradient(135deg, var(--mantine-color-indigo-7) 0%, var(--mantine-color-violet-8) 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box style={{ position: 'relative', zIndex: 2 }}>
            <Group gap="md" mb="xs">
              <ThemeIcon size={44} radius="md" variant="white" color="indigo">
                <IconFileSpreadsheet size={28} />
              </ThemeIcon>
              <Title order={1} size={rem(36)} fw={900}>
                Bulk Order Import
              </Title>
            </Group>
            <Text size="lg" opacity={0.9} maw={600}>
              Select a form schema below to begin mapping your spreadsheet columns to our custom form fields.
            </Text>
          </Box>
          <IconFileTypeCsv
            size={200}
            style={{
              position: 'absolute',
              right: rem(-20),
              bottom: rem(-40),
              opacity: 0.1,
              transform: 'rotate(-15deg)',
            }}
          />
        </Paper>

        <Grid gutter="xl">
          {/* Sidebar Tips */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder p="xl" radius="lg" bg="var(--mantine-color-gray-0)">
              <Group mb="lg" gap="xs">
                <IconBulb color="var(--mantine-color-indigo-6)" size={20} />
                <Text fw={700} tt="uppercase" size="xs" lts={1}>
                  Importing Guide
                </Text>
              </Group>

              <List
                spacing="md"
                size="sm"
                center
                icon={
                  <ThemeIcon color="indigo" size={20} radius="xl">
                    <Text size="xs" fw={900}>
                      !
                    </Text>
                  </ThemeIcon>
                }
              >
                <List.Item>
                  Use the <b>Template</b> button on each form to get the correct column headers.
                </List.Item>
                <List.Item>
                  Ensure all <b>Required</b> form fields have a matching column in your CSV.
                </List.Item>
                <List.Item>
                  Dates are best recognized in <b>YYYY-MM-DD</b> format.
                </List.Item>
              </List>
            </Paper>
          </Grid.Col>

          {/* Form Selection List */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Text size="xs" fw={900} c="dimmed" tt="uppercase" lts={2} mb="xs">
                Select Target Schema
              </Text>

              {isLoading ? (
                <Center py={100}>
                  <Stack align="center" gap="xs">
                    <Loader size="lg" color="indigo" />
                    <Text fw={700} c="dimmed">
                      Loading your forms...
                    </Text>
                  </Stack>
                </Center>
              ) : forms.length === 0 ? (
                <Paper withBorder p={50} radius="lg" style={{ borderStyle: 'dashed' }} bg="transparent">
                  <Stack align="center" gap="xs" ta="center">
                    <IconAlertCircle size={40} opacity={0.3} />
                    <Text fw={700} c="dimmed">
                      No active forms available
                    </Text>
                    <Text size="sm" c="dimmed">
                      Create a custom form in the Management tab first.
                    </Text>
                  </Stack>
                </Paper>
              ) : (
                forms.map((form) => (
                  <Paper
                    key={form.id}
                    withBorder
                    radius="lg"
                    shadow="xs"
                    style={{ overflow: 'hidden' }}
                  >
                    <UnstyledButton
                      onClick={() => !isFetchingFields && handleSelectSchema(form)}
                      style={{ width: '100%' }}
                      p="lg"
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="lg">
                          <ThemeIcon size={50} radius="md" color="indigo" variant="light">
                            <IconFileSpreadsheet size={26} />
                          </ThemeIcon>
                          <Box>
                            <Text fw={800} size="lg">
                              {form.name}
                            </Text>
                            <Text size="sm" c="dimmed" lineClamp={1}>
                              {form.description || 'No description provided'}
                            </Text>
                          </Box>
                        </Group>

                        <Group gap="sm">
                          <Button
                            size="compact-xs"
                            variant="light"
                            color="gray"
                            leftSection={<IconDownload size={14} />}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const resp = await fetch(`${API_BASE_URL}/forms/${form.id}`, {
                                headers: { 'x-sme-id': user?.id || '' },
                              });
                              const data = await resp.json();
                              if (data.success) downloadTemplate(e, form, data.schema.fields);
                            }}
                          >
                            Template
                          </Button>
                          <ThemeIcon variant="transparent" color="indigo">
                            <IconChevronRight size={20} />
                          </ThemeIcon>
                        </Group>
                      </Group>
                    </UnstyledButton>
                  </Paper>
                ))
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};

export default CSVImportPage;