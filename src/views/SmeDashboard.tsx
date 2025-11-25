import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
// We will mock the Tanstack Query hooks here for demonstration since the backend isn't ready.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 

// --- MOCK API DATA & HOOKS (To be replaced by real hooks later) ---

// 1. Mock Data Source
const MOCK_ORDERS = [
    { id: '1', readable_id: 'WOT101', status: 'NEW', customer: 'Aisha U.', price: 'N8,500', rider_phone: null },
    { id: '2', readable_id: 'WOT102', status: 'PROCESSING', customer: 'Obi N.', price: 'N15,000', rider_phone: null },
    { id: '3', readable_id: 'WOT103', status: 'READY', customer: 'Chidi M.', price: 'N5,200', rider_phone: '+2348001234567' },
    { id: '4', readable_id: 'WOT104', status: 'DISPATCHED', customer: 'Femi A.', price: 'N3,500', rider_phone: '+2348001234567' },
];
const STATUS_SEQUENCE = ['NEW', 'PROCESSING', 'READY', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];

// 2. Mock Fetch Hook (FE Endpoint 2: GET /orders)
const useOrders = () => {
    // In a real app, this would use fetch or Axios with the JWT token
    return useQuery({
        queryKey: ['orders'],
        queryFn: () => new Promise(resolve => setTimeout(() => resolve(MOCK_ORDERS), 500)),
    });
};

// 3. Mock Mutation Hook (FE Endpoint 3: PATCH /orders/:id/status)
const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (vars: { orderId: string, newStatus: string, riderPhone?: string }) => {
            console.log(`[API MOCK] Attempting status update for ${vars.orderId} to ${vars.newStatus}`);
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // In a real app, this updates the BE. We mock the data change locally:
            const orderToUpdate = MOCK_ORDERS.find(o => o.id === vars.orderId);
            if (orderToUpdate) {
                orderToUpdate.status = vars.newStatus;
                orderToUpdate.rider_phone = vars.riderPhone || orderToUpdate.rider_phone;
            }

            // Mock WABA side effect notification
            if (vars.newStatus === 'READY' || vars.newStatus === 'DISPATCHED') {
                alert(`WABA Triggered: Sent link for Order #${orderToUpdate?.readable_id} to ${vars.riderPhone || 'Customer'}`);
            }

            return orderToUpdate;
        },
        onSuccess: () => {
            // Invalidate the 'orders' query to trigger a refetch and update the UI
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
};
// --- END MOCK HOOKS ---


// --- UI Component Definitions ---

const OrderCard: React.FC<{ order: typeof MOCK_ORDERS[0], handleNextStage: (id: string, currentStatus: string) => void }> = ({ order, handleNextStage }) => {
    const isCompleted = order.status === 'COMPLETED';
    const isReady = order.status === 'READY';
    const isDispatched = order.status === 'DISPATCHED';
    const nextStatusIndex = STATUS_SEQUENCE.indexOf(order.status) + 1;
    const nextStatus = STATUS_SEQUENCE[nextStatusIndex];
    
    // Determine card color based on status (Better Visibility UX)
    const statusColor = 
        order.status === 'NEW' ? 'border-yellow-500' :
        order.status === 'PROCESSING' ? 'border-orange-500' :
        order.status === 'READY' ? 'border-blue-500' :
        order.status === 'DISPATCHED' ? 'border-green-500' :
        'border-gray-500';

    return (
        <div className={`p-3 bg-white rounded-lg mb-3 shadow-md border-l-4 ${statusColor} transform transition duration-200 hover:shadow-lg`}>
            <p className="font-medium text-sm text-blue-800">Order #{order.readable_id}</p>
            <p className="text-xs text-gray-600">Customer: {order.customer}</p>
            <p className="text-xs text-green-700 font-semibold">Total: {order.price}</p>
            
            {!isCompleted && nextStatus && (
                <button 
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center"
                    onClick={() => handleNextStage(order.id, order.status)}
                    disabled={isDispatched && !order.rider_phone}
                >
                    {/* Display specific action based on the next step */}
                    {nextStatus === 'READY' && 'Assign Rider & Send Link →'}
                    {nextStatus === 'DISPATCHED' && 'Send Tracking Link →'}
                    {nextStatus !== 'READY' && nextStatus !== 'DISPATCHED' && `Move to ${nextStatus} →`}
                </button>
            )}
            
            {isCompleted && (
                 <p className="mt-2 text-xs text-gray-500 font-semibold"><i className="fa-solid fa-check mr-1"></i> Completed</p>
            )}

            {isDispatched && (
                 <p className="mt-1 text-xs text-gray-500 italic">Rider: {order.rider_phone}</p>
            )}
        </div>
    );
};

