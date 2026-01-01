import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormBuilder from '../components/FormBuilder';
import CSVMapper from '../components/CSVMapper';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const SetupWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'intro' | 'builder' | 'csv' | 'done'>('intro');
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async () => {
    // Mark setup complete on backend if endpoint exists (best-effort)
    if (!user?.id) {
      navigate('/sme');
      return;
    }

    try {
      setIsSaving(true);
      await fetch(`${API_BASE_URL}/sme/setup-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sme-id': user.id,
        },
        body: JSON.stringify({ completed: true }),
      });
    } catch (err) {
      // ignore errors - endpoint may not exist in current backend
    } finally {
      setIsSaving(false);
      navigate('/sme', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-8 mb-6 shadow">
          <h1 className="text-2xl font-bold mb-2">Welcome to WOT — Setup Wizard</h1>
          <p className="text-sm text-slate-600">Let's configure your order inputs and import any existing CSV data so you can get started faster.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className={`p-4 rounded-lg border ${step === 'intro' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
            <h3 className="font-semibold mb-2">1. Introduction</h3>
            <p className="text-sm text-slate-600">Overview and options: build a custom form or import CSV.</p>
            <button type="button" onClick={() => setStep('builder')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Start Form Builder</button>
          </div>

          <div className={`p-4 rounded-lg border ${step === 'builder' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
            <h3 className="font-semibold mb-2">2. Customize Order Fields</h3>
            <p className="text-sm text-slate-600">Use the form builder to define which fields appear on your order screen.</p>
            <button type="button" onClick={() => setStep('builder')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded">Open Builder</button>
          </div>

          <div className={`p-4 rounded-lg border ${step === 'csv' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
            <h3 className="font-semibold mb-2">3. Import CSV (optional)</h3>
            <p className="text-sm text-slate-600">If you have existing order data, import a CSV and map columns to your form fields.</p>
            <button type="button" onClick={() => setStep('csv')} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded">Import CSV</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow">
          {step === 'intro' && (
            <div>
              <h2 className="font-bold mb-2">Get started</h2>
              <p className="text-sm text-slate-600">Choose whether to start by customizing your order form or import an existing CSV. You can always finish setup later.</p>
            </div>
          )}

          {step === 'builder' && (
            <div>
              <FormBuilder
                onSave={async (name, description, fields, color) => {
                  // Save form to backend
                  try {
                    setIsSaving(true);
                    await fetch(`${API_BASE_URL}/forms`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-sme-id': user?.id || '' },
                      body: JSON.stringify({ name, description, fields, brand_color: color }),
                    });
                  } catch (err) {
                    console.error('Failed to save form during setup', err);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                isLoading={isSaving}
              />

              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => setStep('csv')} className="px-4 py-2 bg-slate-200 rounded">Next: Import CSV</button>
                <button type="button" onClick={handleFinish} className="ml-auto px-4 py-2 bg-emerald-600 text-white rounded">Finish Setup</button>
              </div>
            </div>
          )}

          {step === 'csv' && (
            <div>
              <CSVMapper
                schemaId={''}
                formFields={[]}
                onImportComplete={(count) => {
                  // After import, advance to done
                  setStep('done');
                }}
              />

              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => setStep('builder')} className="px-4 py-2 bg-slate-200 rounded">Back to Builder</button>
                <button type="button" onClick={handleFinish} className="ml-auto px-4 py-2 bg-emerald-600 text-white rounded">Finish Setup</button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">You're all set 🎉</h2>
              <p className="text-sm text-slate-600 mb-4">Setup is complete. You can now use your dashboard.</p>
              <button type="button" onClick={handleFinish} className="px-6 py-3 bg-blue-600 text-white rounded">Go to Dashboard</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
