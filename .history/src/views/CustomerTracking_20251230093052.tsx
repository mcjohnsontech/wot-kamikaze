import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useOrderByToken, useOrderSubscription } from '../hooks/useOrders';
import { calculateDistance, calculateETA } from '../lib/utils';
import { AlertCircle } from 'lucide-react';

// Custom icons
const riderIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2913/2913095.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const CustomerTracking: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error } = useOrderByToken(token);
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);

  // Parse delivery address to approximate coordinates (dummy parsing)
  // In production, use geocoding API
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getCoordinatesFromAddress = (address: string) => {
    // Default to Lagos city coordinates
    return { lat: 6.5244, lng: 3.3792 };
  };

  // Handle real-time updates
  const handleOrderUpdate = useCallback(
    (updatedOrder: any) => {
      if (updatedOrder.rider_lat && updatedOrder.rider_lng) {
        setRiderPos({ lat: updatedOrder.rider_lat, lng: updatedOrder.rider_lng });

        const destCoords = getCoordinatesFromAddress(updatedOrder.delivery_address);
        const dist = calculateDistance(
          updatedOrder.rider_lat,
          updatedOrder.rider_lng,
          destCoords.lat,
          destCoords.lng
        );
        setDistance(dist);
        setEta(calculateETA(dist));
      }
    },
    []
  );

  // Subscribe to real-time updates
  useOrderSubscription(order?.id || '', handleOrderUpdate);

  // Initial rider position setup
  useEffect(() => {
    if (order && order.rider_lat && order.rider_lng) {
      setRiderPos({ lat: order.rider_lat, lng: order.rider_lng });

      const destCoords = getCoordinatesFromAddress(order.delivery_address);
      const dist = calculateDistance(order.rider_lat, order.rider_lng, destCoords.lat, destCoords.lng);
      setDistance(dist);
      setEta(calculateETA(dist));
    }
  }, [order]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 text-lg font-semibold mb-2">Tracking Link Invalid</p>
          <p className="text-red-600 text-sm mb-6">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const destCoords = getCoordinatesFromAddress(order.delivery_address);
  const centerPos: [number, number] = riderPos
    ? [riderPos.lat, riderPos.lng]
    : [destCoords.lat, destCoords.lng];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span>📦</span> Order #{order.readable_id}
          </h1>
          <p className="text-slate-600 flex items-center gap-2">
            <span>🚴</span> {order.status === 'DISPATCHED' ? 'Your rider is on the way' : `Status: ${order.status}`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Map */}
        <div className="border-4 border-blue-300 rounded-2xl overflow-hidden shadow-lg mb-6 h-96 bg-white">
          {riderPos && (
            <MapContainer center={centerPos} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Rider marker */}
              <Marker position={[riderPos.lat, riderPos.lng]} icon={riderIcon}>
                <Popup>Your rider is here</Popup>
              </Marker>

              {/* Destination marker */}
              <Marker position={[destCoords.lat, destCoords.lng]} icon={destinationIcon}>
                <Popup>Your delivery location</Popup>
              </Marker>

              {/* Accuracy circle around rider */}
              <Circle center={[riderPos.lat, riderPos.lng]} radius={100} color="blue" fill={false} />
            </MapContainer>
          )}
          {!riderPos && (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-2"></div>
                <p>Waiting for rider location...</p>
              </div>
            </div>
          )}
        </div>

        {/* ETA Card */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Estimated Arrival</p>
              <h2 className="text-5xl font-bold">{eta > 0 ? `${eta} min` : 'Calculating...'}</h2>
            </div>
            <div className="text-6xl">⏱️</div>
          </div>
          <p className="text-orange-100 text-sm mt-4">Be ready to receive your order and confirm payment</p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-blue-100 rounded-2xl p-6">
            <h3 className="text-slate-900 font-bold mb-2 flex items-center gap-2">
              <span>📍</span> Delivery Address
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">{order.delivery_address}</p>
          </div>

          <div className="bg-white border border-blue-100 rounded-2xl p-6">
            <h3 className="text-slate-900 font-bold mb-2 flex items-center gap-2">
              <span>📏</span> Distance
            </h3>
            <p className="text-slate-700 text-sm">
              {distance > 0 ? `${distance.toFixed(1)} km away` : 'Calculating...'}
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm text-blue-700 flex items-start gap-2">
            <span>💡</span>
            <span>Live tracking is active. Your rider's location updates automatically every few seconds.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerTracking;