import React, { useState } from 'react';

interface FormField {
  id?: string;
  field_key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'email' | 'phone' | 'date';
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: Array<{ label: string; value: string }>;
}

interface FormSchema {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
}

interface FormRendererProps {
  schema: FormSchema;
  onSubmit: (formData: Record<string, any>) => Promise<void>;
  isLoading?: boolean;
}

const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    schema.fields.forEach((field) => {
      const value = formData[field.field_key];

      if (field.required && (!value || value.toString().trim() === '')) {
        newErrors[field.field_key] = `${field.label} is required`;
      }

      if (value && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.field_key] = 'Please enter a valid email';
        }
      }

      if (value && field.type === 'phone') {
        const phoneRegex = /^\d{10,}$/;
        if (!phoneRegex.test(value.replace(/\D/g, ''))) {
          newErrors[field.field_key] = 'Please enter a valid phone number';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.field_key] ?? '';
    const error = errors[field.field_key];
    const baseInputClass =
      'w-full px-3 py-2 bg-slate-900 border rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none ' +
      (error ? 'border-red-500' : 'border-slate-700');

    return (
      <div key={field.field_key} className="space-y-1">
        <label className="block text-sm font-semibold text-slate-300">
          {field.label} {field.required && <span className="text-red-400">*</span>}
        </label>

        {field.type === 'text' && (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        )}

        {field.type === 'number' && (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        )}

        {field.type === 'email' && (
          <input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        )}

        {field.type === 'phone' && (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        )}

        {field.type === 'date' && (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={baseInputClass}
          />
        )}

        {field.type === 'textarea' && (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={baseInputClass}
          />
        )}

        {field.type === 'select' && (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={baseInputClass}
          >
            <option value="">-- Select --</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {field.type === 'checkbox' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleFieldChange(field.field_key, e.target.checked)}
              className="w-4 h-4 rounded border-slate-600"
            />
            <span className="text-sm text-slate-300">{field.placeholder || 'Yes'}</span>
          </label>
        )}

        {field.help_text && (
          <p className="text-xs text-slate-400">{field.help_text}</p>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">{schema.name}</h1>
        {schema.description && <p className="text-blue-100">{schema.description}</p>}
      </div>

      {/* Fields */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
        {schema.fields.map((field) => renderField(field))}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 disabled:opacity-50 text-white rounded-xl font-bold transition-all text-lg"
      >
        {isLoading ? '⏳ Submitting...' : '✅ Submit Form'}
      </button>
    </form>
  );
};

export default FormRenderer;
