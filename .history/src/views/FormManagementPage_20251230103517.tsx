import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FormBuilder from '../components/FormBuilder';
import { Container, Card, Title, Text, Group, Stack, Badge, Loader, Center, Alert, Button, Modal } from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconArrowLeft, IconFileText, IconCalendar, IconAlertCircle } from '@tabler/icons-react';

// Updated interface to match our "Pro" FormBuilder
interface FormField {
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

interface FormSchema {
  id: string;
  name: string;
  description?: string;
  brand_color?: string; // Support for our theme color
  version: number;
  is_active: boolean;
  created_at: string;
  fields?: FormField[]; // Fields are now included
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const FormManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
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
        headers: { 'x-sme-id': user.id },
      });
      const json = await response.json();
      if (json.success) setForms(json.schemas || []);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- FIX: Fetch full form details (with fields) before editing ---
  const handleEditClick = async (formId: string) => {
    try {
      setIsFetchingDetails(true);
      const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
        headers: { 'x-sme-id': user?.id || '' },
      });
      const json = await response.json();
      if (json.success) {
        // json.schema now contains the fields array from the backend
        setEditingForm(json.schema);
      } else {
        alert("Could not load form details.");
      }
    } catch (error) {
      console.error("Error loading form:", error);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleSaveForm = async (name: string, description: string, fields: FormField[], brandColor: string) => {
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
        body: JSON.stringify({ 
            name, 
            description, 
            fields,
            brand_color: brandColor // Saving our new brand color
        }),
      });

      const json = await response.json();
      if (json.success) {
        setEditingForm(null);
        setIsCreating(false);
        fetchForms();
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (error) {
      alert('Failed to save form');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!user?.id || !window.confirm('Delete this form? Previous responses will be hidden.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
        method: 'DELETE',
        headers: { 'x-sme-id': user.id },
      });
      const json = await response.json();
      if (json.success) fetchForms();
    } catch (error) {
      alert('Failed to delete form');
    }
  };

  if (isCreating || editingForm) {
    return (
      <div className="max-w-5xl mx-auto p-6 animate-in fade-in duration-500">
        <button
          onClick={() => { setIsCreating(false); setEditingForm(null); }}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <IconArrowLeft size={20} />
          Back to Dashboard
        </button>
        
        <FormBuilder
          initialName={editingForm?.name}
          initialDescription={editingForm?.description}
          initialFields={editingForm?.fields} // Now correctly passing fields!
          initialColor={editingForm?.brand_color}
          onSave={handleSaveForm}
          isLoading={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-2xl">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <IconFileText className="text-blue-500" size={36} /> Custom Forms
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Create bespoke data collection flows for your clients.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <IconPlus size={24} /> Create New Form
        </button>
      </div>

      {/* Forms Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader /> {/* Loading state */}
          <p className="text-slate-500 font-bold">Loading your forms...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-[2rem] py-20 text-center">
            <div className="bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <IconPlus className="text-slate-600" size={40} />
            </div>
            <h2 className="text-white text-2xl font-bold">No forms found</h2>
            <p className="text-slate-500 mt-2">Start by creating a form to collect customer requirements.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              className="group bg-slate-800 border border-slate-700 rounded-3xl p-6 hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div 
                    className="w-3 h-12 rounded-full" 
                    style={{ backgroundColor: form.brand_color || '#3b82f6' }} 
                  />
                  {!form.is_active && (
                    <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full">Inactive</span>
                  )}
                </div>
                
                <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors line-clamp-1">{form.name}</h3>
                <p className="text-slate-400 text-sm mt-2 line-clamp-2 h-10">{form.description || 'No description provided.'}</p>
                
                <div className="flex items-center gap-4 mt-6 text-slate-500">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter">
                        <IconCalendar size={14} /> {new Date(form.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-tighter bg-slate-900 px-2 py-0.5 rounded text-slate-400">
                        v{form.version}
                    </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => handleEditClick(form.id)}
                  disabled={isFetchingDetails}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isFetchingDetails ? <Loader size={16} /> : <IconEdit size={16} />}
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteForm(form.id)}
                  className="px-4 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-sm rounded-xl font-bold transition-all"
                >
                  <IconTrash size={16} />
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