import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import type { Order } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useOrders, useDeleteOrder, useUpdateOrder } from '../hooks/useOrders';
import { formatNaira, generateToken } from '../lib/utils';
import { sendWhatsAppMessage, generateOrderStatusMessage } from '../lib/whatsapp';
import AuthHeader from '../components/AuthHeader';
import {
  Container, Paper, Title, Text, Button, Group, Stack, SimpleGrid, Card, Badge, Modal,
  TextInput, Textarea, NumberInput, ThemeIcon, Alert, Loader,
  Center, Tabs, RingProgress, Divider, rem, Box, Select, Switch, ScrollArea
} from '@mantine/core';
import {
  IconPlus, IconArrowRight, IconBell, IconTrendingUp, IconAlertCircle, IconCheck, IconPackage,
  IconTruckDelivery, IconMapPin, IconUser, IconPhone, IconCurrencyNaira, IconClipboardList, IconSearch,
  IconEdit, IconTrash,
} from '@tabler/icons-react';

// --- Default Order Form Component ---
// This component handles the rendering of the optional fields based on config
interface DefaultOrderFormProps {
  activeFields: Record<string, boolean>; // e.g. { email: true, notes: false }
  onSubmit: (data: any) => void;
  isLoading: boolean;
  initialValues?: any;
}

