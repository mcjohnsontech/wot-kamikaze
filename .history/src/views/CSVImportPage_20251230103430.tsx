import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CSVMapper from '../components/CSVMapper';
import { Container, Card, Title, Text, Group, Stack, Badge, Loader, Center, Alert, Button, FileInput } from '@mantine/core';
import { IconDownload, IconFileSpreadsheet, IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import Papa from 'papaparse'; // Ensure this is installed

interface FormSchema {
  id: string;
  name: string;
  description?: string;
  brand_color?: string;
}

interface FormField {
  id?: string;
  field_key: string;
  label: string;
  type: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CSVImportPage: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<FormSchema | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingFields, setIsFetchingFields] = useState(false);

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

  const handleSelectSchema = async (schema: FormSchema) => {
    try {
      setIsFetchingFields(true);
      const response = await fetch(`${API_BASE_URL}/forms/${schema.id}`, {
        headers: { 
          'Content-Type': 'application/json',
          'x-sme-id': user?.id || '' 
        },
      });

      const json = await response.json();
      if (json.success) {
        setFormFields(json.schema.fields || []);
        setSelectedSchema(schema);
      }
    } catch (error) {
      console.error('Failed to fetch form fields:', error);
      alert("Error loading form structure.");
    } finally {
      setIsFetchingFields(false);
    }
  };

  // --- NEW SUGGESTION: Download CSV Template ---
  const downloadTemplate = (e: React.MouseEvent, schema: FormSchema, fields: FormField[]) => {
    e.stopPropagation(); // Don't trigger the selection
    
    // Create headers from field labels
    const headers = fields.map(f => f.label);
    const csvContent = Papa.unparse([headers]);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${schema.name.replace(/\s+/g, '_')}_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedSchema && formFields.length > 0) {
    return (
      <div className="max-w-5xl mx-auto p-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-8">
            <button
                onClick={() => { setSelectedSchema(null); setFormFields([]); }}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <IconArrowLeft size={20} /> Back to Selection
            </button>
            <div className="text-right">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Target Form</span>
                <h2 className="text-white font-black text-xl">{selectedSchema.name}</h2>
            </div>
        </div>

        <CSVMapper
          schemaId={selectedSchema.id}
          formFields={formFields}
          onImportComplete={(rowCount) => {
            setSelectedSchema(null);
            setFormFields([]);
            // You can replace this with a better Toast notification later
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-4xl font-black mb-3 flex items-center gap-3">
                <IconFileSpreadsheet size={40} /> Bulk Order Import
            </h1>
            <p className="text-purple-100 text-lg max-w-2xl">
                Select a form schema below to begin importing data from your CSV files. 
                You can map your existing spreadsheet columns to our custom form fields.
            </p>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Help Sidebar */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-6">
                <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                    <Info size={18} className="text-purple-400" /> Tips for Success
                </h3>
                <ul className="space-y-4 text-sm text-slate-400">
                    <li className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">1</span>
                        Use the "Download Template" button to get a CSV with the correct headers.
                    </li>
                    <li className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">2</span>
                        Ensure all "Required" fields in your form have a matching column in your CSV.
                    </li>
                    <li className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">3</span>
                        Dates should be formatted as YYYY-MM-DD for best results.
                    </li>
                </ul>
            </div>
        </div>

        {/* Form Selection Grid */}
        <div className="lg:col-span-2">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader /> {/* Loading state */}
                    <p className="text-slate-500 font-bold">Fetching your forms...</p>
                </div>
            ) : forms.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-12 text-center">
                    <p className="text-slate-400 mb-4 font-medium">No active forms available.</p>
                    <p className="text-slate-500 text-sm">Please create a custom form in the Management tab before importing data.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Select Target Schema</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {forms.map((form) => (
                            <div
                                key={form.id}
                                onClick={() => !isFetchingFields && handleSelectSchema(form)}
                                className={`group flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-800 border-2 border-slate-700 rounded-3xl transition-all cursor-pointer ${isFetchingFields ? 'opacity-50' : 'hover:border-purple-500 hover:bg-slate-800/50 hover:shadow-xl hover:shadow-purple-500/5'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                        <IconFileSpreadsheet size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{form.name}</h3>
                                        <p className="text-slate-400 text-sm line-clamp-1">{form.description || 'No description'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 mt-4 md:mt-0">
                                    {/* Template Button */}
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            // We need fields to make a template. 
                                            // Fetch them quickly if we don't have them.
                                            const resp = await fetch(`${API_BASE_URL}/forms/${form.id}`, { headers: {'x-sme-id': user?.id || ''} });
                                            const data = await resp.json();
                                            if (data.success) downloadTemplate(e, form, data.schema.fields);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 hover:text-white transition-all"
                                    >
                                        <IconDownload size={14} /> Template
                                    </button>
                                    <div className="p-2 text-purple-500 group-hover:translate-x-1 transition-transform">
                                        <IconArrowLeft size={20} className="rotate-180" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportPage;