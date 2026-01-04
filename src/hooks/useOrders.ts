import { useEffect, useState, useCallback } from 'react';
import type { Order } from '../lib/supabase';
import { supabase } from '../lib/supabase';

/**
 * Hook to fetch orders for SME dashboard with real-time updates
 */
export const useOrders = (smeId: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!smeId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('sme_id', smeId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, [smeId]);

  useEffect(() => {
    // Fetch initial data
    fetchOrders();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`orders:sme_id=eq.${smeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `sme_id=eq.${smeId}`,
        },
        (payload) => {
          // Handle INSERT
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => {
              if (prev.some((o) => o.id === payload.new.id)) return prev;
              return [payload.new as Order, ...prev];
            });
          }
          // Handle UPDATE
          else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id ? (payload.new as Order) : order
              )
            );
          }
          // Handle DELETE
          else if (payload.eventType === 'DELETE') {
            setOrders((prev) =>
              prev.filter((order) => order.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchOrders, smeId]);

  // --- Local State Helpers for Seamless UI ---
  const updateLocalOrder = useCallback((orderId: string, updates: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
    );
  }, []);

  const insertLocalOrder = useCallback((newOrder: Order) => {
    setOrders((prev) => {
      if (prev.some((o) => o.id === newOrder.id)) return prev;
      return [newOrder, ...prev];
    });
  }, []);

  const removeLocalOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  return {
    orders,
    isLoading,
    error,
    refreshOrders: fetchOrders,
    updateLocalOrder,
    insertLocalOrder,
    removeLocalOrder
  };
};

/**
 * Hook to fetch a single order by token (for public access)
 */
export const useOrderByToken = (token: string | undefined) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('rider_token', token)
          .single();

        if (fetchError) throw fetchError;
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Order not found');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchOrder();
  }, [token]);

  return { order, isLoading, error };
};

/**
 * Hook to update rider location
 */
export const useUpdateRiderLocation = (orderId: string) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLocation = useCallback(
    async (lat: number, lng: number) => {
      try {
        setIsUpdating(true);
        const { error: updateError } = await supabase
          .from('orders')
          .update({ rider_lat: lat, rider_lng: lng, updated_at: new Date().toISOString() })
          .eq('id', orderId);

        if (updateError) throw updateError;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update location');
      } finally {
        setIsUpdating(false);
      }
    },
    [orderId]
  );

  return { updateLocation, isUpdating, error };
};

/**
 * Hook to subscribe to real-time order updates
 */
export const useOrderSubscription = (orderId: string, onUpdate: (order: Order) => void) => {
  useEffect(() => {
    const subscription = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          onUpdate(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId, onUpdate]);
};

/**
 * Hook to update order status
 */
export const useUpdateOrderStatus = (orderId: string) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (status: Order['status']) => {
      try {
        setIsUpdating(true);
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', orderId);

        if (updateError) throw updateError;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update status');
      } finally {
        setIsUpdating(false);
      }
    },
    [orderId]
  );

  return { updateStatus, isUpdating, error };
};

/**
 * Hook to submit CSAT feedback
 */
export const useSubmitCSAT = (orderId: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (score: number, comment: string) => {
      try {
        setIsSubmitting(true);
        const { error: submitError } = await supabase
          .from('orders')
          .update({
            csat_score: score,
            csat_comment: comment,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (submitError) throw submitError;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit feedback');
      } finally {
        setIsSubmitting(false);
      }
    },
    [orderId]
  );

  return { submit, isSubmitting, error };
};

/**
 * Hook to assign a rider to an order
 */
export const useAssignRider = (orderId: string) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignRider = useCallback(
    async (riderPhone: string, riderToken: string) => {
      try {
        setIsAssigning(true);
        const { error: assignError } = await supabase
          .from('orders')
          .update({
            rider_phone: riderPhone,
            rider_token: riderToken,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (assignError) throw assignError;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign rider');
      } finally {
        setIsAssigning(false);
      }
    },
    [orderId]
  );

  return { assignRider, isAssigning, error };
};

/**
 * Hook to delete an order
 */
export const useDeleteOrder = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      setIsDeleting(true);
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (deleteError) throw deleteError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { deleteOrder, isDeleting, error };
};

/**
 * Hook to update an existing order
 */
export const useUpdateOrder = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>) => {
    try {
      setIsUpdating(true);
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return { updateOrder, isUpdating, error };
};
