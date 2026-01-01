import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import type { Order } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useOrders } from '../hooks/useOrders';
import { formatNaira, generateToken } from '../lib/utils';
import { sendWhatsAppMessage, generateOrderStatusMessage } from '../lib/whatsapp';
import { ChevronRight, Plus, HelpCircle, LogOut, Zap, TrendingUp, FileText, Upload, MessageCircle } from 'lucide-react';

const STATUS_SEQUENCE: Order['status'][] = [
  'NEW',
  'PROCESSING',
  'READY',
  'DISPATCHED',
  'COMPLETED',
];

const statusConfig: Record<Order['status'], { 
  icon: string; 
  bgGradient: string; 
  textColor: string;
  badgeColor: string;
  nextLabel: string;
}> = {
  NEW: { 
    icon: '📋', 
    bgGradient: 'from-amber-50 to-orange-50', 
    textColor: 'text-amber-700',
    badgeColor: 'bg-amber-100 text-amber-800',
    nextLabel: 'Start Processing'
  },
  PROCESSING: { 
    icon: '⚙️', 
    bgGradient: 'from-blue-50 to-cyan-50', 
    textColor: 'text-blue-700',
    badgeColor: 'bg-blue-100 text-blue-800',
    nextLabel: 'Mark Ready'
  },
  READY: { 
    icon: '📦', 
    bgGradient: 'from-purple-50 to-pink-50', 
    textColor: 'text-purple-700',
    badgeColor: 'bg-purple-100 text-purple-800',
    nextLabel: 'Assign Rider'
  },
  DISPATCHED: { 
    icon: '🚀', 
    bgGradient: 'from-green-50 to-emerald-50', 
    textColor: 'text-green-700',
    badgeColor: 'bg-green-100 text-green-800',
    nextLabel: 'Mark Complete'
  },
  COMPLETED: { 
    icon: '✅', 
    bgGradient: 'from-emerald-50 to-teal-50', 
    textColor: 'text-emerald-700',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    nextLabel: 'Completed'
  },
  CANCELLED: { 
    icon: '❌', 
    bgGradient: 'from-slate-50 to-gray-50', 
    textColor: 'text-slate-700',
    badgeColor: 'bg-slate-100 text-slate-800',
    nextLabel: 'Cancelled'
  },
};

interface OrderCardProps {
  order: Order;
  onNextStage: (orderId: string) => void;
  isLoading: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onNextStage, isLoading }) => {
  const nextStatusIndex = STATUS_SEQUENCE.indexOf(order.status as Order['status']) + 1;
  const nextStatus = nextStatusIndex < STATUS_SEQUENCE.length ? STATUS_SEQUENCE[nextStatusIndex] : null;
  const config = statusConfig[order.status as Order['status']];

  return (
    <div className={`bg-gradient-to-br ${config.bgGradient} border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{config.icon}</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">Order #{order.readable_id}</p>
            <p className="text-xs text-gray-600 mt-0.5">{order.customer_name}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${config.badgeColor}`}>
          {order.status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Amount</span>
          <span className="font-semibold text-emerald-600">{formatNaira(order.price_total)}</span>
        </div>

        {order.rider_phone && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Rider</span>
            <span className="text-xs text-gray-800 font-medium">{order.rider_phone}</span>
          </div>
        )}

        {order.delivery_address && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-600 flex-shrink-0 mt-0.5">📍</span>
            <span className="text-xs text-gray-700 line-clamp-2">{order.delivery_address}</span>
          </div>
        )}
      </div>

      {nextStatus && order.status !== 'COMPLETED' && (
        <button
          onClick={() => onNextStage(order.id)}
          disabled={isLoading}
          className="w-full mt-4 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-md font-medium text-xs transition-all duration-200 flex items-center justify-between group/btn disabled:opacity-50"
        >
          <span>{config.nextLabel}</span>
          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      )}

      {order.status === 'COMPLETED' && (
        <div className="w-full mt-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-md text-center">
          <span className="text-xs font-semibold text-emerald-700">Order Delivered</span>
        </div>
      )}
    </div>
  );
};

const SmeDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const smeId = user?.id || '';
  const { orders, isLoading, error } = useOrders(smeId);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [riderPhone, setRiderPhone] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [newOrderData, setNewOrderData] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    price_total: 0,
  });

  const handleNextStage = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const nextStatusIndex = STATUS_SEQUENCE.indexOf(order.status as Order['status']) + 1;
      const nextStatus = STATUS_SEQUENCE[nextStatusIndex] as Order['status'];

      if (nextStatus === 'READY') {
        setSelectedOrderId(orderId);
        setIsRiderModalOpen(true);
      } else if (nextStatus) {
        const { error } = await supabase
          .from('orders')
          .update({ status: nextStatus })
          .eq('id', orderId);

        if (error) {
          alert('Failed to update order status');
          return;
        }

        const messageText = generateOrderStatusMessage(nextStatus, order.readable_id);

        const result = await sendWhatsAppMessage({
          phone: order.customer_phone,
          message: messageText,
          orderId: order.id,
        });

        if (!result.success) {
          setWhatsappError(`WhatsApp notification failed: ${result.error}`);
        }
      }
    },
    [orders]
  );

  const handleRiderAssignment = async () => {
    if (!selectedOrderId || !riderPhone) return;
    setIsAssigning(true);

    try {
      const riderToken = generateToken(16);
      const order = orders.find((o) => o.id === selectedOrderId);

      if (!order) {
        alert('Order not found');
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({
          rider_phone: riderPhone,
          rider_token: riderToken,
          status: 'READY',
        })
        .eq('id', selectedOrderId);

      if (error) {
        alert('Failed to assign rider');
        return;
      }

      const trackingUrl = `${window.location.origin}/track/${riderToken}`;
      const messageText = `Great news! Your order #${order.readable_id} is ready and will be dispatched soon. 📦\n\nTrack your delivery here: ${trackingUrl}`;

      const result = await sendWhatsAppMessage({
        phone: order.customer_phone,
        message: messageText,
        orderId: order.id,
      });

      if (!result.success) {
        setWhatsappError(`WhatsApp notification failed: ${result.error}`);
      }

      alert(`✅ Rider assigned! Customer notified via WhatsApp with tracking link.`);
      setIsRiderModalOpen(false);
      setRiderPhone('');
      setSelectedOrderId(null);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateOrder = async () => {
    setIsCreating(true);
    if (
      !newOrderData.customer_name ||
      !newOrderData.customer_phone ||
      !newOrderData.delivery_address ||
      !newOrderData.price_total
    ) {
      setIsCreating(false);
      alert('Please fill in all fields');
      return;
    }

    const readableId = `WOT${Date.now().toString().slice(-6)}`;

    const { error } = await supabase.from('orders').insert([
      {
        sme_id: smeId,
        readable_id: readableId,
        status: 'NEW',
        ...newOrderData,
      },
    ]);

    setIsCreating(false);
    if (error) {
      alert('Failed to create order');
      return;
    }

    const messageText = generateOrderStatusMessage('NEW', readableId);

    const result = await sendWhatsAppMessage({
      phone: newOrderData.customer_phone,
      message: messageText,
      orderId: readableId,
    });

    if (!result.success) {
      setWhatsappError(
        `Order created but WhatsApp notification failed: ${result.error}`
      );
    }

    setIsOrderModalOpen(false);
    setNewOrderData({
      customer_name: '',
      customer_phone: '',
      delivery_address: '',
      price_total: 0,
    });

    alert(
      '✅ Order created successfully!' +
        (result.success
          ? ' Customer notified via WhatsApp.'
          : ' (Manual WhatsApp notification may be needed)')
    );
  };

  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = acc[order.status] || [];
    acc[order.status].push(order);
    return acc;
  }, {} as Record<Order['status'], Order[]>);

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.price_total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">WOT Delivery</h1>
              </div>
              <p className="text-sm text-gray-600">Welcome back, <span className="font-semibold text-gray-900">{user?.name || 'SME User'}</span></p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/forms"
                className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                title="Manage Forms"
              >
                <FileText className="w-6 h-6" />
              </Link>
              <Link
                to="/csv-import"
                className="p-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                title="Import CSV"
              >
                <Upload className="w-6 h-6" />
              </Link>
              <Link
                to="/whatsapp"
                className="p-2 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors"
                title="WhatsApp Config"
              >
                <MessageCircle className="w-6 h-6" />
              </Link>
              <Link
                to="/help"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Help & Support"
              >
                <HelpCircle className="w-6 h-6" />
              </Link>
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-700 font-semibold">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{totalOrders}</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-4 border border-emerald-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-700 font-semibold">Completed</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{completedOrders}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-200 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg p-4 border border-amber-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-700 font-semibold">Total Revenue</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{formatNaira(totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-amber-200 rounded-lg flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert */}
        {whatsappError && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold text-orange-900 text-sm">WhatsApp Error</p>
                <p className="text-orange-700 text-xs mt-1">{whatsappError}</p>
              </div>
            </div>
            <button
              onClick={() => setWhatsappError(null)}
              className="text-orange-600 hover:text-orange-700 font-semibold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Button */}
        <div className="mb-8">
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors duration-200"
          >
            <Plus className="w-5 h-5" />
            Create Order
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mb-4"></div>
            <p className="text-gray-600 text-sm">Loading orders...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Orders Pipeline */}
        {!isLoading && !error && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">Order Pipeline</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {STATUS_SEQUENCE.map((status) => {
                const count = ordersByStatus[status]?.length || 0;
                const config = statusConfig[status];

                return (
                  <div key={status} className="flex flex-col">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{config.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{status}</h3>
                          <p className="text-xs text-gray-500">{count} order{count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 flex-1">
                      {ordersByStatus[status]?.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onNextStage={handleNextStage}
                          isLoading={isLoading}
                        />
                      ))}
                      {(!ordersByStatus[status] || ordersByStatus[status].length === 0) && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                          <p className="text-xs text-gray-500">No orders</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Rider Modal */}
      {isRiderModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Assign Rider</h3>
            <p className="text-sm text-gray-600 mb-6">
              Order <span className="font-semibold text-blue-600">#{orders.find((o) => o.id === selectedOrderId)?.readable_id}</span>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Rider Phone</label>
                <input
                  type="tel"
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  placeholder="+234701234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsRiderModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRiderAssignment}
                disabled={isAssigning}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              >
                {isAssigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Create New Order</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={newOrderData.customer_name}
                  onChange={(e) => setNewOrderData({ ...newOrderData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+234701234567"
                  value={newOrderData.customer_phone}
                  onChange={(e) => setNewOrderData({ ...newOrderData, customer_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Delivery Address</label>
                <input
                  type="text"
                  placeholder="123 Main Street, Lagos"
                  value={newOrderData.delivery_address}
                  onChange={(e) => setNewOrderData({ ...newOrderData, delivery_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Amount (₦)</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={newOrderData.price_total || ''}
                  onChange={(e) => setNewOrderData({ ...newOrderData, price_total: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={isCreating}
                aria-busy={isCreating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-60"
              >
                {isCreating ? 'Creating…' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmeDashboard;
