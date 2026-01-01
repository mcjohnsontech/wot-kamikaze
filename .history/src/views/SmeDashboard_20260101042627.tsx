import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import type { Order } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useOrders } from '../hooks/useOrders';
import { formatNaira, generateToken } from '../lib/utils';
import { sendWhatsAppMessage, generateOrderStatusMessage } from '../lib/whatsapp';
import FormRenderer from '../components/FormRenderer';
import {
  Container, Paper, Title, Text, Button, Group, Stack, SimpleGrid, Card, Badge, Modal,
  TextInput, Textarea, NumberInput, ThemeIcon, ActionIcon, Menu, Alert, Loader,
  Center, Tabs, Tooltip, RingProgress, Divider, rem, Box, Avatar
} from '@mantine/core';
import {
  IconPlus, IconArrowRight, IconLogout, IconHelp, IconFileUpload, IconMessageCircle,
  IconBell, IconTrendingUp, IconDots, IconAlertCircle, IconCheck, IconPackage,
  IconTruckDelivery, IconMapPin, IconUser, IconPhone, IconCurrencyNaira, IconClipboardList
} from '@tabler/icons-react';

const STATUS_SEQUENCE: Order['status'][] = ['NEW', 'PROCESSING', 'READY', 'DISPATCHED', 'COMPLETED'];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const statusConfig: Record<Order['status'], { icon: any; color: string; nextLabel: string }> = {
  NEW: { icon: IconClipboardList, color: 'orange', nextLabel: 'Start Processing' },
  PROCESSING: { icon: IconPackage, color: 'blue', nextLabel: 'Mark Ready' },
  READY: { icon: IconTruckDelivery, color: 'grape', nextLabel: 'Assign Rider' },
  DISPATCHED: { icon: IconBell, color: 'green', nextLabel: 'Mark Complete' },
  COMPLETED: { icon: IconCheck, color: 'teal', nextLabel: 'Completed' },
  CANCELLED: { icon: IconAlertCircle, color: 'gray', nextLabel: 'Cancelled' },
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
  const StatusIcon = config.icon;

  return (
    <Card withBorder padding="lg" radius="md" shadow="sm" style={{ transition: 'transform 0.2s ease' }}>
      <Group justify="space-between" mb="xs">
        <Badge color={config.color} variant="filled" size="sm" radius="sm">
          {order.status}
        </Badge>
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
          <Text fw={800} c="teal" size="lg">{formatNaira(order.price_total)}</Text>
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
        <Button fullWidth disabled variant="light" color="teal" radius="md" leftSection={<IconCheck size={16}/>}>
          Delivered
        </Button>
      )}
    </Card>
  );
};

const SmeDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const smeId = user?.id || '';
  const { orders, isLoading, error } = useOrders(smeId);

  // Modals and States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [riderPhone, setRiderPhone] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<any | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [newOrderData, setNewOrderData] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    price_total: 0,
  });

  // --- Logic Handlers (Same as original) ---
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
      const messageText = generateOrderStatusMessage(nextStatus, order.readable_id);
      await sendWhatsAppMessage({ phone: order.customer_phone, message: messageText, orderId: order.id });
    }
  }, [orders]);

  const handleRiderAssignment = async () => {
    if (!selectedOrderId || !riderPhone) return;
    const order = orders.find((o) => o.id === selectedOrderId);
    if (!order) return;
    setIsAssigning(true);
    try {
      const riderToken = generateToken();
      const { error } = await supabase.from('orders').update({ rider_phone: riderPhone, rider_token: riderToken, status: 'READY' }).eq('id', selectedOrderId);
      if (error) { alert('Failed to assign rider'); return; }
      const trackingUrl = `${window.location.origin}/track/${riderToken}`;
      const messageText = `Great news! Your order #${order.readable_id} is ready and will be dispatched soon. 📦\n\nTrack your delivery here: ${trackingUrl}`;
      await sendWhatsAppMessage({ phone: order.customer_phone, message: messageText, orderId: order.id });
      setIsRiderModalOpen(false);
      setRiderPhone('');
      setSelectedOrderId(null);
    } finally { setIsAssigning(false); }
  };

  const handleCreateOrder = async () => {
    setIsCreating(true);
    const readableId = `WOT${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from('orders').insert([{ sme_id: smeId, readable_id: readableId, status: 'NEW', ...newOrderData }]);
    setIsCreating(false);
    if (error) { alert('Failed to create order'); return; }
    await sendWhatsAppMessage({ phone: newOrderData.customer_phone, message: generateOrderStatusMessage('NEW', readableId), orderId: readableId });
    setIsOrderModalOpen(false);
    setNewOrderData({ customer_name: '', customer_phone: '', delivery_address: '', price_total: 0 });
  };

  useEffect(() => {
    const fetchForms = async () => {
      if (!user?.id) return;
      setIsFormLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/forms`, { headers: { 'x-sme-id': user.id } });
        const json = await res.json();
        const schemas = json.schemas || json.data || [];
        if (!schemas.length) return;
        const active = schemas.find((s: any) => s.is_active) || schemas[0];
        const detailsRes = await fetch(`${API_BASE_URL}/forms/${active.id}`, { headers: { 'x-sme-id': user.id } });
        const detailsJson = await detailsRes.json();
        if (detailsJson.success && detailsJson.schema) setActiveForm(detailsJson.schema);
      } catch (err) { console.error(err); } finally { setIsFormLoading(false); }
    };
    fetchForms();
  }, [user?.id]);

  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = acc[order.status] || [];
    acc[order.status].push(order);
    return acc;
  }, {} as Record<Order['status'], Order[]>);

  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.price_total, 0);

  if (isLoading) return <Container><Center mih="100vh"><Loader size="xl" variant="bars" /></Center></Container>;

  return (
    <Container size="xl" py="xl">
      {/* Enhanced Header Section */}
      <Paper withBorder p="md" radius="lg" shadow="xs" mb="xl">
        <Group justify="space-between">
          <Group gap="md">
            <Avatar color="blue" radius="xl" size="lg">{user?.name?.slice(0, 2).toUpperCase() || 'SM'}</Avatar>
            <div>
              <Title order={2} size="h3">WOT Dashboard</Title>
              <Text c="dimmed" size="xs">Merchant: {user?.name || 'SME'}</Text>
            </div>
          </Group>

          <Group gap="xs">
            <Tooltip label="Manage Forms"><ActionIcon component={Link} to="/forms" variant="light" size="lg"><IconClipboardList size={20} /></ActionIcon></Tooltip>
            <Tooltip label="WhatsApp Settings"><ActionIcon component={Link} to="/whatsapp" variant="light" size="lg" color="green"><IconMessageCircle size={20} /></ActionIcon></Tooltip>
            <Tooltip label="Import Data"><ActionIcon component={Link} to="/csv-import" variant="light" size="lg"><IconFileUpload size={20} /></ActionIcon></Tooltip>
            
            <Divider orientation="vertical" />
            
            <Menu shadow="md" position="bottom-end">
              <Menu.Target><ActionIcon variant="outline" size="lg" color="gray"><IconDots size={20} /></ActionIcon></Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Account</Menu.Label>
                <Menu.Item leftSection={<IconHelp size={14}/>}  Support</Menu.Item>
                <Menu.Item color="red" onClick={logout} leftSection={<IconLogout size={14} />}>Logout</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Paper>

      {/* Modern Stats Grid */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={0}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Orders</Text>
              <Text fw={900} size="xl">{orders.length}</Text>
            </Stack>
            <RingProgress size={60} thickness={6} sections={[{ value: 100, color: 'blue' }]} label={<Center><IconPackage size={16}/></Center>} />
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
      </SimpleGrid>

      {/* Alerts */}
      {whatsappError && <Alert icon={<IconBell />} title="WhatsApp Update" color="yellow" variant="light" mb="lg" withCloseButton onClose={() => setWhatsappError(null)}>{whatsappError}</Alert>}

      {/* Interactive Tabs */}
      <Tabs variant="pills" defaultValue="NEW" mb="xl" radius="md">
        <Tabs.List grow>
          {STATUS_SEQUENCE.map((status) => {
             const Config = statusConfig[status];
             return (
              <Tabs.Tab key={status} value={status} leftSection={<Config.icon size={14}/>}>
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
                {ordersByStatus[status].map((order) => <OrderCard key={order.id} order={order} onNextStage={handleNextStage} isLoading={isLoading} />)}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        ))}
      </Tabs>

      <Center mb={50}>
        <Button size="xl" radius="xl" leftSection={<IconPlus />} onClick={() => setIsOrderModalOpen(true)} shadow="md">
          Create New Order
        </Button>
      </Center>

      {/* Polish Modal Design */}
      <Modal opened={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title={<Text fw={900}>New Delivery Request</Text>} centered radius="lg" size="lg">
        {activeForm ? (
          <Box p="md"><FormRenderer schema={activeForm} isLoading={isCreating} onSubmit={handleCreateOrder} /></Box>
        ) : (
          <Stack gap="md" p="md">
            <TextInput label="Customer Name" leftSection={<IconUser size={16}/>} placeholder="Full Name" value={newOrderData.customer_name} onChange={(e) => setNewOrderData({ ...newOrderData, customer_name: e.target.value })} />
            <TextInput label="Phone Number" leftSection={<IconPhone size={16}/>} placeholder="+234..." value={newOrderData.customer_phone} onChange={(e) => setNewOrderData({ ...newOrderData, customer_phone: e.target.value })} />
            <Textarea label="Address" leftSection={<IconMapPin size={16}/>} placeholder="Delivery point" value={newOrderData.delivery_address} onChange={(e) => setNewOrderData({ ...newOrderData, delivery_address: e.target.value })} />
            <NumberInput label="Total Amount" leftSection={<IconCurrencyNaira size={16}/>} prefix="₦ " placeholder="0.00" value={newOrderData.price_total} onChange={(val) => setNewOrderData({ ...newOrderData, price_total: Number(val) })} />
            <Button fullWidth size="lg" onClick={handleCreateOrder} loading={isCreating} mt="md" radius="md">Create Order</Button>
          </Stack>
        )}
      </Modal>

      <Modal opened={isRiderModalOpen} onClose={() => setIsRiderModalOpen(false)} title={<Text fw={900}>Dispatch Assignment</Text>} centered radius="lg">
        <Stack gap="md" p="md">
          <Alert color="blue" icon={<IconTruckDelivery size={16}/>}>Assign a rider to start the delivery process for order #{orders.find(o => o.id === selectedOrderId)?.readable_id}</Alert>
          <TextInput label="Rider Contact" placeholder="Rider phone number" value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} />
          <Button fullWidth size="lg" onClick={handleRiderAssignment} loading={isAssigning} radius="md">Confirm Dispatch</Button>
        </Stack>
      </Modal>
    </Container>
  );
};

export default SmeDashboard;