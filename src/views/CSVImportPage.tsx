import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CSVMapper from '../components/CSVMapper';
import AuthHeader from '../components/AuthHeader';
import {
  Container,
  Group,
  Box,
  Title,
  Text,
  Loader,
  Center,
  Paper,
  Alert,
  List,
  ThemeIcon,
  Button,
  SimpleGrid,
  Stack,
  Divider,
} from '@mantine/core';
import { IconInfoCircle, IconFileDownload, IconCheck, IconAlertCircle } from '@tabler/icons-react';

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

const SYSTEM_FIELDS: FormField[] = [
  { field_key: 'customer_name', label: 'Customer Name', type: 'text' },
  { field_key: 'customer_phone', label: 'Phone Number', type: 'phone' },
  { field_key: 'delivery_address', label: 'Delivery Address', type: 'textarea' },
  { field_key: 'price_total', label: 'Total Amount', type: 'number' },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CSVImportPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedSchema, setSelectedSchema] = useState<FormSchema | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [customFields, setCustomFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDefaultFormAndFields();
  }, [user?.id]);

  const fetchDefaultFormAndFields = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('wot_auth_token');
      // 1. Fetch Forms
      const formsRes = await fetch(`${API_BASE_URL}/forms`, {
        headers: { 'x-sme-id': user.id, 'Authorization': `Bearer ${token}` },
      });
      const formsJson = await formsRes.json();
      const schemas = formsJson.schemas || [];

      // 2. Find "Default Order Form" or fallback to first one, or create a dummy one
      const defaultForm = schemas.find((f: any) => f.name === 'Default Order Form') || schemas[0];

      const targetSchemaId = defaultForm?.id || 'STANDARD_IMPORT';
      const targetSchemaName = defaultForm?.name || 'Standard Order Import';

      setSelectedSchema({
        id: targetSchemaId,
        name: targetSchemaName,
        description: defaultForm?.description,
        brand_color: defaultForm?.brand_color
      });

      // 3. If it's a real form, fetch its fields
      let fetchedCustomFields: FormField[] = [];
      if (defaultForm?.id) {
        const fieldsRes = await fetch(`${API_BASE_URL}/forms/${defaultForm.id}`, {
          headers: { 'x-sme-id': user.id, 'Authorization': `Bearer ${token}` },
        });
        const fieldsJson = await fieldsRes.json();
        if (fieldsJson.success) {
          fetchedCustomFields = fieldsJson.schema.fields || [];
        }
      }

      setCustomFields(fetchedCustomFields);
      // 4. Merge System + Custom
      // Filter out any custom fields that might accidentally duplicate system keys
      const uniqueCustom = fetchedCustomFields.filter(cf => !SYSTEM_FIELDS.some(sf => sf.field_key === cf.field_key));
      setFormFields([...SYSTEM_FIELDS, ...uniqueCustom]);

    } catch (error) {
      console.error('Failed to init import page:', error);
      // Fallback to purely standard
      setSelectedSchema({ id: 'STANDARD_IMPORT', name: 'Standard Import' });
      setFormFields(SYSTEM_FIELDS);
      setCustomFields([]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const headers = [...SYSTEM_FIELDS, ...customFields].map(f => f.label);
    const exampleRow = [...SYSTEM_FIELDS, ...customFields].map(f => {
      if (f.field_key === 'price_total') return '1500';
      if (f.field_key === 'customer_phone') return '08012345678';
      if (f.field_key === 'customer_name') return 'John Doe';
      return `Sample ${f.label}`;
    });

    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'delivery_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}><Loader size="xl" variant="bars" /></Center>
      </Container>
    )
  }

  return (
    <Container size="xl" py="xl">
      <AuthHeader title="Bulk Import" />

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {/* Left Column: Instructions */}
        <Box style={{ gridColumn: 'span 1' }}>
          <Stack gap="md">
            <Paper withBorder p="md" radius="md">
              <Group mb="sm">
                <ThemeIcon variant="light" size="lg" radius="md" color="blue">
                  <IconInfoCircle size={20} />
                </ThemeIcon>
                <Text fw={700}>Import Guidelines</Text>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Follow these rules to ensure your orders are imported correctly.
              </Text>

              <Divider label="Required System Fields" labelPosition="left" mb="xs" />
              <List size="sm" spacing="xs" icon={<ThemeIcon color="teal" size={16} radius="xl"><IconCheck size={10} /></ThemeIcon>}>
                <List.Item>
                  <Text span fw={500}>Customer Name</Text>
                </List.Item>
                <List.Item>
                  <Text span fw={500}>Phone Number</Text>
                </List.Item>
                <List.Item>
                  <Text span fw={500}>Delivery Address</Text>
                </List.Item>
                <List.Item>
                  <Text span fw={500}>Total Amount</Text> (Numbers only)
                </List.Item>
              </List>

              {customFields.length > 0 && (
                <>
                  <Divider label="Your Custom Fields" labelPosition="left" my="xs" />
                  <List size="sm" spacing="xs" icon={<ThemeIcon color="blue" size={16} radius="xl"><IconCheck size={10} /></ThemeIcon>}>
                    {customFields.map(f => (
                      <List.Item key={f.field_key}>
                        <Text span fw={500}>{f.label}</Text>
                      </List.Item>
                    ))}
                  </List>
                </>
              )}

              <Button
                variant="light"
                fullWidth
                mt="lg"
                leftSection={<IconFileDownload size={16} />}
                onClick={downloadSampleCSV}
              >
                Download Sample CSV
              </Button>
            </Paper>

            <Alert variant="light" color="orange" title="Tips" icon={<IconAlertCircle size={16} />}>
              <Text size="xs">
                - Ensure your phone numbers are valid.<br />
                - Do not include currency symbols in the Amount column.<br />
                - You can map ANY column name from your CSV to these fields in the next step.
              </Text>
            </Alert>
          </Stack>
        </Box>

        {/* Right Column: Importer */}
        <Box style={{ gridColumn: 'span 2' }}>
          <Paper withBorder p="xl" radius="md" h="100%">
            {selectedSchema && (
              <CSVMapper
                schemaId={selectedSchema.id}
                formFields={formFields}
                onImportComplete={(count) => {
                  // Can add a toast here or redirect if needed, currently just logging
                  console.log('Imported', count);
                }}
              />
            )}
          </Paper>
        </Box>
      </SimpleGrid>
    </Container>
  );
};

export default CSVImportPage;