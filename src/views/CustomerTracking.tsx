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
  const [destination, setDestination] = useState<[number, number]>([6.5244, 3.3792]); // Default Lagos coords
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

  if (isLoading) return <div className="p-8 text-center text-blue-600">Loading Tracking Data...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-bold">{error}</div>;

  const centerPosition: [number, number] = riderPosition || destination;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen font-sans">
      <h1 className="text-3xl font-bold mb-2 text-blue-700">Order #{order.readable_id}</h1>
      <p className="text-lg text-gray-600 mb-6">Your order is currently en route.</p>

      <div className="bg-white rounded-xl shadow-xl overflow-hidden h-96 mb-6">
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
            <Polyline positions={[riderPosition, destination]} color="red" weight={3} />

          </MapContainer>
        )}
        {!riderPosition && <div className="p-4 text-center text-gray-500">Awaiting Rider Location Signal...</div>}
      </div>

      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-300">
        <h2 className="text-xl font-bold text-gray-800">
            <i className="fa-solid fa-clock mr-2 text-yellow-600"></i> ETA:
        </h2>
        {/* FR3.2: Dynamic ETA (Mocked based on proximity) */}
        <p className="text-2xl text-yellow-700 font-extrabold mt-1">
            {riderPosition ? '5 - 10 Minutes' : 'Calculating...'}
        </p>
        <p className="text-sm text-gray-500 mt-2">Please be ready to receive your order and finalize payment ({order.price_total || 'COD'}).</p>
      </div>

      {/* CSAT Redirect Placeholder: Needs logic to redirect to /csat/:token upon COMPLETED message */}
    </div>
  );
};

export default CustomerTracking;