import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import type { Order } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useOrders, useDeleteOrder, useUpdateOrder } from '../hooks/useOrders';
import { formatNaira, generateToken } from '../lib/utils';
import { sendWhatsAppMessage, generateOrderStatusMessage } from '../lib/whatsapp';
import AuthHeader from '../components/AuthHeader';
import DynamicOrderForm from '../components/DynamicOrderForm';
import {
  Container, Paper, Title, Text, Button, Group, Stack, SimpleGrid, Card, Badge, Modal,
  TextInput, Textarea, NumberInput, ThemeIcon, Alert, Loader,
  Center, Tabs, RingProgress, Divider, rem, Box, Select, Switch, ScrollArea,
  Table,
  ActionIcon,
  Tooltip,
  Grid
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconPlus, IconArrowRight, IconBell, IconTrendingUp, IconAlertCircle, IconCheck, IconPackage,
  IconTruckDelivery, IconMapPin, IconUser, IconPhone, IconCurrencyNaira, IconClipboardList, IconSearch,
  IconEdit, IconTrash, IconEye,
  IconDotsVertical
} from '@tabler/icons-react';
import TestModeBanner from '../components/TestModeBanner';
import type { FormField } from '../types';

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
  onView: (order: Order) => void;
  isLoading: boolean;
  isMobile?: boolean; // Added isMobile prop
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onNextStage, onEdit, onDelete, onView, isLoading, isMobile }) => {
  const nextStatusIndex = STATUS_SEQUENCE.indexOf(order.status as Order['status']) + 1;
  const nextStatus = nextStatusIndex < STATUS_SEQUENCE.length ? STATUS_SEQUENCE[nextStatusIndex] : null;
  const config = statusConfig[order.status as Order['status']];
  const StatusIcon = config.icon;

  return (
    <Card withBorder padding="lg" radius="md" shadow="sm" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Badge color={config.color} variant="filled" size="sm" radius="sm">
          {order.status}
        </Badge>
        <Group gap={4} wrap="nowrap">
          <Tooltip label="View Details">
            <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => onView(order)}>
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          {/* Only show edit if NOT completed */}
          {order.status !== 'COMPLETED' && (
            <Tooltip label="Edit">
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => onEdit(order)}>
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Delete">
            <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onDelete(order.id)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Group justify="space-between" mb="sm">
        <Text size="xs" c="dimmed" ff="monospace" fw={700}>#{order.readable_id}</Text>
      </Group>

      <Group wrap="nowrap" align="flex-start" mb="md">
        <ThemeIcon color={config.color} variant="light" size={isMobile ? "lg" : "xl"} radius="md">
          <StatusIcon size={isMobile ? 20 : 24} />
        </ThemeIcon>
        <Box style={{ flex: 1, minWidth: 0 }}> {/* minWidth 0 prevents flex child from overflowing */}
          <Text fw={700} size="md" lineClamp={1}>{order.customer_name}</Text>
          <Text size="xs" c="dimmed">{order.customer_phone}</Text>
        </Box>
      </Group>

      <Divider variant="dashed" mb="sm" />

      <Stack gap="xs" mb="lg" style={{ flexGrow: 1 }}> {/* flexGrow makes this take available space, pushing buttons down */}
        <Group justify="space-between">
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">Amount</Text>
          <Text fw={800} c="blue" size="lg">{formatNaira(order.price_total)}</Text>
        </Group>

        {order.delivery_address && (
          <Group gap={4} align="flex-start" wrap="nowrap">
            <IconMapPin size={14} style={{ marginTop: rem(2), flexShrink: 0 }} />
            <Text size="xs" c="dimmed" lineClamp={2} style={{ wordBreak: 'break-word' }}>{order.delivery_address}</Text>
          </Group>
        )}
      </Stack>

      <Stack gap="xs" mt="auto"> {/* mt="auto" pushes buttons to bottom */}
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

        <Button fullWidth variant="default" size="xs" radius="md" onClick={() => onView(order)}>
          View Full Details
        </Button>
      </Stack>
    </Card>
  );
};