const SmeDashboard: React.FC = () => {
    const { logout, user } = useAuth();
    const queryClient = useQueryClient();

    // Use the mock query hook to fetch orders
    const { data: orders, isLoading, error } = useOrders();
    const updateStatusMutation = useUpdateOrderStatus();

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
    const [riderPhoneInput, setRiderPhoneInput] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);


    const handleNextStage = (id: string, currentStatus: string) => {
        const nextStatusIndex = STATUS_SEQUENCE.indexOf(currentStatus) + 1;
        const newStatus = STATUS_SEQUENCE[nextStatusIndex];

        if (newStatus === 'READY') {
            // If the next status is READY, we need the rider's phone number first.
            setSelectedOrderId(id);
            setIsRiderModalOpen(true);
            return;
        }

        if (newStatus) {
            updateStatusMutation.mutate({ orderId: id, newStatus });
        }
    };
    
    const handleRiderAssignment = () => {
        if (selectedOrderId && riderPhoneInput) {
            updateStatusMutation.mutate({ 
                orderId: selectedOrderId, 
                newStatus: 'READY', 
                riderPhone: riderPhoneInput 
            });
            setIsRiderModalOpen(false);
            setRiderPhoneInput('');
            setSelectedOrderId(null);
        }
    };

    const handleCreateNewOrder = () => {
        // FR1.1: Triggers the new order flow
        setIsOrderModalOpen(true);
    };

    // --- Fix lint errors: explicitly type items in order mapping functions ---

    // TS types for order, for inferring from MOCK_ORDERS. This assumes MOCK_ORDERS is an array of OrderType.
    type OrderType = typeof MOCK_ORDERS extends (infer T)[] ? T : never;

    // Fix for: Property 'reduce' does not exist on type '{}' & Parameter 'order' implicitly has an 'any' type.
    // If orders is always an array or undefined (never an object), (orders || []) is fine.
    const ordersByStatus = (Array.isArray(orders) ? orders : []).reduce(
        (acc: Record<string, OrderType[]>, order: OrderType) => {
            acc[order.status] = acc[order.status] || [];
            acc[order.status].push(order);
            return acc;
        }, {}
    );

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-md">
                <h1 className="text-xl md:text-3xl font-bold text-blue-800">WOT SME Dashboard</h1>
                
                <div className="flex items-center space-x-2 md:space-x-4">
                    <span className="text-xs md:text-sm text-gray-700">Welcome, {user?.name || 'SME User'}</span>
                    <button
                        onClick={handleCreateNewOrder}
                        className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-150 text-sm"
                    >
                      <i className="fa-solid fa-plus mr-1"></i> New Order
                    </button>
                    <button
                        onClick={logout}
                        className="bg-red-500 text-white px-3 md:px-4 py-2 rounded-lg shadow-md hover:bg-red-600 transition duration-150 text-sm"
                    >
                      Logout
                    </button>
                </div>
            </header>

            <p className="text-lg text-gray-600 mb-6">Kanban Pipeline (Smarter Workflows)</p>
            
            {isLoading && <div className="text-center p-10 text-xl text-blue-600"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading Orders...</div>}
            {error && <div className="text-center p-10 text-xl text-red-600">Error fetching orders.</div>}

            {/* Kanban Board Layout (FR1.2) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {STATUS_SEQUENCE.filter(s => s !== 'CANCELLED').map(status => (
                    <div key={status} className="bg-gray-100 rounded-xl shadow-inner p-3 border-t-8 border-gray-300">
                        <h2 className="text-base md:text-xl font-semibold mb-4 text-gray-700">{status} ({ordersByStatus[status]?.length || 0})</h2>
                        
                        {ordersByStatus[status]?.map((order: OrderType) => (
                            <OrderCard 
                                key={order.id} 
                                order={order} 
                                handleNextStage={handleNextStage} 
                            />
                        ))}
                        
                        {(!ordersByStatus[status] || ordersByStatus[status].length === 0) && (
                          <p className="text-xs text-gray-400 italic">No orders in this stage.</p>
                        )}
                    </div>
                ))}
            </div>
            
            {/* --- Modal for Rider Assignment (FR1.3) --- */}
            {isRiderModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-2xl max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-4 text-blue-700">Assign Rider</h3>
                        {/* Fix lint: Property 'find' does not exist on type '{}' & Parameter 'o' implicitly any */}
                        <p className="mb-4">
                            Order <strong>
                                #
                                {(Array.isArray(orders)
                                    ? orders.find((o: OrderType) => o.id === selectedOrderId)?.readable_id
                                    : '')}
                            </strong> is ready for dispatch.
                        </p>
                        
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rider Phone Number (e.g., +234...)</label>
                        <input
                            type="tel"
                            value={riderPhoneInput}
                            onChange={(e) => setRiderPhoneInput(e.target.value)}
                            className="w-full border-gray-300 border rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+234..."
                            required
                        />

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsRiderModalOpen(false)}
                                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleRiderAssignment}
                                disabled={!riderPhoneInput || updateStatusMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {updateStatusMutation.isPending ? 'Sending...' : 'Assign & Dispatch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal for New Order (FR1.1) --- */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    {/* TODO: Implement New Order Form Here */}
                    <div className="bg-white p-6 rounded-lg shadow-2xl max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-4 text-blue-700">Create New Order (Form Placeholder)</h3>
                        <p>A full form for Customer Name, Phone, Address, and Price would go here.</p>
                         <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsOrderModalOpen(false)}
                                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => { /* Mock create order logic */ setIsOrderModalOpen(false); alert('Mock Order Created!'); queryClient.invalidateQueries({ queryKey: ['orders'] }); }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Save Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmeDashboard;