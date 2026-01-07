import React, { useState, useEffect } from 'react';
import {
    TextInput,
    Textarea,
    NumberInput,
    Select,
    Checkbox,
    Stack,
    Button,
    Box,
    Group,
    ThemeIcon,
    Text,
    Divider,
    SimpleGrid
} from '@mantine/core';
import { IconUser, IconMapPin, IconPackage, IconCheck } from '@tabler/icons-react';
import type { FormField } from '../types';

interface DynamicOrderFormProps {
    fields: FormField[];
    onSubmit: (data: any) => void;
    isLoading: boolean;
    initialValues?: any;
}

const DynamicOrderForm: React.FC<DynamicOrderFormProps> = ({ fields, onSubmit, isLoading, initialValues }) => {
    const [formData, setFormData] = useState<Record<string, any>>({
        customer_name: '',
        customer_phone: '',
        delivery_address: '',
        price_total: 0,
    });

    useEffect(() => {
        if (initialValues) {
            setFormData(prev => ({
                ...prev,
                ...initialValues,
                ...initialValues.form_data // Flatten nested form_data for easier editing
            }));
        }
    }, [initialValues]);

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = () => {
        // Separate core fields and custom fields
        const {
            customer_name, customer_phone, delivery_address, price_total,
            ...customData
        } = formData;

        const submissionData = {
            customer_name,
            customer_phone,
            delivery_address,
            price_total,
            form_data: customData // All other fields go into the JSON generic column
        };

        onSubmit(submissionData);
    };

    const renderField = (field: FormField) => {
        switch (field.type) {
            case 'text':
            case 'email':
            case 'phone':
            case 'date':
                return (
                    <TextInput
                        key={field.field_key}
                        label={field.label}
                        placeholder={field.placeholder || field.label}
                        required={field.required}
                        value={formData[field.field_key] || ''}
                        onChange={(e) => handleChange(field.field_key, e.target.value)}
                        type={field.type === 'phone' ? 'tel' : field.type}
                    />
                );
            case 'textarea':
                return (
                    <Textarea
                        key={field.field_key}
                        label={field.label}
                        placeholder={field.placeholder || field.label}
                        required={field.required}
                        autosize
                        minRows={2}
                        value={formData[field.field_key] || ''}
                        onChange={(e) => handleChange(field.field_key, e.target.value)}
                    />
                );
            case 'number':
                return (
                    <NumberInput
                        key={field.field_key}
                        label={field.label}
                        placeholder={field.placeholder || field.label}
                        required={field.required}
                        value={formData[field.field_key] || ''}
                        onChange={(val) => handleChange(field.field_key, val)}
                    />
                );
            case 'select':
                return (
                    <Select
                        key={field.field_key}
                        label={field.label}
                        placeholder={field.placeholder || 'Select option'}
                        required={field.required}
                        data={field.options || []}
                        value={formData[field.field_key] || ''}
                        onChange={(val) => handleChange(field.field_key, val)}
                    />
                );
            case 'checkbox':
                return (
                    <Checkbox
                        key={field.field_key}
                        label={field.label}
                        checked={!!formData[field.field_key]}
                        onChange={(e) => handleChange(field.field_key, e.currentTarget.checked)}
                        mt="md"
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Stack gap="xl">
            {/* Section 1: Core Customer Details (Hardcoded) */}
            <Box>
                <Group mb="xs" gap="xs">
                    <ThemeIcon variant="light" size="sm" color="blue"><IconUser size={14} /></ThemeIcon>
                    <Text fw={700} size="sm" c="dimmed" tt="uppercase">Customer Details</Text>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <TextInput
                        label="Customer Name"
                        placeholder="Full Name"
                        required
                        value={formData.customer_name}
                        onChange={(e) => handleChange('customer_name', e.target.value)}
                    />
                    <TextInput
                        label="Phone Number"
                        placeholder="+234..."
                        required
                        value={formData.customer_phone}
                        onChange={(e) => handleChange('customer_phone', e.target.value)}
                    />
                </SimpleGrid>
            </Box>
            <Divider variant="dashed" />

            {/* Section 2: Delivery Details (Core + Address is mandatory) */}
            <Box>
                <Group mb="xs" gap="xs">
                    <ThemeIcon variant="light" size="sm" color="orange"><IconMapPin size={14} /></ThemeIcon>
                    <Text fw={700} size="sm" c="dimmed" tt="uppercase">Delivery Information</Text>
                </Group>
                <Stack gap="md">
                    <Textarea
                        label="Delivery Address"
                        placeholder="Full address"
                        required
                        autosize
                        minRows={2}
                        value={formData.delivery_address}
                        onChange={(e) => handleChange('delivery_address', e.target.value)}
                    />
                </Stack>
            </Box>

            {/* Section 3: Custom Fields & Price */}
            <Box>
                <Group mb="xs" gap="xs">
                    <ThemeIcon variant="light" size="sm" color="green"><IconPackage size={14} /></ThemeIcon>
                    <Text fw={700} size="sm" c="dimmed" tt="uppercase">Order Specifics</Text>
                </Group>

                <Stack gap="md">
                    <NumberInput
                        label="Total Price"
                        placeholder="0.00"
                        prefix="₦"
                        required
                        value={formData.price_total}
                        onChange={(val) => handleChange('price_total', Number(val))}
                        hideControls
                    />

                    {/* Dynamically Render Custom Fields */}
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        {fields.map((field) => renderField(field))}
                    </SimpleGrid>
                </Stack>
            </Box>

            <Button fullWidth size="lg" radius="md" mt="md" onClick={handleSubmit} loading={isLoading} leftSection={<IconCheck size={20} />}>
                {initialValues ? 'Update Order' : 'Confirm Order Creation'}
            </Button>
        </Stack>
    );
};

export default DynamicOrderForm;