const SmeDashboard: React.FC = () => {
  const { user } = useAuth();
  const smeId = user?.id || '';
  const { orders, isLoading: isOrdersLoading, refreshOrders, updateLocalOrder, insertLocalOrder, removeLocalOrder } = useOrders(smeId);
  const { deleteOrder } = useDeleteOrder();
  const { updateOrder } = useUpdateOrder();
  const isMobile = useMediaQuery('(max-width: 48em)'); // Mantine sm breakpoint is 48em (768px)

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

  // View Details Modal State
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Form Config State
  const [formFields, setFormFields] = useState<FormField[]>([]);
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
          setFormFields(activeForm.fields);
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

    // Data is already structured by DynamicOrderForm, just need to add system fields
    const { data, error } = await supabase.from('orders').insert([{
      sme_id: smeId,
      readable_id: readableId,
      status: 'NEW',
      ...submissionData
    }])
      .select()
      .single();

    if (error) {
      console.error('Create Order Error:', error);
      alert('Failed to create order: ' + error.message);
      setIsCreating(false);
      return;
    }

    // SUCCESS! Close modal immediately for better UX
    setIsOrderModalOpen(false);
    setIsCreating(false);

    // OPTIMISTIC UPDATE: Add new order to list immediately
    if (data) {
      insertLocalOrder(data as Order);
    } else {
      refreshOrders(); // Fallback if no data returned
    }

    // Background Process: Send WhatsApp Notification
    // We don't await this to block the UI, but we catch errors to show a toast if needed
    sendWhatsAppMessage({
      phone: submissionData.customer_phone,
      message: generateOrderStatusMessage('NEW', readableId),
      orderId: readableId
    }).then((waResult) => {
      if (!waResult.success) {
        setWhatsappError(`Order created but WhatsApp failed: ${waResult.error}`);
      }
    });
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

  const handleViewOrder = (order: Order) => {
    setViewingOrder(order);
    setIsViewModalOpen(true);
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


  // --- Helpers for View Modal ---
  const formatValue = (val: any) => {
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (!val) return '-';
    return String(val);
  };

  const getFieldLabel = (key: string) => {
    const field = formFields.find(f => f.field_key === key);
    return field ? field.label : key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (isOrdersLoading) return <Container><Center mih="100vh"><Loader size="xl" variant="bars" /></Center></Container>;

  return (
    <Container size="xl" py={isMobile ? "md" : "xl"} px={isMobile ? "xs" : "md"}>
      <AuthHeader title="WOT Dashboard" />
      <TestModeBanner />
      {/* Modern Stats Grid */}
      <SimpleGrid cols={{ base: 2, sm: 2, lg: 4 }} spacing={isMobile ? "sm" : "lg"} mb="xl">
        <Paper withBorder p={isMobile ? "xs" : "md"} radius="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase" lineClamp={1}>Orders</Text>
              <Text fw={900} size={isMobile ? "lg" : "xl"}>{orders.length}</Text>
            </Stack>
            <RingProgress size={isMobile ? 40 : 60} thickness={isMobile ? 4 : 6} sections={[{ value: 100, color: 'blue' }]} label={<Center><IconPackage size={isMobile ? 12 : 16} /></Center>} />
          </Group>
        </Paper>

        <Paper withBorder p={isMobile ? "xs" : "md"} radius="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase" lineClamp={1}>Delivered</Text>
              <Text fw={900} size={isMobile ? "lg" : "xl"} c="teal">{completedOrders}</Text>
            </Stack>
            <ThemeIcon size={isMobile ? "md" : "xl"} radius="md" color="teal" variant="light"><IconCheck size={isMobile ? 16 : 24} /></ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder p={isMobile ? "xs" : "md"} radius="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase" lineClamp={1}>Total Revenue</Text>
              <Text fw={900} size={isMobile ? "lg" : "xl"} c="green">{formatNaira(totalRevenue)}</Text>
            </Stack>
            <ThemeIcon size={isMobile ? "md" : "xl"} radius="md" color="green" variant="light"><IconTrendingUp size={isMobile ? 16 : 24} /></ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder p={isMobile ? "xs" : "md"} radius="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase" lineClamp={1}>Unrealized</Text>
              <Text fw={900} size={isMobile ? "lg" : "xl"} c="blue">{formatNaira(unrealizedRevenue)}</Text>
            </Stack>
            <ThemeIcon size={isMobile ? "md" : "xl"} radius="md" color="blue" variant="light"><IconCurrencyNaira size={isMobile ? 16 : 24} /></ThemeIcon>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Alerts */}
      {whatsappError && <Alert icon={<IconBell />} title="WhatsApp Update" color="yellow" variant="light" mb="lg" withCloseButton onClose={() => setWhatsappError(null)}>{whatsappError}</Alert>}

      {/* Header Section with Responsive Layout */}
      {isMobile ? (
        <Stack gap="sm" mb="md">
          <Group justify="space-between">
            <Title order={4}>Orders</Title>
            <Button size="xs" leftSection={<IconPlus size={16} />} onClick={() => setIsOrderModalOpen(true)}>
              New
            </Button>
          </Group>
          <TextInput
            placeholder="Search orders..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
          />
        </Stack>
      ) : (
        <Group justify="space-between" mb="xl">
          <Title order={3}>Orders</Title>
          <Group gap="sm">
            <Button size="sm" leftSection={<IconPlus size={18} />} onClick={() => setIsOrderModalOpen(true)}>
              New Order
            </Button>
            <TextInput
              placeholder="Search orders, customers..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{ width: 320 }}
            />
          </Group>
        </Group>
      )}


      {/* Interactive Tabs */}
      <Tabs variant="pills" defaultValue="NEW" radius="md" mb="xl">
        <Paper p="xs" radius="lg" bg="gray.1" mb="lg">
          <ScrollArea type="never">
            <Tabs.List grow={!isMobile} style={{ flexWrap: 'nowrap', gap: '0.5rem', border: 'none' }}>
              {STATUS_SEQUENCE.map((status) => {
                const Config = statusConfig[status];
                return (
                  <Tabs.Tab
                    key={status}
                    value={status}
                    leftSection={<Config.icon size={18} />}
                    style={{
                      fontWeight: 600,
                      border: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    px="md"
                    py="sm"
                  >
                    <Group gap={8} wrap="nowrap">
                      <Text size="sm">{status}</Text>
                      <Badge size="xs" circle variant="light" color={Config.color} style={{ fontSize: '0.7em', height: '18px', minWidth: '18px' }}>{ordersByStatus[status]?.length || 0}</Badge>
                    </Group>
                  </Tabs.Tab>
                )
              })}
            </Tabs.List>
          </ScrollArea>
        </Paper>

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
                    onView={handleViewOrder}
                    isLoading={isOrdersLoading}
                    isMobile={isMobile}
                  />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        ))}
      </Tabs>

      {!isMobile && (
        <Center mb={50}>
          <Button size="xl" radius="xl" leftSection={<IconPlus />} onClick={() => setIsOrderModalOpen(true)}>
            Create New Order
          </Button>
        </Center>
      )}

      {/* Create Order Modal */}
      <Modal
        opened={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title={<Text fw={900}>New Delivery Request</Text>}
        centered
        radius="lg"
        size={isMobile ? "100%" : "lg"}
        fullScreen={isMobile}
      >
        <ScrollArea.Autosize mah={isMobile ? "calc(100vh - 60px)" : "calc(100vh - 200px)"} type="scroll">
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
                <DynamicOrderForm
                  fields={formFields}
                  onSubmit={handleCreateOrder}
                  isLoading={isCreating}
                />
              </>
            )}
          </Box>
        </ScrollArea.Autosize>
      </Modal>

      <Modal opened={isRiderModalOpen} onClose={() => setIsRiderModalOpen(false)} title={<Text fw={900}>Dispatch Assignment</Text>} centered radius="lg" size={isMobile ? "100%" : undefined}>
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
        size={isMobile ? "100%" : "lg"}
        fullScreen={isMobile}
      >
        <ScrollArea.Autosize mah={isMobile ? "calc(100vh - 60px)" : "calc(100vh - 200px)"} type="scroll">
          <Box p="md">
            <DynamicOrderForm
              fields={formFields}
              onSubmit={handleUpdateOrder}
              isLoading={isEditing}
              initialValues={editingOrder}
            />
          </Box>
        </ScrollArea.Autosize>
      </Modal>

      {/* View Full Details Modal */}
      <Modal
        opened={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setViewingOrder(null); }}
        title={<Text fw={900} size="lg">Order Details #{viewingOrder?.readable_id}</Text>}
        centered
        radius="lg"
        size={isMobile ? "100%" : "lg"}
        fullScreen={isMobile}
      >
        {viewingOrder && (
          <ScrollArea.Autosize mah={isMobile ? "calc(100vh - 60px)" : "calc(100vh - 200px)"} type="scroll">
            <Stack gap="lg" p="sm">
              <Paper withBorder p="md" radius="md">
                <Divider label="Core Information" labelPosition="left" mb="sm" />
                <SimpleGrid cols={isMobile ? 1 : 2} spacing="xs" verticalSpacing="xs">
                  <Text c="dimmed" size="sm">Customer:</Text>
                  <Text fw={500} size="sm">{viewingOrder.customer_name}</Text>

                  <Text c="dimmed" size="sm">Phone:</Text>
                  <Text fw={500} size="sm">{viewingOrder.customer_phone}</Text>

                  <Text c="dimmed" size="sm">Address:</Text>
                  <Text fw={500} size="sm">{viewingOrder.delivery_address}</Text>

                  <Text c="dimmed" size="sm">Price:</Text>
                  <Text fw={500} size="sm" c="blue">{formatNaira(viewingOrder.price_total)}</Text>

                  <Text c="dimmed" size="sm">Status:</Text>
                  <Badge color={statusConfig[viewingOrder.status].color}>{viewingOrder.status}</Badge>
                </SimpleGrid>
              </Paper>

              {/* Dynamic Fields Section */}
              {viewingOrder.form_data && Object.keys(viewingOrder.form_data).length > 0 && (
                <Paper withBorder p="md" radius="md">
                  <Divider label="Additional Details" labelPosition="left" mb="sm" />
                  <Stack gap="xs">
                    {Object.entries(viewingOrder.form_data).map(([key, value]) => (
                      <Group key={key} justify="space-between" align="flex-start">
                        <Text c="dimmed" size="sm" style={{ flex: 1 }}>{getFieldLabel(key)}</Text>
                        <Text fw={500} size="sm" style={{ flex: 1, textAlign: 'right' }}>{formatValue(value)}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Paper>
              )}

              <Group justify="flex-end" mt="md">
                {viewingOrder.status !== 'COMPLETED' && (
                  <Button variant="light" leftSection={<IconEdit size={16} />} onClick={() => {
                    setIsViewModalOpen(false);
                    handleEditOrder(viewingOrder);
                  }}>
                    Edit Order
                  </Button>
                )}
                <Button variant="default" onClick={() => setIsViewModalOpen(false)}>Close</Button>
              </Group>
            </Stack>
          </ScrollArea.Autosize>
        )}
      </Modal>
    </Container>
  );
};

export default SmeDashboard;