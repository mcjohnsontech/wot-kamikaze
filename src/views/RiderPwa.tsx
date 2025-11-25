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

  if (isLoading) return <div className="p-8 text-center text-blue-600">Loading Order Details...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-bold">{error}</div>;

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto bg-white min-h-screen font-sans">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">WOT Dispatch View</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
        <p className="font-semibold text-blue-800">Order #{order.readable_id}</p>
        <p className="text-sm text-gray-700 mt-1">Customer: {order.customer_name}</p>
        <p className="text-sm text-gray-700">COD: <strong className="text-green-600">{order.price_total}</strong></p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Delivery Details:</h2>
        <p className="text-base text-gray-700 bg-gray-100 p-3 rounded-md">{order.delivery_address}</p>
        <button 
          className="w-full bg-yellow-500 text-white p-3 rounded-lg shadow-md mt-4 hover:bg-yellow-600 transition duration-150"
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_address)}`, '_blank')}
        >
          <i className="fa-solid fa-location-dot mr-2"></i> Navigate (Google Maps)
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-gray-200 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
            <span className={`font-bold text-sm ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                <i className={`fa-solid ${isTracking ? 'fa-signal' : 'fa-times-circle'} mr-2`}></i>
                {isTracking ? 'GPS ACTIVE' : 'GPS INACTIVE'}
            </span>
            <button
                onClick={toggleTracking}
                className={`text-xs px-3 py-1 rounded-full text-white font-semibold ${isTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
                {isTracking ? 'STOP TRACKING' : 'START TRACKING'}
            </button>
        </div>

        <button 
          onClick={handleDeliveryComplete}
          disabled={!order || !isTracking}
          className="w-full bg-blue-700 text-white p-4 rounded-lg text-lg font-bold shadow-xl disabled:bg-gray-400 hover:bg-blue-800 transition duration-150"
        >
          <i className="fa-solid fa-circle-check mr-2"></i> Delivered & Paid (FR2.3)
        </button>
      </div>
      <div className="h-20"></div> {/* Spacer for fixed footer */}
    </div>
  );
};

export default RiderPwa;