const DefaultOrderForm: React.FC<DefaultOrderFormProps> = ({ activeFields, onSubmit, isLoading, initialValues }) => {
  const [formData, setFormData] = useState({
    // Compulsory Fields
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    price_total: 0,

    // Optional Fields (stored in form_data)
    email: '',
    alt_phone: '',
    landmark: '',
    delivery_time: '',
    payment_method: '',
    item_desc: '',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    if (initialValues) {
      setFormData(prev => ({
        ...prev,
        ...initialValues,
        ...initialValues.form_data // Flatten nested form_data for the form state
      }));
    }
  }, [initialValues]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    // Separate core fields and optional fields
    const {
      customer_name, customer_phone, delivery_address, price_total,
      ...optionalData
    } = formData;

    // Filter optionalData to only include active fields
    const filteredOptional: Record<string, any> = {};
    Object.keys(optionalData).forEach(key => {
      // Check if this field key is active in the config
      // Note: We need to match the keys used in FormManagementPage
      if (activeFields[key]) {
        filteredOptional[key] = (optionalData as any)[key];
      }
    });

    const submissionData = {
      customer_name,
      customer_phone,
      delivery_address,
      price_total,
      form_data: filteredOptional
    };

    onSubmit(submissionData);
  };

  return (
    <Stack gap="xl">
      {/* Section 1: Customer Details */}
      <Box>
        <Group mb="xs" gap="xs">
          <ThemeIcon variant="light" size="sm" color="blue"><IconUser size={14} /></ThemeIcon>
          <Text fw={700} size="sm" c="dimmed" tt="uppercase">Customer Details</Text>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            label="Customer Name"
            placeholder="Full Name"
            required
            value={formData.customer_name}
            onChange={(e) => handleChange('customer_name', e.target.value)}
          />
          <TextInput
            label="Phone Number"
            placeholder="+234..."
            required
            value={formData.customer_phone}
            onChange={(e) => handleChange('customer_phone', e.target.value)}
          />

          {activeFields['email'] && (
            <TextInput
              label="Customer Email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          )}

          {activeFields['alt_phone'] && (
            <TextInput
              label="Alternative Phone"
              placeholder="Backup number"
              value={formData.alt_phone}
              onChange={(e) => handleChange('alt_phone', e.target.value)}
            />
          )}
        </SimpleGrid>
      </Box>
      <Divider variant="dashed" />

      {/* Section 2: Delivery Details */}
      <Box>
        <Group mb="xs" gap="xs">
          <ThemeIcon variant="light" size="sm" color="orange"><IconMapPin size={14} /></ThemeIcon>
          <Text fw={700} size="sm" c="dimmed" tt="uppercase">Delivery Information</Text>
        </Group>
        <Stack gap="md">
          <Textarea
            label="Delivery Address"
            placeholder="Full address"
            required
            autosize
            minRows={2}
            value={formData.delivery_address}
            onChange={(e) => handleChange('delivery_address', e.target.value)}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {activeFields['landmark'] && (
              <TextInput
                label="Nearest Landmark"
                placeholder="e.g. Near the big mosque"
                value={formData.landmark}
                onChange={(e) => handleChange('landmark', e.target.value)}
              />
            )}

            {activeFields['delivery_time'] && (
              <TextInput
                type="time"
                label="Preferred Delivery Time"
                value={formData.delivery_time}
                onChange={(e) => handleChange('delivery_time', e.target.value)}
              />
            )}
          </SimpleGrid>
        </Stack>
      </Box>
      <Divider variant="dashed" />

      {/* Section 3: Order Specifics */}
      <Box>
        <Group mb="xs" gap="xs">
          <ThemeIcon variant="light" size="sm" color="green"><IconPackage size={14} /></ThemeIcon>
          <Text fw={700} size="sm" c="dimmed" tt="uppercase">Order Details</Text>
        </Group>

        <Stack gap="md">
          {activeFields['item_desc'] && (
            <Textarea
              label="Item Description"
              placeholder="What is being delivered?"
              autosize
              minRows={2}
              value={formData.item_desc}
              onChange={(e) => handleChange('item_desc', e.target.value)}
            />
          )}

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <NumberInput
              label="Total Price"
              placeholder="0.00"
              prefix="₦"
              required
              value={formData.price_total}
              onChange={(val) => handleChange('price_total', Number(val))}
              hideControls
            />

            {activeFields['quantity'] && (
              <NumberInput
                label="Quantity"
                defaultValue={1}
                min={1}
                value={formData.quantity}
                onChange={(val) => handleChange('quantity', Number(val))}
              />
            )}
          </SimpleGrid>

          {activeFields['payment_method'] && (
            <Select
              label="Payment Method"
              data={['Cash', 'Transfer', 'POS']}
              placeholder="Select method"
              value={formData.payment_method}
              onChange={(val) => handleChange('payment_method', val)}
            />
          )}

          {activeFields['notes'] && (
            <Textarea
              label="Notes"
              placeholder="Instructions for rider..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          )}
        </Stack>
      </Box>

      <Button fullWidth size="lg" radius="md" mt="md" onClick={handleSubmit} loading={isLoading} leftSection={<IconCheck size={20} />}>
        {initialValues ? 'Update Order' : 'Confirm Order Creation'}
      </Button>
    </Stack>
  );
};
// --- End Default Order Form Component ---

const STATUS_SEQUENCE: Order['status'][] = ['NEW', 'PROCESSING', 'READY', 'DISPATCHED', 'COMPLETED'];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const statusConfig: Record<Order['status'], { icon: React.ElementType; color: string; nextLabel: string }> = {
  NEW: { icon: IconClipboardList, color: 'blue', nextLabel: 'Start Processing' },
  PROCESSING: { icon: IconPackage, color: 'blue', nextLabel: 'Mark Ready' },
  READY: { icon: IconTruckDelivery, color: 'blue', nextLabel: 'Assign Rider' },
  DISPATCHED: { icon: IconBell, color: 'blue', nextLabel: 'Mark Complete' },
  COMPLETED: { icon: IconCheck, color: 'blue', nextLabel: 'Completed' },
  CANCELLED: { icon: IconAlertCircle, color: 'blue', nextLabel: 'Cancelled' },
};

interface OrderCardProps {
  order: Order;
  onNextStage: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  isLoading: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onNextStage, onEdit, onDelete, isLoading }) => {
  const nextStatusIndex = STATUS_SEQUENCE.indexOf(order.status as Order['status']) + 1;
  const nextStatus = nextStatusIndex < STATUS_SEQUENCE.length ? STATUS_SEQUENCE[nextStatusIndex] : null;
  const config = statusConfig[order.status as Order['status']];
  const StatusIcon = config.icon;

  return (
    <Card withBorder padding="lg" radius="md" shadow="sm" style={{ transition: 'transform 0.2s ease' }}>
      <Group justify="space-between" mb="xs">
        <Badge color={config.color} variant="filled" size="sm" radius="sm">
          {order.status}
        </Badge>
        {/* Only show actions if NOT completed */}
        {order.status !== 'COMPLETED' && (
          <Group gap="xs">
            <ThemeIcon variant="subtle" color="gray" size="sm" style={{ cursor: 'pointer' }} onClick={() => onEdit(order)}>
              <IconEdit size={16} />
            </ThemeIcon>
            <ThemeIcon variant="subtle" color="red" size="sm" style={{ cursor: 'pointer' }} onClick={() => onDelete(order.id)}>
              <IconTrash size={16} />
            </ThemeIcon>
          </Group>
        )}
        <Text size="xs" c="dimmed" ff="monospace" fw={700}>#{order.readable_id}</Text>
      </Group>

      <Group wrap="nowrap" align="flex-start" mb="md">
        <ThemeIcon color={config.color} variant="light" size="xl" radius="md">
          <StatusIcon size={24} />
        </ThemeIcon>
        <Box style={{ flex: 1 }}>
          <Text fw={700} size="md" lineClamp={1}>{order.customer_name}</Text>
          <Text size="xs" c="dimmed">{order.customer_phone}</Text>
        </Box>
      </Group>

      <Divider variant="dashed" mb="sm" />

      <Stack gap="xs" mb="lg">
        <Group justify="space-between">
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">Amount</Text>
          <Text fw={800} c="blue" size="lg">{formatNaira(order.price_total)}</Text>
        </Group>

        {order.delivery_address && (
          <Group gap={4} align="flex-start" wrap="nowrap">
            <IconMapPin size={14} style={{ marginTop: rem(2) }} />
            <Text size="xs" c="dimmed" lineClamp={2}>{order.delivery_address}</Text>
          </Group>
        )}
      </Stack>

      {nextStatus && order.status !== 'COMPLETED' && (
        <Button
          fullWidth
          variant="gradient"
          gradient={{ from: config.color, to: 'cyan', deg: 90 }}
          rightSection={<IconArrowRight size={16} />}
          onClick={() => onNextStage(order.id)}
          loading={isLoading}
          radius="md"
        >
          {config.nextLabel}
        </Button>
      )}

      {order.status === 'COMPLETED' && (
        <Button fullWidth disabled variant="light" color="blue" radius="md" leftSection={<IconCheck size={16} />}>
          Delivered
        </Button>
      )}
    </Card>
  );
};

const SmeDashboard: React.FC = () => {
  const { user } = useAuth();
  const smeId = user?.id || '';
  const { orders, isLoading: isOrdersLoading, refreshOrders, updateLocalOrder, insertLocalOrder, removeLocalOrder } = useOrders(smeId);
  const { deleteOrder } = useDeleteOrder();
  const { updateOrder } = useUpdateOrder();

  // Modals and States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [riderPhone, setRiderPhone] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  // Form Config State
  const [activeFormFields, setActiveFormFields] = useState<Record<string, boolean>>({});
  const [isConfigLoading, setIsConfigLoading] = useState(false);

  // Fetch Form Config
  useEffect(() => {
    const fetchFormConfig = async () => {
      if (!user?.id) return;
      setIsConfigLoading(true);
      try {
        const token = localStorage.getItem('wot_auth_token');
        const res = await fetch(`${API_BASE_URL}/forms`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-sme-id': user.id
          }
        });
        const json = await res.json();
        const schemas = json.schemas || json.data || [];

        // Find default form or use first one
        const activeForm = schemas.find((f: any) => f.name === 'Default Order Form') || schemas[0];

        if (activeForm && Array.isArray(activeForm.fields)) {
          const currentActive: Record<string, boolean> = {};
          activeForm.fields.forEach((field: any) => {
            currentActive[field.field_key] = true;
          });
          setActiveFormFields(currentActive);
        }
      } catch (err) { console.error(err); } finally { setIsConfigLoading(false); }
    };
    fetchFormConfig();
  }, [user?.id]);


  // --- Logic Handlers ---
  const handleNextStage = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const nextStatusIndex = STATUS_SEQUENCE.indexOf(order.status as Order['status']) + 1;
    const nextStatus = STATUS_SEQUENCE[nextStatusIndex] as Order['status'];

    if (nextStatus === 'READY') {
      setSelectedOrderId(orderId);
      setIsRiderModalOpen(true);
    } else if (nextStatus) {
      const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId);
      if (error) { alert('Failed to update order status'); return; }

      // OPTIMISTIC UPDATE: Update UI immediately
      updateLocalOrder(orderId, { status: nextStatus });

      const trackingUrl = nextStatus === 'DISPATCHED' && order.rider_token
        ? `${window.location.origin}/track/${order.rider_token}`
        : nextStatus === 'COMPLETED' && order.rider_token
          ? `${window.location.origin}/csat/${order.rider_token}`
          : undefined;

      const messageText = generateOrderStatusMessage(nextStatus, order.readable_id, trackingUrl);

      await sendWhatsAppMessage({
        phone: order.customer_phone,
        message: messageText,
        orderId: order.id,
        smeId: smeId // Pass smeId to fix type error if present
      });
      // No need to refreshOrders() here anymore as we did it locally
    }
  }, [orders, updateLocalOrder]);

  const handleRiderAssignment = async () => {
    if (!selectedOrderId || !riderPhone) return;
    const order = orders.find((o) => o.id === selectedOrderId);
    if (!order) return;
    setIsAssigning(true);
    try {
      const riderToken = generateToken();
      const { error } = await supabase.from('orders').update({ rider_phone: riderPhone, rider_token: riderToken, status: 'READY' }).eq('id', selectedOrderId);
      if (error) { alert('Failed to assign rider'); return; }

      // OPTIMISTIC UPDATE
      updateLocalOrder(selectedOrderId, { rider_phone: riderPhone, rider_token: riderToken, status: 'READY' });

      // Customer Notification
      const trackingUrl = `${window.location.origin}/track/${riderToken}`;
      const customerMsg = `Great news! Your order #${order.readable_id} is ready and will be dispatched soon. 📦\n\nTrack your delivery here: ${trackingUrl}`;
      await sendWhatsAppMessage({
        phone: order.customer_phone,
        message: customerMsg,
        orderId: order.id,
        smeId: smeId
      });

      // Rider Notification
      const riderUrl = `${window.location.origin}/rider/${riderToken}`;
      const riderMsg = `🚨 New Delivery Assigned!\nOrder #${order.readable_id}\n\n📞 Customer: ${order.customer_phone}\n📍 Pickup: Shop Location\n📍 Dropoff: ${order.delivery_address}\n\nClick here to start delivery: ${riderUrl}`;

      const riderResult = await sendWhatsAppMessage({
        phone: riderPhone,
        message: riderMsg,
        orderId: order.id,
        smeId: smeId
      });

      if (!riderResult.success) {
        setWhatsappError(`Rider assigned, but WhatsApp failed: ${riderResult.error}`);
      }

      setIsRiderModalOpen(false);
      setRiderPhone('');
      setSelectedOrderId(null);
    } finally { setIsAssigning(false); }
  };

  const handleCreateOrder = async (submissionData: Record<string, any>) => {
    setIsCreating(true);
    const readableId = `WOT${Date.now().toString().slice(-6)}`;

    // Data is already structured by DefaultOrderForm, just need to add system fields
    const { data, error } = await supabase.from('orders').insert([{
      sme_id: smeId,
      readable_id: readableId,
      status: 'NEW',
      ...submissionData
    }])
      .select()
      .single();

    setIsCreating(false);
    if (error) { alert('Failed to create order: ' + error.message); return; }

    // OPTIMISTIC UPDATE: Add new order to list immediately
    if (data) {
      insertLocalOrder(data as Order);
    } else {
      refreshOrders(); // Fallback if no data returned
    }

    const waResult = await sendWhatsAppMessage({
      phone: submissionData.customer_phone,
      message: generateOrderStatusMessage('NEW', readableId),
      orderId: readableId
    });

    if (!waResult.success) {
      setWhatsappError(`Order created but WhatsApp failed: ${waResult.error}`);
    }

    setIsOrderModalOpen(false);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        await deleteOrder(orderId);
        removeLocalOrder(orderId);
      } catch (err) {
        alert('Failed to delete order');
      }
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsEditModalOpen(true);
  };

  const handleUpdateOrder = async (data: any) => {
    if (!editingOrder) return;
    setIsEditing(true);
    try {
      await updateOrder(editingOrder.id, data);
      setIsEditModalOpen(false);

      // Local update
      updateLocalOrder(editingOrder.id, data);

      setEditingOrder(null);
    } catch (err) {
      alert('Failed to update order');
    } finally {
      setIsEditing(false);
    }
  };

  const ordersByStatus = orders.filter(order => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.customer_name?.toLowerCase().includes(query) ||
      order.readable_id?.toLowerCase().includes(query) ||
      order.customer_phone?.includes(query)
    );
  }).reduce((acc, order) => {
    acc[order.status] = acc[order.status] || [];
    acc[order.status].push(order);
    return acc;
  }, {} as Record<Order['status'], Order[]>);

  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
  const totalRevenue = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.price_total, 0);

  const unrealizedRevenue = orders
    .filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.price_total, 0);

  if (isOrdersLoading) return <Container><Center mih="100vh"><Loader size="xl" variant="bars" /></Center></Container>;

  return (
    <Container size="xl" py="xl">
      <AuthHeader title="WOT Dashboard" />
      {/* Modern Stats Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={0}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Orders</Text>
              <Text fw={900} size="xl">{orders.length}</Text>
            </Stack>
            <RingProgress size={60} thickness={6} sections={[{ value: 100, color: 'blue' }]} label={<Center><IconPackage size={16} /></Center>} />
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={0}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Delivered</Text>
              <Text fw={900} size="xl" c="teal">{completedOrders}</Text>
            </Stack>
            <ThemeIcon size="xl" radius="md" color="teal" variant="light"><IconCheck /></ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={0}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Total Revenue</Text>
              <Text fw={900} size="xl" c="green">{formatNaira(totalRevenue)}</Text>
            </Stack>
            <ThemeIcon size="xl" radius="md" color="green" variant="light"><IconTrendingUp /></ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={0}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Unrealized Revenue</Text>
              <Text fw={900} size="xl" c="blue">{formatNaira(unrealizedRevenue)}</Text>
            </Stack>
            <ThemeIcon size="xl" radius="md" color="blue" variant="light"><IconCurrencyNaira /></ThemeIcon>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Alerts */}
      {whatsappError && <Alert icon={<IconBell />} title="WhatsApp Update" color="yellow" variant="light" mb="lg" withCloseButton onClose={() => setWhatsappError(null)}>{whatsappError}</Alert>}

      <Group justify="space-between" mb="md">
        <Title order={3}>Orders</Title>
        <TextInput
          placeholder="Search items..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          style={{ width: 300 }}
        />
      </Group>

      {/* Interactive Tabs */}
      <Tabs variant="pills" defaultValue="NEW" mb="xl" radius="md">
        <Tabs.List grow>
          {STATUS_SEQUENCE.map((status) => {
            const Config = statusConfig[status];
            return (
              <Tabs.Tab key={status} value={status} leftSection={<Config.icon size={14} />}>
                <Group gap={6}>
                  <Text size="sm">{status}</Text>
                  <Badge size="xs" circle variant="outline">{ordersByStatus[status]?.length || 0}</Badge>
                </Group>
              </Tabs.Tab>
            )
          })}
        </Tabs.List>

        {STATUS_SEQUENCE.map((status) => (
          <Tabs.Panel key={status} value={status} pt="xl">
            {!ordersByStatus[status]?.length ? (
              <Paper withBorder p="xl" radius="md" style={{ borderStyle: 'dashed' }}>
                <Stack align="center" gap="xs">
                  <IconPackage size={40} opacity={0.2} />
                  <Text c="dimmed">No orders found in {status}</Text>
                </Stack>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {ordersByStatus[status].map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onNextStage={handleNextStage}
                    onEdit={handleEditOrder}
                    onDelete={handleDeleteOrder}
                    isLoading={isOrdersLoading}
                  />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        ))}
      </Tabs>

      <Center mb={50}>
        <Button size="xl" radius="xl" leftSection={<IconPlus />} onClick={() => setIsOrderModalOpen(true)}>
          Create New Order
        </Button>
      </Center>

      {/* Create Order Modal - Simplified */}
      <Modal
        opened={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title={<Text fw={900}>New Delivery Request</Text>}
        centered
        radius="lg"
        size="lg"
      >
        <ScrollArea.Autosize mah="calc(100vh - 200px)" type="scroll">
          <Box p="md">
            {isConfigLoading ? (
              <Center py="xl"><Loader /></Center>
            ) : (
              <>
                <Alert variant="light" color="blue" mb="lg" icon={<IconAlertCircle size={16} />}>
                  <Group justify="space-between" align="center">
                    <Text size="sm">Configure which fields appear here in Settings.</Text>
                    <Link to="/forms" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Settings &rarr;</Link>
                  </Group>
                </Alert>
                <DefaultOrderForm
                  activeFields={activeFormFields}
                  onSubmit={handleCreateOrder}
                  isLoading={isCreating}
                />
              </>
            )}
          </Box>
        </ScrollArea.Autosize>
      </Modal>

      <Modal opened={isRiderModalOpen} onClose={() => setIsRiderModalOpen(false)} title={<Text fw={900}>Dispatch Assignment</Text>} centered radius="lg">
        <Stack gap="md" p="md">
          <Alert color="blue" icon={<IconTruckDelivery size={16} />}>Assign a rider to start the delivery process for order #{orders.find(o => o.id === selectedOrderId)?.readable_id}</Alert>
          <TextInput label="Rider Contact" placeholder="Rider phone number" value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} />
          <Button fullWidth size="lg" onClick={handleRiderAssignment} loading={isAssigning} radius="md">Confirm Dispatch</Button>
        </Stack>
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        opened={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingOrder(null); }}
        title={<Text fw={900}>Edit Order #{editingOrder?.readable_id}</Text>}
        centered
        radius="lg"
        size="lg"
      >
        <ScrollArea.Autosize mah="calc(100vh - 200px)" type="scroll">
          <Box p="md">
            <DefaultOrderForm
              activeFields={activeFormFields}
              onSubmit={handleUpdateOrder}
              isLoading={isEditing}
              initialValues={editingOrder}
            />
          </Box>
        </ScrollArea.Autosize>
      </Modal>
    </Container>
  );
};

export default SmeDashboard;