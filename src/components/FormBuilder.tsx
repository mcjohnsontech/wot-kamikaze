import React, { useState } from 'react';
import {
    Paper,
    TextInput,
    Textarea,
    Button,
    Stack,
    Text,
    ColorInput,
    Group,
    Divider,
    Badge,
    ActionIcon,
    Tooltip
} from '@mantine/core';
import { IconDeviceFloppy, IconTrash, IconPlus } from '@tabler/icons-react';

import type { FormField } from '../types';

interface FormBuilderProps {
    initialName: string;
    initialDescription: string;
    initialFields: FormField[];
    initialColor: string;
    onSave: (name: string, description: string, fields: FormField[], color: string) => void;
    isLoading: boolean;
}

const FormBuilder: React.FC<FormBuilderProps> = ({
    initialName,
    initialDescription,
    initialFields,
    initialColor,
    onSave,
    isLoading
}) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [color, setColor] = useState(initialColor);
    const [fields, setFields] = useState<FormField[]>(initialFields);

    // Helper to generate a unique key for new fields
    const generateFieldKey = (label: string) => {
        return label.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 5);
    };

    const addField = (type: FormField['type']) => {
        const newField: FormField = {
            field_key: generateFieldKey('New Field'),
            label: 'New Question',
            type,
            required: false,
            options: type === 'select' || type === 'checkbox' ? [{ label: 'Option 1', value: 'option_1' }] : undefined,
        };
        setFields([...fields, newField]);
    };

    const removeField = (index: number) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        setFields(newFields);
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };

        // If label changes, should we update key? 
        // Better NOT to update key once created to avoid losing data on rename, 
        // unless it's a brand new unsaved field. For now, let's keep key stable.

        setFields(newFields);
    };

    const handleSave = () => {
        onSave(name, description, fields, color);
    };

    return (
        <Stack gap="lg">
            <Paper withBorder p="md" radius="md">
                <Stack gap="md">
                    <Text fw={700} size="lg">Form Settings</Text>
                    <TextInput
                        label="Form Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <Textarea
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        autosize
                        minRows={2}
                    />
                    <ColorInput
                        label="Brand Color"
                        value={color}
                        onChange={setColor}
                        format="hex"
                        swatches={['#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14']}
                    />
                </Stack>
            </Paper>

            <Paper withBorder p="md" radius="md">
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text fw={700} size="lg">Form Fields</Text>
                        <Badge>Custom Fields</Badge>
                    </Group>

                    <Text size="sm" c="dimmed">
                        Add the specific questions you want to ask your customers.
                        Note: Name, Phone, Address, and Total Price are always included automatically.
                    </Text>

                    <Stack gap="lg">
                        {fields.map((field, index) => (
                            <Paper key={index} withBorder p="md" radius="md" style={{ position: 'relative' }}>
                                <Group justify="flex-end" mb="xs">
                                    <ActionIcon color="red" variant="subtle" onClick={() => removeField(index)}>
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>

                                <Group grow align="flex-start" mb="sm">
                                    <TextInput
                                        label="Question Label"
                                        placeholder="e.g. What is the gate code?"
                                        value={field.label}
                                        onChange={(e) => updateField(index, { label: e.target.value })}
                                    />
                                    <Group align="flex-end">
                                        <Stack gap={0} style={{ flex: 1 }}>
                                            <Text size="sm" fw={500} mb={3}>Field Type</Text>
                                            <Badge variant="outline" size="lg" style={{ textTransform: 'capitalize' }}>{field.type}</Badge>
                                        </Stack>
                                        <Button
                                            variant={field.required ? "filled" : "light"}
                                            color={field.required ? "blue" : "gray"}
                                            onClick={() => updateField(index, { required: !field.required })}
                                            size="xs"
                                        >
                                            {field.required ? "Required" : "Optional"}
                                        </Button>
                                    </Group>
                                </Group>

                                {(field.type === 'select' || field.type === 'checkbox') && (
                                    <Stack gap="xs" mt="sm">
                                        <Text size="sm" fw={500}>Options (comma separated)</Text>
                                        <TextInput
                                            placeholder="Option A, Option B, Option C"
                                            value={field.options?.map(o => o.label).join(', ') || ''}
                                            onChange={(e) => {
                                                const opts = e.target.value.split(',').map(s => {
                                                    const label = s.trim();
                                                    return { label, value: label.toLowerCase().replace(/\s+/g, '_') };
                                                });
                                                updateField(index, { options: opts });
                                            }}
                                        />
                                    </Stack>
                                )}
                            </Paper>
                        ))}
                    </Stack>

                    <Divider label="Add New Field" labelPosition="center" my="sm" />

                    <Group justify="center">
                        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => addField('text')}>Add Text</Button>
                        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => addField('number')}>Add Number</Button>
                        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => addField('textarea')}>Add Long Text</Button>
                        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => addField('select')}>Add Dropdown</Button>
                    </Group>
                </Stack>
            </Paper>

            <Button
                fullWidth
                size="lg"
                onClick={handleSave}
                loading={isLoading}
                leftSection={<IconDeviceFloppy size={18} />}
            >
                Save Form Configuration
            </Button>
        </Stack>
    );
};

export default FormBuilder;
