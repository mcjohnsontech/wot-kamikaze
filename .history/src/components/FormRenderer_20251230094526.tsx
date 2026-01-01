import React, { useState, useEffect } from 'react';

interface FormField {
  id?: string;
  field_key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'email' | 'phone' | 'date';
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: Array<{ label: string; value: string }>;
  // --- ADDED: Match the new Builder properties ---
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

interface FormSchema {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  brandColor?: string; // --- ADDED ---
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

  // --- ADDED: Logic Helper ---
  const isFieldVisible = (field: FormField) => {
    if (!field.logic?.dependsOn) return true;
    const dependencyValue = formData[field.logic.dependsOn];
    return dependencyValue === field.logic.showIfValue;
  };

  // --- ADDED: Cleanup hidden fields so we don't submit ghost data ---
  useEffect(() => {
    const cleanedData = { ...formData };
    let changed = false;
    
    schema.fields.forEach(field => {
      if (!isFieldVisible(field) && cleanedData[field.field_key] !== undefined) {
        delete cleanedData[field.field_key];
        changed = true;
      }
    });

    if (changed) setFormData(cleanedData);
  }, [formData, schema.fields]);

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const { [fieldKey]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    schema.fields.forEach((field) => {
      // Only validate if the field is visible
      if (!isFieldVisible(field)) return;

      const value = formData[field.field_key];

      // 1. Required Check
      if (field.required && (!value || value.toString().trim() === '')) {
        newErrors[field.field_key] = `${field.label} is required`;
        return;
      }

      // 2. Advanced Validation (Min/Max/Length)
      if (value) {
        if (field.type === 'number' && field.validation) {
          if (field.validation.min !== undefined && value < field.validation.min) {
            newErrors[field.field_key] = `Minimum value is ${field.validation.min}`;
          }
          if (field.validation.max !== undefined && value > field.validation.max) {
            newErrors[field.field_key] = `Maximum value is ${field.validation.max}`;
          }
        }

        if (field.type === 'text' && field.validation?.maxLength) {
          if (value.toString().length > field.validation.maxLength) {
            newErrors[field.field_key] = `Max ${field.validation.maxLength} characters allowed`;
          }
        }

        // 3. Regex Checks (Email/Phone)
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field.field_key] = 'Invalid email address';
        }
        
        if (field.type === 'phone' && value.replace(/\D/g, '').length < 10) {
          newErrors[field.field_key] = 'Invalid phone number';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const themeColor = schema.brandColor || '#3b82f6'; // Fallback to blue

  const renderField = (field: FormField) => {
    if (!isFieldVisible(field)) return null;

    const value = formData[field.field_key] ?? '';
    const error = errors[field.field_key];
    
    const baseInputClass = `w-full px-4 py-3 bg-slate-900 border-2 rounded-xl text-white text-base transition-all outline-none 
      ${error ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-700 focus:border-blue-500'}`;

    return (
      <div key={field.field_key} className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
        <label className="block text-sm font-bold text-slate-300">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>

        {field.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={baseInputClass}
          />
        ) : field.type === 'select' ? (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select option...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : field.type === 'checkbox' ? (
            <div 
              onClick={() => handleFieldChange(field.field_key, !value)}
              className="flex items-center gap-3 cursor-pointer group"
            >
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${value ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                    {value && <CheckIcon />}
                </div>
                <span className="text-slate-300 group-hover:text-white transition-colors">{field.placeholder || 'Yes'}</span>
            </div>
        ) : (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
            style={{ '--tw-ring-color': `${themeColor}33` } as any}
          />
        )}

        {field.help_text && <p className="text-xs text-slate-500 italic">{field.help_text}</p>}
        {error && <p className="text-xs font-bold text-red-400 flex items-center gap-1">⚠️ {error}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
      {/* Dynamic Header */}
      <div 
        className="rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }}
      >
        <div className="relative z-10">
            <h1 className="text-4xl font-black mb-2">{schema.name}</h1>
            {schema.description && <p className="opacity-90 text-lg">{schema.description}</p>}
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 space-y-6 shadow-xl">
        {schema.fields.map((field) => renderField(field))}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{ backgroundColor: themeColor }}
        className="w-full px-6 py-5 text-white rounded-2xl font-black transition-all text-xl shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Submit Form'}
      </button>
    </form>
  );
};

const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default FormRenderer;