import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Title, Text, Group, Stack, Badge, Loader, Center, Alert, Button, Modal, Select, TextInput } from '@mantine/core';
import { IconCheck, IconAlertCircle, IconLoader, IconPlugConnected } from '@tabler/icons-react';

interface WhatsAppConfig {
  id: string;
  provider: 'twilio' | 'baileys' | 'evolution';
  is_connected: boolean;
  instance_id?: string;
  connected_at?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const WhatsAppConnectPage: React.FC = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'twilio' | 'baileys'>('twilio');
  const [isSaving, setIsSaving] = useState(false);

  // Twilio form state
  const [twilioForm, setTwilioForm] = useState({
    accountSid: '',
    authToken: '',
    twilioPhoneNumber: '',
  });

  // Baileys form state
  const [baileysForm, setBaileysForm] = useState({
    phoneNumber: '',
    instanceKey: '',
  });

  const fetchConfig = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/whatsapp/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-sme-id': user.id,
        },
      });

      const json = await response.json();
      if (json.success && json.config) {
        setConfig(json.config);
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]); // fetchConfig is now memoized with useCallback

  const handleTwilioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/config/twilio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sme-id': user?.id || '',
        },
        body: JSON.stringify(twilioForm),
      });

      const json = await response.json();
      if (json.success) {
        alert('✅ Twilio WhatsApp configured successfully!');
        setConfig(json.config);
        setTwilioForm({ accountSid: '', authToken: '', twilioPhoneNumber: '' });
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (error) {
      console.error('Twilio config error:', error);
      alert('Failed to save Twilio config');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBaileysSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/config/instance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sme-id': user?.id || '',
        },
        body: JSON.stringify({
          provider: 'baileys',
          ...baileysForm,
        }),
      });

      const json = await response.json();
      if (json.success) {
        alert('✅ Baileys WhatsApp configured successfully!');
        setConfig(json.config);
        setBaileysForm({ phoneNumber: '', instanceKey: '' });
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (error) {
      console.error('Baileys config error:', error);
      alert('Failed to save Baileys config');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect WhatsApp?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/config`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-sme-id': user?.id || '',
        },
      });

      const json = await response.json();
      if (json.success) {
        alert('WhatsApp disconnected');
        setConfig(null);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading WhatsApp configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">💬 WhatsApp Setup</h1>
        <p className="text-green-100">Connect your business WhatsApp account to send messages from your own number</p>
      </div>

      {/* Connected Status */}
      {config?.is_connected ? (
        <div className="bg-emerald-900/30 border border-emerald-600 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-emerald-300 mb-1">Connected</h3>
              <p className="text-emerald-200 mb-3">
                <strong>Provider:</strong> {config.provider.toUpperCase()}
              </p>
              {config.instance_id && (
                <p className="text-emerald-200 mb-3">
                  <strong>WhatsApp Number:</strong> {config.instance_id}
                </p>
              )}
              {config.connected_at && (
                <p className="text-xs text-emerald-300">
                  Connected on {new Date(config.connected_at).toLocaleDateString()}
                </p>
              )}
              <button
                onClick={handleDisconnect}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-900/30 border border-amber-600 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-1">Not Connected</h3>
              <p className="text-amber-200">Set up a WhatsApp provider below to send messages from your business number</p>
            </div>
          </div>
        </div>
      )}

      {/* Provider Tabs */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('twilio')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'twilio'
                ? 'bg-blue-600 text-white border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Twilio (Managed)
          </button>
          <button
            onClick={() => setActiveTab('baileys')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'baileys'
                ? 'bg-green-600 text-white border-b-2 border-green-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Baileys (Self-Hosted)
          </button>
        </div>

        <div className="p-6">
          {/* Twilio Tab */}
          {activeTab === 'twilio' && (
            <form onSubmit={handleTwilioSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-4">
                  Use Twilio's WhatsApp Business API. You'll need a Twilio account with WhatsApp integration.
                  <br />
                  <a
                    href="https://www.twilio.com/whatsapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Get Twilio WhatsApp
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Account SID *</label>
                <input
                  type="password"
                  value={twilioForm.accountSid}
                  onChange={(e) => setTwilioForm({ ...twilioForm, accountSid: e.target.value })}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Auth Token *</label>
                <input
                  type="password"
                  value={twilioForm.authToken}
                  onChange={(e) => setTwilioForm({ ...twilioForm, authToken: e.target.value })}
                  placeholder="Your Twilio auth token"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  WhatsApp Business Phone Number *
                </label>
                <input
                  type="tel"
                  value={twilioForm.twilioPhoneNumber}
                  onChange={(e) => setTwilioForm({ ...twilioForm, twilioPhoneNumber: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full px-6 py-3 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white rounded-lg font-bold transition-all"
              >
                {isSaving ? 'Saving...' : 'Connect Twilio'}
              </button>
            </form>
          )}

          {/* Baileys Tab */}
          {activeTab === 'baileys' && (
            <form onSubmit={handleBaileysSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-4">
                  Use your own WhatsApp Personal or Business account via Baileys (self-hosted).
                  <br />
                  Messages will be sent from your actual WhatsApp account.
                  <br />
                  <a
                    href="https://github.com/WhiskeySockets/Baileys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300"
                  >
                    Learn more about Baileys
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Your WhatsApp Phone Number *
                </label>
                <input
                  type="tel"
                  value={baileysForm.phoneNumber}
                  onChange={(e) => setBaileysForm({ ...baileysForm, phoneNumber: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Include country code (e.g., +234...)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Instance Key *</label>
                <input
                  type="text"
                  value={baileysForm.instanceKey}
                  onChange={(e) => setBaileysForm({ ...baileysForm, instanceKey: e.target.value })}
                  placeholder="Your Baileys instance API key"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Get this from your Baileys instance provider or API dashboard
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full px-6 py-3 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white rounded-lg font-bold transition-all"
              >
                {isSaving ? 'Saving...' : 'Connect Baileys'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">ℹ️ How it works</h3>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li>✅ Choose either Twilio (managed) or Baileys (self-hosted)</li>
          <li>✅ Connect your WhatsApp account</li>
          <li>✅ All customer messages will be sent from your WhatsApp number</li>
          <li>✅ Build trust with customers by communicating from a known source</li>
        </ul>
      </div>
    </div>
  );
};

export default WhatsAppConnectPage;
