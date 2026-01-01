import React, { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  TextInput,
  Textarea,
  Button,
  ActionIcon,
  Select,
  Switch,
  Divider,
  ThemeIcon,
  Box,
  rem,
  SimpleGrid,
  Tooltip,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconGripVertical,
  IconChevronUp,
  IconChevronDown,
  IconSettings,
  IconForms,
  IconCheck,
  IconDeviceFloppy,
} from '@tabler/icons-react';

interface FormField {
  field_key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'email' | 'phone' | 'date';
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: Record<string, any>;
}

interface FormBuilderProps {
  initialName?: string;
  initialDescription?: string;
  initialFields?: FormField[];
  onSave: (name: string, description: string, fields: FormField[]) => Promise<void>;
  isLoading?: boolean;
}

const FormBuilder: React.FC<FormBuilderProps> = ({
  initialName = '',
  initialDescription = '',
  initialFields = [],
  onSave,
  isLoading = false,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addField = () => {
    const newField: FormField = {
      field_key: `field_${Date.now()}`,
      label: 'New Question',
      type: 'text',
      required: true,
    };
    setFields([...fields, newField]);
    setEditingIndex(fields.length);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const moveField = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === fields.length - 1)) {
      return;
    }
    const updated = [...fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setFields(updated);
    if (editingIndex === index) setEditingIndex(swapIndex);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave(name, description, fields);
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* Header Hero */}
        <Paper
          p="xl"
          radius="lg"
          style={{
            background: 'linear-gradient(135deg, var(--mantine-color-blue-7) 0%, var(--mantine-color-indigo-8) 100%)',
            color: 'white',
          }}
        >
          <Group justify="space-between">
            <Box>
              <Group gap="sm" mb={4}>
                <ThemeIcon size="lg" radius="md" color="rgba(255,255,255,0.2)">
                  <IconForms size={24} />
                </ThemeIcon>
                <Title order={1} size="h2">Form Builder</Title>
              </Group>
              <Text opacity={0.8} size="sm">Create custom data collection flows for your clients</Text>
            </Box>
          </Group>
        </Paper>

        {/* Form Metadata Section */}
        <Paper withBorder p="xl" radius="lg" shadow="sm">
          <Stack gap="md">
            <Group gap="xs" mb="xs">
              <IconSettings size={18} color="var(--mantine-color-blue-6)" />
              <Text fw={700} tt="uppercase" size="xs" lts={1}>Form Identity</Text>
            </Group>
            <TextInput
              label="Form Name"
              placeholder="e.g., Wedding Cake Order Form"
              required
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              radius="md"
            />
            <Textarea
              label="Description"
              placeholder="What should customers know about this form?"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              radius="md"
              autosize
              minRows={2}
            />
          </Stack>
        </Paper>

        {/* Fields Editor Section */}
        <Paper withBorder p="xl" radius="lg" shadow="sm">
          <Group justify="space-between" mb="lg">
            <Group gap="xs">
              <IconPlus size={18} color="var(--mantine-color-blue-6)" />
              <Text fw={700} tt="uppercase" size="xs" lts={1}>Questions ({fields.length})</Text>
            </Group>
          </Group>

          <Stack gap="sm">
            {fields.map((field, index) => (
              <Paper
                key={field.field_key}
                withBorder
                radius="md"
                p="md"
                style={{
                  borderColor: editingIndex === index ? 'var(--mantine-color-blue-5)' : undefined,
                  transition: 'all 0.2s ease',
                  backgroundColor: editingIndex === index ? 'var(--mantine-color-blue-light)' : 'transparent'
                }}
              >
                <Group wrap="nowrap" gap="sm">
                  {/* Reorder Controls */}
                  <Stack gap={0} align="center">
                    <ActionIcon 
                      variant="subtle" 
                      color="gray" 
                      size="sm" 
                      disabled={index === 0}
                      onClick={(e) => moveField(index, 'up', e)}
                    >
                      <IconChevronUp size={14} />
                    </ActionIcon>
                    <IconGripVertical size={18} color="var(--mantine-color-gray-4)" />
                    <ActionIcon 
                      variant="subtle" 
                      color="gray" 
                      size="sm" 
                      disabled={index === fields.length - 1}
                      onClick={(e) => moveField(index, 'down', e)}
                    >
                      <IconChevronDown size={14} />
                    </ActionIcon>
                  </Stack>

                  {/* Field Header Summary */}
                  <Box 
                    style={{ flex: 1, cursor: 'pointer' }} 
                    onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  >
                    <Group gap="xs">
                      <Text fw={700} size="sm">{field.label || 'Untitled Question'}</Text>
                      {field.required && <Badge size="xs" color="red" variant="dot">Required</Badge>}
                    </Group>
                    <Text size="xs" c="dimmed">{field.type.toUpperCase()}</Text>
                  </Box>

                  <Tooltip label="Delete Field">
                    <ActionIcon 
                      variant="light" 
                      color="red" 
                      onClick={(e) => { e.stopPropagation(); removeField(index); }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>

                {/* Expanded Editor Form */}
                {editingIndex === index && (
                  <Box mt="md" pt="md" style={{ borderTop: `${rem(1)} dashed var(--mantine-color-gray-3)` }}>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      <TextInput
                        label="Label / Question"
                        size="sm"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                      />
                      <Select
                        label="Input Type"
                        size="sm"
                        value={field.type}
                        data={[
                          { value: 'text', label: 'Short Text' },
                          { value: 'textarea', label: 'Long Text' },
                          { value: 'number', label: 'Number' },
                          { value: 'email', label: 'Email' },
                          { value: 'phone', label: 'Phone' },
                          { value: 'date', label: 'Date' },
                          { value: 'select', label: 'Dropdown' },
                          { value: 'checkbox', label: 'Checkbox' },
                        ]}
                        onChange={(val) => updateField(index, { type: val as any })}
                      />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="sm">
                      <TextInput
                        label="Placeholder"
                        size="sm"
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                      />
                      <TextInput
                        label="Help Text"
                        size="sm"
                        value={field.help_text || ''}
                        onChange={(e) => updateField(index, { help_text: e.target.value })}
                      />
                    </SimpleGrid>

                    <Group mt="md" justify="space-between">
                      <Switch
                        label="Response Required"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.currentTarget.checked })}
                        size="sm"
                      />
                      <Button 
                        variant="subtle" 
                        size="xs" 
                        onClick={() => setEditingIndex(null)}
                        leftSection={<IconCheck size={14}/>}
                      >
                        Done
                      </Button>
                    </Group>
                  </Box>
                )}
              </Paper>
            ))}

            <Button
              variant="dashed"
              color="gray"
              fullWidth
              py="xl"
              radius="md"
              leftSection={<IconPlus size={18} />}
              onClick={addField}
              styles={{
                label: { fontWeight: 700 }
              }}
            >
              Add New Form Question
            </Button>
          </Stack>
        </Paper>

        {/* Save Action */}
        <Button
          size="xl"
          radius="lg"
          variant="gradient"
          gradient={{ from: 'teal.6', to: 'green.8', deg: 90 }}
          leftSection={<IconDeviceFloppy size={22} />}
          loading={isLoading}
          onClick={handleSave}
          fullWidth
          shadow="md"
        >
          {isLoading ? 'Saving Changes...' : 'Save Form Schema'}
        </Button>
      </Stack>
    </Container>
  );
};

export default FormBuilder;