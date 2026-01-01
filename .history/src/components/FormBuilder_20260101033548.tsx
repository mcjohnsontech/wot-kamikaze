import React, { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  TextInput,
  Textarea,
  Select,
  Switch,
  ActionIcon,
  Tabs,
  ColorInput,
  Divider,
  Box,
  NumberInput,
  rem,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconGripVertical,
  IconChevronUp,
  IconChevronDown,
  IconX,
  IconEye,
  IconSettings,
  IconPalette,
  IconCheck,
  IconAlertCircle,
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
  validation?: {
    min?: number;
    max?: number;
    maxLength?: number;
  };
  logic?: {
    dependsOn?: string;
    showIfValue?: string;
  };
}

interface FormBuilderProps {
  initialName?: string;
  initialDescription?: string;
  initialFields?: FormField[];
  initialColor?: string;
  onSave: (name: string, description: string, fields: FormField[], color: string) => Promise<void>;
  isLoading?: boolean;
}

const FormBuilder: React.FC<FormBuilderProps> = ({
  initialName = '',
  initialDescription = '',
  initialFields = [],
  initialColor = '#3b82f6',
  onSave,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<string | null>('builder');
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [themeColor, setThemeColor] = useState(initialColor);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  const addField = () => {
    const newField: FormField = {
      field_key: `field_${Date.now()}`,
      label: 'New Question',
      type: 'text',
      required: false,
      options: [],
      validation: {},
      logic: {}
    };
    setFields([...fields, newField]);
    setEditingIndex(fields.length);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const moveField = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === fields.length - 1)) return;
    const updated = [...fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setFields(updated);
    if (editingIndex === index) setEditingIndex(swapIndex);
  };

  const isVisible = (field: FormField, data: Record<string, any>) => {
    if (!field.logic?.dependsOn) return true;
    return data[field.logic.dependsOn] === field.logic.showIfValue;
  };

  return (
    <Container size="md" py="xl">
      {/* Header Navigation */}
      <Paper shadow="md" radius="lg" p="xs" mb="xl" withBorder bg="var(--mantine-color-body)">
        <Group justify="space-between">
          <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md">
            <Tabs.List>
              <Tabs.Tab value="builder" leftSection={<IconSettings size={16} />}>
                Builder
              </Tabs.Tab>
              <Tabs.Tab value="preview" leftSection={<IconEye size={16} />}>
                Preview
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Group gap="xs">
            <ColorInput
              size="sm"
              value={themeColor}
              onChange={setThemeColor}
              leftSection={<IconPalette size={16} />}
              style={{ width: 140 }}
            />
            <Button
              leftSection={<IconDeviceFloppy size={18} />}
              loading={isLoading}
              onClick={() => onSave(name, description, fields, themeColor)}
              style={{ backgroundColor: themeColor }}
              radius="md"
            >
              Save Form
            </Button>
          </Group>
        </Group>
      </Paper>

      {activeTab === 'builder' ? (
        <Stack gap="lg">
          {/* Metadata Section */}
          <Paper p="xl" radius="lg" withBorder>
            <Stack gap="xs">
              <TextInput
                variant="unstyled"
                placeholder="Form Title..."
                value={name}
                onChange={(e) => setName(e.target.currentTarget.value)}
                styles={{ input: { fontSize: rem(32), fontWeight: 900 } }}
              />
              <Textarea
                variant="unstyled"
                placeholder="Add a