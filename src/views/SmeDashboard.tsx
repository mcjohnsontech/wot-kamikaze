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
    const isDispatched = order.status === 'DISPATCHED';
    const nextStatusIndex = STATUS_SEQUENCE.indexOf(order.status) + 1;
    const nextStatus = STATUS_SEQUENCE[nextStatusIndex];
    
    // Status color mapping
    const statusColors: Record<string, { bg: string; border: string; icon: string }> = {
        NEW: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', icon: '⭐' },
        PROCESSING: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', icon: '⚙️' },
        READY: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', icon: '📦' },
        DISPATCHED: { bg: 'bg-green-500/20', border: 'border-green-500/50', icon: '🚀' },
        COMPLETED: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', icon: '✅' },
    };

    const statusConfig = statusColors[order.status] || { bg: 'bg-gray-500/20', border: 'border-gray-500/50', icon: '•' };

    return (
        <div className={`p-4 bg-linear-to-br from-white/10 to-white/5 border ${statusConfig.border} rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-opacity-100`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{statusConfig.icon}</span>
                    <div>
                        <p className="font-bold text-white text-lg">#{order.readable_id}</p>
                        <p className="text-xs text-slate-400">{order.customer}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg} backdrop-blur-sm`}>
                    {order.status}
                </span>
            </div>
            
            <p className="text-sm text-emerald-400 font-semibold mb-3">💰 {order.price}</p>
            
            {!isCompleted && nextStatus && (
                <button 
                    className="w-full text-sm text-blue-300 hover:text-blue-200 font-bold flex items-center justify-center gap-2 py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all duration-200 group"
                    onClick={() => handleNextStage(order.id, order.status)}
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
                 <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">✅ Completed</p>
            )}

            {isDispatched && (
                 <p className="mt-2 text-xs text-slate-400 italic">📱 {order.rider_phone}</p>
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
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-blue-900 p-4 md:p-8">
            {/* Header */}
            <header className="mb-8">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                                <span className="text-blue-400">⚡</span>
                                WOT SME Dashboard
                            </h1>
                            <p className="text-slate-300">Welcome, <span className="font-semibold text-blue-300">{user?.name || 'SME User'}</span></p>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={handleCreateNewOrder}
                                className="flex-1 md:flex-none bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 group"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="hidden md:inline">New Order</span>
                            </button>
                            <button
                                onClick={logout}
                                className="flex-1 md:flex-none bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
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
                    <div className="w-12 h-12 rounded-full border-4 border-slate-600 border-t-blue-400 animate-spin mb-4"></div>
                    <p className="text-slate-400 text-lg">Loading your orders...</p>
                </div>
            )}
            
            {/* Error State */}
            {error && (
                <div className="backdrop-blur-xl bg-red-500/20 border border-red-500/50 rounded-2xl p-6 text-center">
                    <p className="text-red-200 text-lg">⚠️ Error fetching orders. Please try again.</p>
                </div>
            )}

            {/* Kanban Board */}
            {!isLoading && !error && (
                <div>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <span>📊</span> Order Pipeline
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Drag and manage your orders through each stage</p>
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
                                <div key={status} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 min-h-96">
                                    {/* Column Header */}
                                    <div className="mb-4 pb-4 border-b border-white/10">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{statusEmojis[status]}</span>
                                            {status}
                                        </h3>
                                        <div className="inline-block px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-sm font-semibold">
                                            {count} {count === 1 ? 'order' : 'orders'}
                                        </div>
                                    </div>

                                    {/* Orders */}
                                    <div className="space-y-3">
                                        {ordersByStatus[status]?.map((order: OrderType) => (
                                            <OrderCard 
                                                key={order.id} 
                                                order={order} 
                                                handleNextStage={handleNextStage} 
                                            />
                                        ))}
                                        
                                        {(!ordersByStatus[status] || ordersByStatus[status].length === 0) && (
                                          <p className="text-xs text-slate-500 italic text-center py-8">No orders in this stage</p>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="backdrop-blur-xl bg-linear-to-br from-slate-800 to-slate-900 border border-white/20 rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl">🎯</span>
                            <h3 className="text-2xl font-bold text-white">Assign Rider</h3>
                        </div>
                        
                        <p className="text-slate-300 mb-6">
                            Order <span className="font-bold text-blue-300">
                                #
                                {(Array.isArray(orders)
                                    ? orders.find((o: OrderType) => o.id === selectedOrderId)?.readable_id
                                    : '')}
                            </span> is ready for dispatch.
                        </p>
                        
                        <label className="block text-sm font-semibold text-slate-200 mb-3">Rider Phone Number</label>
                        <input
                            type="tel"
                            value={riderPhoneInput}
                            onChange={(e) => setRiderPhoneInput(e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                            placeholder="+234..."
                            required
                        />

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsRiderModalOpen(false)}
                                className="px-6 py-2 text-slate-300 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleRiderAssignment}
                                disabled={!riderPhoneInput || updateStatusMutation.isPending}
                                className="px-6 py-2 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="backdrop-blur-xl bg-linear-to-br from-slate-800 to-slate-900 border border-white/20 rounded-2xl shadow-2xl max-w-sm w-full p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl">📝</span>
                            <h3 className="text-2xl font-bold text-white">Create New Order</h3>
                        </div>
                        
                        <p className="text-slate-400 mb-6">Enter customer details and order information to create a new order.</p>
                        
                        <div className="space-y-4 mb-6">
                            <input 
                                type="text" 
                                placeholder="Customer Name" 
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                            />
                            <input 
                                type="tel" 
                                placeholder="Customer Phone" 
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                            />
                            <textarea 
                                placeholder="Delivery Address" 
                                rows={3}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
                            />
                            <input 
                                type="number" 
                                placeholder="Order Price (₦)" 
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsOrderModalOpen(false)}
                                className="px-6 py-2 text-slate-300 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsOrderModalOpen(false); alert('Order created successfully!'); queryClient.invalidateQueries({ queryKey: ['orders'] }); }}
                                className="px-6 py-2 bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
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