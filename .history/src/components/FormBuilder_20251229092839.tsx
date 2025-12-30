import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

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
      label: 'New Field',
      type: 'text',
      required: true,
    };
    setFields([...fields, newField]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === fields.length - 1)) {
      return;
    }
    const updated = [...fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setFields(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Form name is required');
      return;
    }
    await onSave(name, description, fields);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">📋 Form Builder</h1>
        <p className="text-blue-100">Create custom data collection forms for your orders</p>
      </div>

      {/* Form Metadata */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Form Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Cake Order Form"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this form is used for..."
            rows={2}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Fields Editor */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          📝 Form Fields ({fields.length})
        </h2>

        <div className="space-y-3 mb-4">
          {fields.map((field, index) => (
            <div
              key={field.field_key}
              className={`bg-slate-700 border rounded-lg p-4 cursor-pointer transition-all ${
                editingIndex === index ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-white font-semibold">{field.label}</p>
                  <p className="text-xs text-slate-400">
                    {field.type} • {field.required ? 'Required' : 'Optional'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeField(index);
                  }}
                  className="p-2 text-red-400 hover:bg-red-900/30 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Field Editor (expanded) */}
              {editingIndex === index && (
                <div className="mt-4 pt-4 border-t border-slate-600 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Label</label>
                      <input
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-600 text-white text-sm rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value as any })}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-600 text-white text-sm rounded"
                      >
                        <option>text</option>
                        <option>number</option>
                        <option>email</option>
                        <option>phone</option>
                        <option>date</option>
                        <option>textarea</option>
                        <option>select</option>
                        <option>checkbox</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Placeholder</label>
                    <input
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(index, { placeholder: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-600 text-white text-sm rounded"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Help Text</label>
                    <input
                      value={field.help_text || ''}
                      onChange={(e) => updateField(index, { help_text: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-600 text-white text-sm rounded"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Required field</span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addField}
          className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Field
        </button>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 disabled:opacity-50 text-white rounded-xl font-bold transition-all text-lg"
      >
        {isLoading ? '💾 Saving...' : '✅ Save Form'}
      </button>
    </div>
  );
};

export default FormBuilder;
