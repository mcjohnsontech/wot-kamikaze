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
                onChange={(e) => setName(e.currentTarget.value)}
                styles={{ input: { fontSize: rem(32), fontWeight: 900 } }}
              />
              <Textarea
                variant="unstyled"
                placeholder="Add a description for your form..."
                value={description}
                onChange={(e) => setDescription(e.currentTarget.value)}
                autosize
                minRows={1}
                styles={{ input: { fontSize: rem(16), color: 'var(--mantine-color-dimmed)' } }}
              />
            </Stack>
          </Paper>

          {/* Fields List */}
          <Stack gap="md">
            {fields.map((field, idx) => (
              <Paper
                key={field.field_key}
                radius="lg"
                withBorder
                style={{
                  borderLeft: editingIndex === idx ? `${rem(6)} solid ${themeColor}` : undefined,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Field Header */}
                <Group p="md" wrap="nowrap" align="center">
                  <Stack gap={0} align="center" style={{ opacity: 0.3 }}>
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={(e) => moveField(idx, 'up', e)}>
                      <IconChevronUp size={14} />
                    </ActionIcon>
                    <IconGripVertical size={20} />
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={(e) => moveField(idx, 'down', e)}>
                      <IconChevronDown size={14} />
                    </ActionIcon>
                  </Stack>

                  <Box style={{ flex: 1, cursor: 'pointer' }} onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}>
                    <Group gap="xs" mb={4}>
                      <Badge size="xs" variant="filled" color="gray">{field.type}</Badge>
                      {field.required && <Badge size="xs" color="red" variant="dot">Required</Badge>}
                    </Group>
                    <Text fw={700}>{field.label || 'New Question'}</Text>
                  </Box>

                  <ActionIcon 
                    variant="light" 
                    color="red" 
                    onClick={() => setFields(fields.filter((_, i) => i !== idx))}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>

                {/* Editor Body */}
                {editingIndex === idx && (
                  <Box px="xl" pb="xl">
                    <Divider mb="xl" label="Configuration" labelPosition="center" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                      <Stack gap="md">
                        <Title order={6} c="dimmed" tt="uppercase" lts={1}>Basic Settings</Title>
                        <TextInput
                          label="Field Label"
                          value={field.label}
                          onChange={(e) => updateField(idx, { label: e.target.value })}
                        />
                        <TextInput
                          label="Placeholder Text"
                          value={field.placeholder}
                          onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                        />
                        <Switch
                          label="Mark as Required"
                          checked={field.required}
                          onChange={(e) => updateField(idx, { required: e.currentTarget.checked })}
                        />
                      </Stack>

                      <Stack gap="md">
                        <Title order={6} c="dimmed" tt="uppercase" lts={1}>Validation & Logic</Title>
                        
                        {field.type === 'number' && (
                          <Group grow>
                            <NumberInput label="Min" onChange={(val) => updateField(idx, { validation: { ...field.validation, min: Number(val) }})} />
                            <NumberInput label="Max" onChange={(val) => updateField(idx, { validation: { ...field.validation, max: Number(val) }})} />
                          </Group>
                        )}

                        <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-gray-light)">
                          <Text size="xs" fw={700} c="blue" mb="xs">CONDITIONAL LOGIC</Text>
                          <Group grow align="flex-end">
                            <Select
                              label="Depends on"
                              placeholder="Choose field"
                              size="xs"
                              value={field.logic?.dependsOn}
                              data={fields
                                .filter(f => f.field_key !== field.field_key && f.type === 'select')
                                .map(f => ({ value: f.field_key, label: f.label }))}
                              onChange={(val) => updateField(idx, { logic: { ...field.logic, dependsOn: val || undefined }})}
                            />
                            {field.logic?.dependsOn && (
                              <TextInput
                                label="Matches value"
                                size="xs"
                                onChange={(e) => updateField(idx, { logic: { ...field.logic, showIfValue: e.target.value }})}
                              />
                            )}
                          </Group>
                        </Paper>
                      </Stack>
                    </div>

                    {field.type === 'select' && (
                      <Box mt="xl">
                        <Divider mb="md" variant="dashed" />
                        <Group justify="space-between" mb="xs">
                          <Text size="xs" fw={700} tt="uppercase">Options</Text>
                          <Button variant="subtle" size="compact-xs" leftSection={<IconPlus size={12}/>} onClick={() => updateField(idx, { options: [...(field.options || []), { label: '', value: '' }] })}>
                            Add Option
                          </Button>
                        </Group>
                        <Group gap="xs">
                          {field.options?.map((opt, oIdx) => (
                            <Paper key={oIdx} withBorder p={4} pr={0} radius="sm">
                              <Group gap={4}>
                                <TextInput
                                  variant="unstyled"
                                  placeholder="Option..."
                                  size="xs"
                                  px="xs"
                                  value={opt.label}
                                  onChange={(e) => {
                                    const newOpts = [...(field.options || [])];
                                    newOpts[oIdx] = { label: e.target.value, value: e.target.value };
                                    updateField(idx, { options: newOpts });
                                  }}
                                />
                                <ActionIcon color="red" variant="subtle" size="sm" onClick={() => updateField(idx, { options: field.options?.filter((_, i) => i !== oIdx) })}>
                                  <IconX size={12}/>
                                </ActionIcon>
                              </Group>
                            </Paper>
                          ))}
                        </Group>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            ))}

            <Button
              variant="dashed"
              color="gray"
              fullWidth
              py="xl"
              radius="lg"
              leftSection={<IconPlus size={24} />}
              onClick={addField}
              styles={{ inner: { flexDirection: 'column', gap: rem(8) }, label: { fontSize: rem(14), fontWeight: 800 } }}
            >
              ADD NEW QUESTION
            </Button>
          </Stack>
        </Stack>
      ) : (
        /* Preview Mode */
        <Paper shadow="xl" radius="xl" p={rem(50)} withBorder>
          <Box mb={50} style={{ borderBottom: `${rem(4)} solid ${themeColor}`, paddingBottom: rem(20) }}>
            <Title order={1} size={rem(48)} fw={900}>{name || 'Untitiled Form'}</Title>
            <Text size="lg" c="dimmed">{description || 'No description provided'}</Text>
          </Box>

          <Stack gap={40}>
            {fields.map((field) => {
              if (!isVisible(field, previewData)) return null;

              return (
                <Stack key={field.field_key} gap="xs">
                  <Text fw={700} size="lg">
                    {field.label} {field.required && <Text span c="red">*</Text>}
                  </Text>
                  
                  {field.type === 'select' ? (
                    <Select
                      size="md"
                      radius="md"
                      placeholder="Select option..."
                      data={field.options?.map(o => ({ value: o.value, label: o.label }))}
                      onChange={(val) => setPreviewData({ ...previewData, [field.field_key]: val })}
                    />
                  ) : field.type === 'textarea' ? (
                    <Textarea size="md" radius="md" placeholder={field.placeholder} minRows={4} />
                  ) : (
                    <TextInput
                      size="md"
                      radius="md"
                      type={field.type}
                      placeholder={field.placeholder}
                      onChange={(e) => setPreviewData({ ...previewData, [field.field_key]: e.target.value })}
                    />
                  )}

                  {field.logic?.dependsOn && (
                    <Group gap={4} c="blue">
                      <IconAlertCircle size={14} />
                      <Text size="xs" fw={700}>Conditional Logic Active</Text>
                    </Group>
                  )}
                </Stack>
              );
            })}

            <Button
              fullWidth
              size="xl"
              radius="xl"
              style={{ backgroundColor: themeColor }}
              mt="xl"
            >
              Submit Response
            </Button>
          </Stack>
        </Paper>
      )}
    </Container>
  );
};

export default FormBuilder;