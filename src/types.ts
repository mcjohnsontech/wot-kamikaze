export interface FormField {
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
