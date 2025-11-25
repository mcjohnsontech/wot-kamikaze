import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom'; // NEW IMPORT

// --- MOCK API DATA & HOOKS (To be replaced by real hooks later) ---

// 1. Mock Data Source
const MOCK_ORDERS = [
    { id: '1', readable_id: 'WOT101', status: 'NEW', customer: 'Aisha U.', price: 'N8,500', rider_phone: null },
    { id: '2', readable_id: 'WOT102', status: 'PROCESSING', customer: 'Obi N.', price: 'N15,000', rider_phone: null },
    { id: '3', readable_id: 'WOT103', status: 'READY', customer: 'Chidi M.', price: 'N5,200', rider_phone: '+2348001234567' },
    { id: '4', readable_id: 'WOT104', status: 'DISPATCHED', customer: 'Femi A.', price: 'N3,500', rider_phone: '+2348001234567' },
    { id: '5', readable_id: 'WOT105', status: 'COMPLETED', customer: 'Yemi S.', price: 'N2,000', rider_phone: '+2348009876543' },
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
    const isDispatched = order.status === 'DISPATCHED';
    const nextStatusIndex = STATUS_SEQUENCE.indexOf(order.status) + 1;
    const nextStatus = STATUS_SEQUENCE[nextStatusIndex];
    
    // Status color mapping with emojis
    const statusColors: Record<string, { bg: string; border: string; icon: string }> = {
        NEW: { bg: 'bg-yellow-100', border: 'border-yellow-300', icon: '⭐' },
        PROCESSING: { bg: 'bg-blue-100', border: 'border-blue-300', icon: '⚙️' },
        READY: { bg: 'bg-purple-100', border: 'border-purple-300', icon: '📦' },
        DISPATCHED: { bg: 'bg-green-100', border: 'border-green-300', icon: '🚀' },
        COMPLETED: { bg: 'bg-emerald-100', border: 'border-emerald-300', icon: '✅' },
    };

    const statusConfig = statusColors[order.status] || { bg: 'bg-gray-500/20', border: 'border-gray-500/50', icon: '•' };

    return (
        <div className={`p-4 bg-white border-2 ${statusConfig.border} rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{statusConfig.icon}</span>
                    <div>
                        <p className="font-bold text-slate-900 text-lg">#{order.readable_id}</p>
                        <p className="text-xs text-slate-600">{order.customer}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg}`}>
                    {order.status}
                </span>
            </div>
            
            <p className="text-sm text-emerald-600 font-semibold mb-3">💰 {order.price}</p>
            
            {!isCompleted && nextStatus && (
                <button 
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-bold flex items-center justify-center gap-2 py-2 px-3 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all duration-200 group"
                    onClick={() => handleNextStage(order.id, order.status)}
                    disabled={false}
                >
                    {nextStatus === 'READY' && '🎯 Assign Rider'}
                    {nextStatus === 'DISPATCHED' && '📍 Send Link'}
                    {nextStatus !== 'READY' && nextStatus !== 'DISPATCHED' && `➜ ${nextStatus}`}
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            )}
            
            {isCompleted && (
                 <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">✅ Completed</p>
            )}

            {isDispatched && (
                 <p className="mt-2 text-xs text-slate-600 italic">📱 {order.rider_phone}</p>
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

    const ordersByStatus = (Array.isArray(orders) ? orders : []).reduce(
        (acc: Record<string, typeof MOCK_ORDERS>, order: typeof MOCK_ORDERS[0]) => {
            acc[order.status] = acc[order.status] || [];
            acc[order.status].push(order);
            return acc;
        }, {}
    );


    return (
        <div className="min-h-screen bg-linear-to-br from-white via-blue-50 to-blue-100 p-4 md:p-8">
            {/* Header */}
            <header className="mb-8">
                <div className="bg-white border border-blue-100 rounded-2xl shadow-md p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                                <span className="text-blue-400">⚡</span>
                                WOT SME Dashboard
                            </h1>
                            <p className="text-slate-600">Welcome, <span className="font-semibold text-blue-600">{user?.name || 'SME User'}</span></p>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
                            <Link
                                to="/help"
                                className="flex-1 md:flex-none bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl shadow-md hover:shadow-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="hidden md:inline">Help</span>
                            </Link>
                            <button
                                onClick={handleCreateNewOrder}
                                className="flex-1 md:flex-none bg-linear-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white px-4 py-3 rounded-xl shadow-md hover:shadow-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 group"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="hidden md:inline">New Order</span>
                            </button>
                            <button
                                onClick={logout}
                                className="flex-1 md:flex-none bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-3 rounded-xl shadow-md hover:shadow-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="hidden md:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4"></div>
                    <p className="text-slate-600 text-lg">Loading your orders...</p>
                </div>
            )}
            
            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                    <p className="text-red-700 text-lg">⚠️ Error fetching orders. Please try again.</p>
                </div>
            )}

            {/* Kanban Board */}
            {!isLoading && !error && (
                <div>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <span>📊</span> Order Pipeline
                        </h2>
                        <p className="text-slate-600 text-sm mt-1">Drag and manage your orders through each stage</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 auto-rows-max">
                        {STATUS_SEQUENCE.filter(s => s !== 'CANCELLED').map(status => {
                            const statusEmojis: Record<string, string> = {
                                NEW: '🆕',
                                PROCESSING: '⚙️',
                                READY: '📦',
                                DISPATCHED: '🚀',
                                COMPLETED: '✅',
                            };
                            const count = ordersByStatus[status]?.length || 0;

                            return (
                                <div key={status} className="bg-white border border-blue-100 rounded-2xl p-5 hover:bg-blue-50 transition-all duration-300 min-h-96">
                                    {/* Column Header */}
                                    <div className="mb-4 pb-4 border-b border-blue-100">
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{statusEmojis[status]}</span>
                                            {status}
                                        </h3>
                                        <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                                            {count} {count === 1 ? 'order' : 'orders'}
                                        </div>
                                    </div>

                                    {/* Orders */}
                                    <div className="space-y-3">
                                        {ordersByStatus[status]?.map((order: typeof MOCK_ORDERS[0]) => (
                                            <OrderCard 
                                                key={order.id} 
                                                order={order} 
                                                handleNextStage={handleNextStage} 
                                            />
                                        ))}
                                        
                                        {(!ordersByStatus[status] || ordersByStatus[status].length === 0) && (
                                          <p className="text-xs text-slate-400 italic text-center py-8">No orders in this stage</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* --- Rider Assignment Modal --- */}
            {isRiderModalOpen && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-blue-100 rounded-2xl shadow-lg max-w-sm w-full p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl">🎯</span>
                            <h3 className="text-2xl font-bold text-slate-900">Assign Rider</h3>
                        </div>
                        
                        <p className="text-slate-600 mb-6">
                            Order <span className="font-bold text-blue-600">
                                #
                                {(Array.isArray(orders)
                                    ? orders.find((o) => o.id === selectedOrderId)?.readable_id
                                    : '')}
                            </span> is ready for dispatch.
                        </p>
                        
                        <label className="block text-sm font-semibold text-slate-900 mb-3">Rider Phone Number</label>
                        <input
                            type="tel"
                            value={riderPhoneInput}
                            onChange={(e) => setRiderPhoneInput(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="+234..."
                            required
                        />

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsRiderModalOpen(false)}
                                className="px-6 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleRiderAssignment}
                                disabled={!riderPhoneInput || updateStatusMutation.isPending}
                                className="px-6 py-2 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {updateStatusMutation.isPending ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Sending...
                                    </>
                                ) : '✓ Dispatch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- New Order Modal --- */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-blue-100 rounded-2xl shadow-lg max-w-sm w-full p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl">📏</span>
                            <h3 className="text-2xl font-bold text-slate-900">Create New Order</h3>
                        </div>
                        
                        <p className="text-slate-600 mb-6">Enter customer details and order information to create a new order.</p>
                        
                        <div className="space-y-4 mb-6">
                            <input 
                                type="text" 
                                placeholder="Customer Name" 
                                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            />
                            <input 
                                type="tel" 
                                placeholder="Customer Phone" 
                                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            />
                            <textarea 
                                placeholder="Delivery Address" 
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                            />
                            <input 
                                type="number" 
                                placeholder="Order Price (₦)" 
                                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsOrderModalOpen(false)}
                                className="px-6 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsOrderModalOpen(false); alert('Order created successfully!'); queryClient.invalidateQueries({ queryKey: ['orders'] }); }}
                                className="px-6 py-2 bg-linear-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmeDashboard;