import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CSVMapper from '../components/CSVMapper';
import { ArrowLeft } from 'lucide-react';

interface FormSchema {
  id: string;
  name: string;
  description?: string;
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

  const handleSelectSchema = async (schema: FormSchema) => {
    setSelectedSchema(schema);

    // Fetch form fields
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${schema.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const json = await response.json();
      if (json.success) {
        setFormFields(json.schema.fields || []);
      }
    } catch (error) {
      console.error('Failed to fetch form fields:', error);
    }
  };

  // Show CSVMapper if schema selected
  if (selectedSchema && formFields.length > 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <button
          onClick={() => {
            setSelectedSchema(null);
            setFormFields([]);
          }}
          className="mb-4 flex items-center gap-2 text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forms
        </button>
        <CSVMapper
          schemaId={selectedSchema.id}
          formFields={formFields}
          onImportComplete={(rowCount) => {
            alert(`Imported ${rowCount} rows successfully!`);
            setSelectedSchema(null);
            setFormFields([]);
          }}
        />
      </div>
    );
  }

  // Show form selection
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">📊 CSV Import & Mapper</h1>
        <p className="text-purple-100">Bulk import order data from CSV spreadsheets</p>
      </div>

      {/* Form Selection */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 rounded-full border-4 border-purple-400 border-t-purple-600 animate-spin"></div>
          <p className="text-slate-300 mt-4">Loading forms...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <p className="text-slate-400 mb-4">No forms available. Create a custom form first to import data.</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">🗂️ Select a Form to Import Data Into</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forms.map((form) => (
              <button
                key={form.id}
                onClick={() => handleSelectSchema(form)}
                className="text-left p-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-purple-500 rounded-lg transition-all"
              >
                <h3 className="text-lg font-bold text-white">{form.name}</h3>
                {form.description && (
                  <p className="text-sm text-slate-400 mt-1">{form.description}</p>
                )}
                <p className="text-xs text-slate-500 mt-2">Click to import data →</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVImportPage;
