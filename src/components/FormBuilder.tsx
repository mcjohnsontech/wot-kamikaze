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
import { IconDeviceFloppy, IconTrash } from '@tabler/icons-react';

interface FormField {
    field_key: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: any[];
}

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
                        <Badge>Default Fields</Badge>
                    </Group>

                    <Text size="sm" c="dimmed">The following fields are standard for all orders. You can configure additional fields in the dashboard settings later.</Text>

                    <Stack gap="sm">
                        {fields.map((field, index) => (
                            <Group key={index} justify="space-between" p="sm" style={{ border: '1px solid #eee', borderRadius: '8px' }}>
                                <Stack gap={0}>
                                    <Text fw={500}>{field.label}</Text>
                                    <Text size="xs" c="dimmed">Key: {field.field_key} | Type: {field.type}</Text>
                                </Stack>
                                {field.required && <Badge color="red" size="sm" variant="light">Required</Badge>}
                            </Group>
                        ))}
                    </Stack>
                </Stack>
            </Paper>

            <Button
                fullWidth
                size="lg"
                onClick={handleSave}
                loading={isLoading}
                leftSection={<IconDeviceFloppy size={18} />}
            >
                Save and Continue
            </Button>
        </Stack>
    );
};

export default FormBuilder;
