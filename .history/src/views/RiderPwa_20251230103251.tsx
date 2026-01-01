import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderByToken, useUpdateRiderLocation } from '../hooks/useOrders';
import { supabase } from '../lib/supabase';
import { Container, Card, Title, Text, Button, Stack, Group, Badge, Alert, Loader, Center, Modal, TextInput } from '@mantine/core';
import { IconPower, IconMapPin, IconCheck, IconAlertCircle } from '@tabler/icons-react';

const RiderPwa: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error } = useOrderByToken(token);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updateLocation, isUpdating } = useUpdateRiderLocation(order?.id || '');

  const [isTracking, setIsTracking] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const [isCompleting, setIsCompleting] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';


  // Start GPS tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      alert('Geolocation not supported');
      return;
    }

    setIsTracking(true);
    setGpsStatus('active');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (order?.id) {
          updateLocation(latitude, longitude);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setGpsStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  // Stop GPS tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setGpsStatus('idle');
  };

  // Mark delivery as complete with OTP verification
  const handleMarkDelivered = async () => {
    if (!order) return;

    // If OTP hasn't been requested yet, generate and send it
    if (!otpRequested) {
      setIsCompleting(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/orders/${order.id}/otp/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const json = await resp.json();
        if (!resp.ok) {
          throw new Error(json.error || 'Failed to generate OTP');
        }

        setOtpRequested(true);
        setOtpMessage('OTP sent to customer. Enter OTP to verify delivery.');
        if (json.debugOtp) {
          setOtpMessage((m) => `${m} (debug OTP: ${json.debugOtp})`);
        }
      } catch (err) {
        alert('Failed to request OTP for delivery confirmation');
      } finally {
        setIsCompleting(false);
      }

      return;
    }

    // Verify provided OTP
    setIsCompleting(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/orders/${order.id}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpInput }),
      });

      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json.error || 'OTP verification failed');
      }

      // Success — server marked order as COMPLETED
      stopTracking();
      alert('✅ OTP verified. Delivery marked as complete!');
      navigate('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setIsCompleting(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-400 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading delivery...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-500 rounded-2xl p-8 max-w-sm w-full text-center">
            <IconAlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg font-bold mb-2">Order Not Found</p>
          <p className="text-red-200 mb-6">Invalid or expired delivery link</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🏍️ Delivery Tracking</h1>
        <p className="text-blue-100">Order #{order.readable_id}</p>
      </div>

      {/* Order Info Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
        <div className="space-y-4">
          <div>
            <p className="text-slate-400 text-sm mb-1">Customer Name</p>
            <p className="text-white text-lg font-bold">{order.customer_name}</p>
          </div>

          <div>
            <p className="text-slate-400 text-sm mb-1">Delivery Address</p>
            <p className="text-white text-sm leading-relaxed">{order.delivery_address}</p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-slate-400 text-sm mb-1">Amount</p>
              <p className="text-emerald-400 text-lg font-bold">₦{order.price_total.toLocaleString()}</p>
            </div>
            <div className="flex-1">
              <p className="text-slate-400 text-sm mb-1">Status</p>
              <p className="text-blue-400 text-lg font-bold">{order.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* GPS Toggle */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
              <IconMapPin className="w-5 h-5 text-blue-400" />
              GPS Tracking
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Status:{' '}
              <span
                aria-live="polite"
                className={`font-bold ${
                  gpsStatus === 'active'
                    ? 'text-emerald-400'
                    : gpsStatus === 'error'
                      ? 'text-red-400'
                      : 'text-slate-400'
                }`}
              >
                {gpsStatus === 'active' ? '🟢 Active' : gpsStatus === 'error' ? '🔴 Error' : '⚪ Idle'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={isTracking ? stopTracking : startTracking}
            disabled={isLoading}
            aria-pressed={isTracking}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all transform hover:scale-105 ${
              isTracking
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                : 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800'
            }`}
          >
            <IconPower className="w-5 h-5" />
            {isTracking ? 'STOP' : 'START'}
          </button>
        </div>

        {isTracking && (
          <div className="bg-emerald-900/20 border border-emerald-600 rounded-lg p-3 text-emerald-300 text-sm">
            ✅ Your location is being sent to the customer in real-time
          </div>
        )}

        {gpsStatus === 'error' && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 text-red-300 text-sm">
            ⚠️ GPS error. Please enable location services
          </div>
        )}
      </div>

      {/* Open in Maps Button */}
      <div className="mb-6">
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(order.delivery_address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105"
        >
          <IconMapPin className="w-5 h-5" />
          Open in Google Maps
        </a>
      </div>

      {/* Delivery confirmation (OTP flow) */}
      {!otpRequested ? (
        <button
          onClick={handleMarkDelivered}
          disabled={isCompleting}
          className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 text-lg"
        >
          <IconCheck className="w-6 h-6" />
          {isCompleting ? 'Requesting OTP...' : '📨 Send OTP & Confirm Delivery'}
        </button>
      ) : (
        <div className="space-y-3">
          {otpMessage && (
            <div role="status" aria-live="polite" className="text-sm text-slate-300 text-center">{otpMessage}</div>
          )}
          <input
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value)}
            placeholder="Enter 4-digit OTP"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-lg"
          />
          <button
            onClick={handleMarkDelivered}
            disabled={isCompleting || otpInput.trim().length === 0}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 text-lg"
          >
            {isCompleting ? 'Verifying...' : '✅ Verify OTP & Complete Delivery'}
          </button>
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
        <p className="text-slate-300 text-sm">
          Make sure you're connected to the internet to send your location updates to the customer
        </p>
      </div>
    </div>
  );
};

export default RiderPwa;