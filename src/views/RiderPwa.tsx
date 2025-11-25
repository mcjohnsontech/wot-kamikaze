import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const RiderPwa: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // FR2.1: Token Validation and Order Fetch (Mocking the public API call)
    if (token) {
      // TODO: Replace this mock fetch with Tanstack Query for Endpoint 4: /public/orders/:token
      if (token === 'VALID_RIDER_TOKEN') {
        setOrder({
          readable_id: 'WOT103',
          customer_name: 'Chidi M.',
          delivery_address: '15, Freedom Way, Lekki Phase 1, Lagos',
          price_total: 'N5,200 (COD)',
        });
        setIsLoading(false);
      } else {
        setError("Invalid or Expired Rider Link. Please contact the vendor.");
        setIsLoading(false);
      }
    }
  }, [token]);

  const toggleTracking = () => {
    // FR2.2: Continuous GPS Broadcast Logic (Placeholder)
    if (!isTracking) {
      console.log("Starting GPS tracking and WebSocket connection...");
      // In production: Start navigator.geolocation.watchPosition and WebSocket PING stream
      setIsTracking(true);
    } else {
      console.log("Stopping GPS tracking and closing WebSocket connection...");
      // In production: Stop tracking and send connection close message
      setIsTracking(false);
    }
  };

  const handleDeliveryComplete = () => {
    // FR2.3: Simple Status Update Button (Placeholder)
    if (window.confirm("Confirm order delivered and payment received? This will stop tracking.")) {
        console.log("Sending STATUS_UPDATE: COMPLETED to Go server via WebSocket.");
        // In production: Send WebSocket message (Type: STATUS_UPDATE) and call NestJS API for persistence.
        toggleTracking(); // Stop tracking
        alert("Success! Order marked complete."); // Use a custom modal in final product
        setError("This order is now completed and tracking has stopped.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-600 border-t-blue-400 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-red-500/20 border border-red-500/50 rounded-2xl p-8 text-center max-w-sm">
          <span className="text-4xl mb-4 block">⚠️</span>
          <p className="text-red-200 text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚚</span>
              <div>
                <h1 className="text-2xl font-bold text-white">WOT Dispatch</h1>
                <p className="text-sm text-slate-400">Rider View</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full font-bold text-sm ${isTracking ? 'bg-green-500/20 text-green-300 border border-green-500/50' : 'bg-red-500/20 text-red-300 border border-red-500/50'}`}>
              {isTracking ? '🟢 LIVE' : '🔴 OFFLINE'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-40">
        {/* Order Summary Card */}
        <div className="backdrop-blur-xl bg-linear-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/50 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Order ID</p>
              <p className="text-3xl font-bold text-white">#{order.readable_id}</p>
            </div>
            <span className="text-4xl">📦</span>
          </div>
          
          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-slate-300 mb-2">
              <span className="text-slate-400">Recipient:</span>
              <span className="font-semibold text-white ml-2">{order.customer_name}</span>
            </p>
            <p className="text-slate-300">
              <span className="text-slate-400">COD Amount:</span>
              <span className="font-bold text-emerald-400 ml-2 text-lg">{order.price_total}</span>
            </p>
          </div>
        </div>

        {/* Delivery Address Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>📍</span> Delivery Location
          </h2>
          <p className="text-slate-200 mb-4 leading-relaxed">{order.delivery_address}</p>
          
          <button 
            className="w-full bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_address)}`, '_blank')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Open in Google Maps
          </button>
        </div>

        {/* Tracking Status Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>📡</span> GPS Tracking
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className={`w-4 h-4 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <p className={`font-bold ${isTracking ? 'text-green-400' : 'text-red-400'}`}>
                  {isTracking ? '🟢 GPS Active - Sharing Location' : '🔴 GPS Inactive'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <span>📍</span>
              <div>
                <p className="text-slate-400 text-sm">Current Status</p>
                <p className="text-slate-200 font-semibold">
                  {isTracking ? 'Your location is being shared with customer' : 'Location sharing disabled'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Card */}
        <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-6">
          <p className="text-sm text-blue-200 flex items-start gap-2">
            <span>💡</span>
            <span>
              Keep GPS active while en route. Customer will receive real-time tracking updates. Mark as delivered when payment is received.
            </span>
          </p>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-linear-to-t from-slate-900 via-slate-900/95 to-transparent backdrop-blur-xl border-t border-white/20 p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={toggleTracking}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 mb-3 shadow-lg hover:shadow-xl ${
              isTracking 
                ? 'bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white' 
                : 'bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
            }`}
          >
            {isTracking ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h12v2H6V4zm0 7h12v2H6v-2zm0 7h12v2H6v-2z" />
                </svg>
                Stop Tracking
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Start Tracking
              </>
            )}
          </button>

          <button 
            onClick={handleDeliveryComplete}
            disabled={!order || !isTracking}
            className="w-full bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Delivered & Paid ✓
          </button>

          <p className="text-xs text-slate-400 text-center mt-3">
            {!isTracking && 'Start tracking to enable delivery confirmation'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiderPwa;