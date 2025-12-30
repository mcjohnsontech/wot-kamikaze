import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FormBuilder from '../components/FormBuilder';
import { Edit2, Trash2, Plus, ArrowLeft } from 'lucide-react';

interface FormSchema {
  id: string;
  name: string;
  description?: string;
  version: number;
  is_active: boolean;
  created_at: string;
}

interface FormField {
  field_key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'email' | 'phone' | 'date';
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: Array<{ label: string; value: string }>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const FormManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingForm, setEditingForm] = useState<FormSchema | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchForms();
  }, [user?.id]);

  const fetchForms = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-sme-id': user.id,
        },
      });

      const json = await response.json();
      if (json.success) {
        setForms(json.schemas || []);
      }
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveForm = async (name: string, description: string, fields: FormField[]) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const method = editingForm ? 'PUT' : 'POST';
      const endpoint = editingForm ? `/forms/${editingForm.id}` : '/forms';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-sme-id': user.id,
        },
        body: JSON.stringify({ name, description, fields }),
      });

      const json = await response.json();
      if (json.success) {
        alert(editingForm ? 'Form updated successfully!' : 'Form created successfully!');
        setEditingForm(null);
        setIsCreating(false);
        fetchForms();
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (error) {
      alert('Failed to save form');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!user?.id || !window.confirm('Are you sure you want to delete this form?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-sme-id': user.id,
        },
      });

      const json = await response.json();
      if (json.success) {
        alert('Form deleted');
        fetchForms();
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (error) {
      alert('Failed to delete form');
    }
  };

  // Show form builder for create/edit
  if (isCreating || editingForm) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <button
          onClick={() => {
            setIsCreating(false);
            setEditingForm(null);
          }}
          className="mb-4 flex items-center gap-2 text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forms
        </button>
        <FormBuilder
          initialName={editingForm?.name}
          initialDescription={editingForm?.description}
          onSave={handleSaveForm}
          isLoading={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">📋 Custom Forms</h1>
        <p className="text-blue-100">Manage order data collection forms for your business</p>
      </div>

      {/* Create Button */}
      <button
        onClick={() => setIsCreating(true)}
        className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
      >
        <Plus className="w-5 h-5" />
        Create New Form
      </button>

      {/* Forms List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 rounded-full border-4 border-blue-400 border-t-blue-600 animate-spin"></div>
          <p className="text-slate-300 mt-4">Loading forms...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <p className="text-slate-400 mb-4">No forms yet. Create your first custom form to get started!</p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            Create Form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-blue-500 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{form.name}</h3>
                  {form.description && (
                    <p className="text-sm text-slate-400 mt-1">{form.description}</p>
                  )}
                </div>
                {!form.is_active && (
                  <span className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded">Inactive</span>
                )}
              </div>

              <p className="text-xs text-slate-500 mb-4">v{form.version} • Created {new Date(form.created_at).toLocaleDateString()}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const schema = forms.find(f => f.id === form.id);
                    if (schema) setEditingForm(schema);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteForm(form.id)}
                  className="flex-1 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 text-sm rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormManagementPage;
