import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderByToken, useUpdateRiderLocation } from '../hooks/useOrders';
import { supabase } from '../lib/supabase';
import { Power, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

const RiderPwa: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error } = useOrderByToken(token);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updateLocation, isUpdating } = useUpdateRiderLocation(order?.id || '');

  const [isTracking, setIsTracking] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const [isCompleting, setIsCompleting] = useState(false);
  const watchIdRef = useRef<number | null>(null);


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

  // Mark delivery as complete
  const handleMarkDelivered = async () => {
    if (!order) return;

    setIsCompleting(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'COMPLETED', rider_lat: null, rider_lng: null })
        .eq('id', order.id);

      if (error) throw error;

      stopTracking();
      alert('✅ Delivery marked as complete!');
      navigate('/');
    } catch (err) {
      alert('Failed to complete delivery');
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
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
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
              <MapPin className="w-5 h-5 text-blue-400" />
              GPS Tracking
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Status:{' '}
              <span
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
            onClick={isTracking ? stopTracking : startTracking}
            disabled={isLoading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all transform hover:scale-105 ${
              isTracking
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                : 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800'
            }`}
          >
            <Power className="w-5 h-5" />
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
          <MapPin className="w-5 h-5" />
          Open in Google Maps
        </a>
      </div>

      {/* Mark Delivered Button */}
      <button
        onClick={handleMarkDelivered}
        disabled={isCompleting}
        className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 text-lg"
      >
        <CheckCircle className="w-6 h-6" />
        {isCompleting ? 'Completing...' : '✅ Mark Delivered & Paid'}
      </button>

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