import React, { useState, useEffect } from 'react';
import { 
  Container, Card, Title, Text, Group, Stack, Badge, Button, TextInput, Select, Checkbox, Switch,
  Modal, ActionIcon, Tabs
} from '@mantine/core';
import { 
  IconPlus, IconTrash, IconGripVertical, IconChevronUp, IconChevronDown, 
  IconCopy, IconX, IconEye, IconSettings, IconPalette, IconCheck, IconAlertCircle 
} from '@tabler/icons-react';

interface FormField {
  field_key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'email' | 'phone' | 'date';
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    min?: number;
    max?: number;
    maxLength?: number;
  };
  logic?: {
    dependsOn?: string; // field_key
    showIfValue?: string;
  };
}

interface FormBuilderProps {
  initialName?: string;
  initialDescription?: string;
  initialFields?: FormField[];
  initialColor?: string;
  onSave: (name: string, description: string, fields: FormField[], color: string) => Promise<void>;
  isLoading?: boolean;
}

const FormBuilder: React.FC<FormBuilderProps> = ({
  initialName = '',
  initialDescription = '',
  initialFields = [],
  initialColor = '#3b82f6', // Default Blue
  onSave,
  isLoading = false,
}) => {
  const [mode, setMode] = useState<'builder' | 'preview'>('builder');
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [themeColor, setThemeColor] = useState(initialColor);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // State for Preview Mode interactions
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  const addField = () => {
    const newField: FormField = {
      field_key: `field_${Date.now()}`,
      label: 'New Question',
      type: 'text',
      required: false,
      options: [],
      validation: {},
      logic: {}
    };
    setFields([...fields, newField]);
    setEditingIndex(fields.length);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const moveField = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === fields.length - 1)) return;
    const updated = [...fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setFields(updated);
    setEditingIndex(swapIndex);
  };

  const isVisible = (field: FormField, data: Record<string, any>) => {
    if (!field.logic?.dependsOn) return true;
    return data[field.logic.dependsOn] === field.logic.showIfValue;
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-2xl mb-8 border border-slate-800 sticky top-4 z-50 shadow-2xl">
        <div className="flex gap-1">
          <button 
            onClick={() => setMode('builder')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${mode === 'builder' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <IconSettings size={18} /> Builder
          </button>
          <button 
            onClick={() => setMode('preview')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${mode === 'preview' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <IconEye size={18} /> Live Preview
          </button>
        </div>

        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-4 mr-2">
            <Palette size={16} className="text-slate-400" />
            <input 
              type="color" 
              value={themeColor} 
              onChange={(e) => setThemeColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
            />
          </div>
          <button
            onClick={() => onSave(name, description, fields, themeColor)}
            disabled={isLoading}
            style={{ backgroundColor: themeColor }}
            className="px-6 py-2.5 text-white rounded-xl font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg"
          >
            {isLoading ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </div>

      {mode === 'builder' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Metadata Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-3xl font-black bg-transparent border-none outline-none text-white w-full mb-2"
              placeholder="Form Title..."
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-transparent border-none text-slate-400 outline-none w-full resize-none"
              placeholder="Form description..."
            />
          </div>

          {/* Fields Editor */}
          <div className="space-y-4">
            {fields.map((field, idx) => (
              <div key={field.field_key} className={`bg-slate-800 border-2 rounded-3xl transition-all ${editingIndex === idx ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-700'}`}>
                {/* Header Row */}
                <div className="flex items-center p-4 cursor-pointer" onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}>
                  <div className="flex flex-col text-slate-600 px-2">
                    <ChevronUp size={16} onClick={(e) => moveField(idx, 'up', e)} className="hover:text-white" />
                    <GripVertical size={20} />
                    <ChevronDown size={16} onClick={(e) => moveField(idx, 'down', e)} className="hover:text-white" />
                  </div>
                  <div className="flex-1 ml-4">
                    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400">{field.type}</span>
                    <h4 className="text-white font-bold mt-1">{field.label || 'New Question'}</h4>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFields(fields.filter((_, i) => i !== idx)); }} className="p-2 text-slate-500 hover:text-red-400">
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Expanded Editor */}
                {editingIndex === idx && (
                  <div className="p-8 border-t border-slate-700 space-y-8 animate-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 gap-8">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2"><Settings size={14}/> Basic Settings</h5>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Label</label>
                          <input value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Placeholder</label>
                          <input value={field.placeholder} onChange={(e) => updateField(idx, { placeholder: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white" />
                        </div>
                      </div>

                      {/* Advanced/Validation */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2"><CheckCircle2 size={14}/> Validation & Logic</h5>
                        <div className="grid grid-cols-2 gap-4">
                           {field.type === 'number' && (
                             <>
                               <div><label className="text-[10px] text-slate-400">Min</label><input type="number" onChange={(e) => updateField(idx, { validation: { ...field.validation, min: Number(e.target.value) }})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white" /></div>
                               <div><label className="text-[10px] text-slate-400">Max</label><input type="number" onChange={(e) => updateField(idx, { validation: { ...field.validation, max: Number(e.target.value) }})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white" /></div>
                             </>
                           )}
                           {field.type === 'text' && (
                             <div className="col-span-2"><label className="text-[10px] text-slate-400">Max Length (Characters)</label><input type="number" onChange={(e) => updateField(idx, { validation: { ...field.validation, maxLength: Number(e.target.value) }})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white" /></div>
                           )}
                        </div>
                        {/* Conditional Logic UI */}
                        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700">
                           <span className="text-[10px] font-bold text-blue-400 block mb-2">IF LOGIC</span>
                           <div className="flex gap-2">
                              <select 
                                value={field.logic?.dependsOn || ''} 
                                onChange={(e) => updateField(idx, { logic: { ...field.logic, dependsOn: e.target.value }})}
                                className="flex-1 bg-slate-800 text-xs text-white p-2 rounded-lg border-none"
                              >
                                <option value="">Always Show</option>
                                {fields.filter(f => f.field_key !== field.field_key && f.type === 'select').map(f => (
                                  <option key={f.field_key} value={f.field_key}>Show if {f.label}...</option>
                                ))}
                              </select>
                              {field.logic?.dependsOn && (
                                <input 
                                  placeholder="equals value..." 
                                  className="flex-1 bg-slate-800 text-xs text-white p-2 rounded-lg"
                                  onChange={(e) => updateField(idx, { logic: { ...field.logic, showIfValue: e.target.value }})}
                                />
                              )}
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Options Manager */}
                    {field.type === 'select' && (
                      <div className="pt-4 border-t border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-xs font-bold text-slate-400 uppercase">Dropdown Options</label>
                          <button onClick={() => updateField(idx, { options: [...(field.options || []), { label: '', value: '' }] })} className="text-blue-400 text-xs font-bold">+ Add Option</button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {field.options?.map((opt, oIdx) => (
                            <div key={oIdx} className="flex bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                              <input 
                                value={opt.label} 
                                onChange={(e) => {
                                  const newOpts = [...(field.options || [])];
                                  newOpts[oIdx] = { label: e.target.value, value: e.target.value };
                                  updateField(idx, { options: newOpts });
                                }}
                                className="bg-transparent px-3 py-2 text-xs text-white flex-1 outline-none" 
                                placeholder="Label" 
                              />
                              <button onClick={() => updateField(idx, { options: field.options?.filter((_, i) => i !== oIdx) })} className="bg-slate-800 px-2 text-red-400 hover:text-red-300"><X size={14}/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button onClick={addField} className="w-full py-8 border-2 border-dashed border-slate-700 rounded-3xl text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-all font-black flex items-center justify-center gap-2">
              <Plus size={24} /> ADD NEW QUESTION
            </button>
          </div>
        </div>
      ) : (
        /* --- LIVE PREVIEW MODE --- */
        <div className="bg-white rounded-[2rem] shadow-2xl p-12 text-slate-900 min-h-[600px] animate-in zoom-in-95 duration-300">
          <header className="mb-12 border-b-4 pb-8" style={{ borderBottomColor: themeColor }}>
            <h1 className="text-5xl font-black mb-4">{name || 'Form Title'}</h1>
            <p className="text-slate-500 text-xl">{description || 'No description provided.'}</p>
          </header>

          <div className="space-y-10">
            {fields.map((field) => {
              if (!isVisible(field, previewData)) return null;

              return (
                <div key={field.field_key} className="space-y-3 animate-in fade-in slide-in-from-left-4">
                  <label className="block text-xl font-bold text-slate-800">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.help_text && <p className="text-sm text-slate-500">{field.help_text}</p>}
                  
                  {field.type === 'select' ? (
                    <select 
                      onChange={(e) => setPreviewData({ ...previewData, [field.field_key]: e.target.value })}
                      className="w-full p-4 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 outline-none transition-all"
                      style={{ focusBorderColor: themeColor }}
                    >
                      <option value="">Select an option...</option>
                      {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea 
                      className="w-full p-4 text-lg border-2 border-slate-200 rounded-2xl h-32 focus:border-blue-500 outline-none"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input 
                      type={field.type}
                      onChange={(e) => setPreviewData({ ...previewData, [field.field_key]: e.target.value })}
                      className="w-full p-4 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 outline-none"
                      placeholder={field.placeholder}
                    />
                  )}
                  {field.logic?.dependsOn && (
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full w-fit">
                      <AlertCircle size={12} /> Logic active: Shown because {fields.find(f => f.field_key === field.logic?.dependsOn)?.label} is "{field.logic.showIfValue}"
                    </div>
                  )}
                </div>
              );
            })}

            <button 
              style={{ backgroundColor: themeColor }}
              className="w-full py-5 text-white text-2xl font-black rounded-3xl shadow-xl hover:brightness-110 active:scale-95 transition-all mt-10"
            >
              Submit Response
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilder;