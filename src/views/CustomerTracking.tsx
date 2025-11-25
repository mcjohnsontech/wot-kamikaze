import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import leaflet CSS

// Mock Leaflet icon paths (Needs to be replaced with actual assets/logic in production)
import L from 'leaflet';

// Define custom icons
const riderIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/5836/5836691.png', // Placeholder for Rider
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Placeholder for Destination
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const CustomerTracking: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<any>(null);
  const [riderPosition, setRiderPosition] = useState<[number, number] | null>(null);
  const [destination] = useState<[number, number]>([6.5244, 3.3792]); // Default Lagos coords
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // FR3.1: Token Validation and Order Fetch (Mocking the public API call)
    if (token) {
      if (token === 'VALID_CUSTOMER_TOKEN') {
        setOrder({
          readable_id: 'WOT103',
          customer_name: 'Aisha U.',
          delivery_address: '15, Freedom Way, Lekki Phase 1, Lagos',
        });
        
        // Mock initial rider position near destination
        setRiderPosition([6.5300, 3.3850]); 
        setIsLoading(false);
        
        // --- Mock WebSocket Connection (FR3.3) ---
        console.log("Attempting WebSocket connection for live tracking...");
        const mockWs = setInterval(() => {
            // Mock receiving PING data from the Go server
            setRiderPosition(prev => {
                if (prev) {
                    const newLat = prev[0] - 0.0001; // Simulate rider moving closer
                    const newLng = prev[1] - 0.0001;
                    return [newLat, newLng];
                }
                return null;
            });
            console.log("Simulating real-time update...");
        }, 3000); // Update every 3 seconds

        return () => clearInterval(mockWs); // Cleanup mock WS
      } else {
        setError("Invalid or Expired Tracking Link.");
        setIsLoading(false);
      }
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-white via-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-white via-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-sm">
          <span className="text-4xl mb-4 block">⚠️</span>
          <p className="text-red-700 text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  const centerPosition: [number, number] = riderPosition || destination;

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📦</span>
            <h1 className="text-3xl font-bold text-slate-900">Order #{order.readable_id}</h1>
          </div>
          <p className="text-slate-600 flex items-center gap-2">
            <span>📍</span> Your order is currently en route
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Map Container */}
        <div className="border border-blue-200 rounded-2xl overflow-hidden shadow-md mb-6 h-96">
          {riderPosition && (
            <MapContainer 
              center={centerPosition} 
              zoom={14} 
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Rider Position (Live) */}
              <Marker position={riderPosition} icon={riderIcon}>
                <Popup>
                  Your Rider is here.
                </Popup>
              </Marker>

              {/* Destination */}
              <Marker position={destination} icon={destinationIcon}>
                <Popup>
                  Your Delivery Destination.
                </Popup>
              </Marker>
              
              {/* Polyline (Mocking the route path) */}
              <Polyline positions={[riderPosition, destination]} color="#3b82f6" weight={3} />

            </MapContainer>
          )}
          {!riderPosition && (
            <div className="h-full flex items-center justify-center text-slate-600 text-center">
              <div>
                <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-2"></div>
                <p>Awaiting rider location signal...</p>
              </div>
            </div>
          )}
        </div>

        {/* ETA Card */}
        <div className="bg-linear-to-r from-amber-100 to-orange-100 border border-amber-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Estimated Time of Arrival</p>
              <h2 className="text-4xl font-bold text-slate-900">
                {riderPosition ? '5-10 min' : 'Calculating...'}
              </h2>
            </div>
            <span className="text-5xl">⏱️</span>
          </div>
          <p className="text-slate-700 text-sm mt-4">
            Please be ready to receive your order and finalize payment (COD).
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-blue-100 rounded-2xl p-6">
            <h3 className="text-slate-900 font-bold mb-2 flex items-center gap-2">
              <span>📏</span> Delivery Location
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">{order.delivery_address}</p>
          </div>

          <div className="bg-white border border-blue-100 rounded-2xl p-6">
            <h3 className="text-slate-900 font-bold mb-2 flex items-center gap-2">
              <span>👤</span> Recipient
            </h3>
            <p className="text-slate-700 text-sm">{order.customer_name}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-6">
          <p className="text-sm text-blue-700 flex items-start gap-2">
            <span>💡</span>
            <span>
              Live tracking is active. You'll receive notifications when your rider arrives. Make sure your location pin is correct.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerTracking;