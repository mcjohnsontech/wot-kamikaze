import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import type { Order } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useOrders } from '../hooks/useOrders';
import { formatNaira, generateToken } from '../lib/utils';
import { sendWhatsAppMessage, generateOrderStatusMessage } from '../lib/whatsapp';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Card,
  Badge,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Grid,
  RingProgress,
  ThemeIcon,
  ActionIcon,
  Menu,
  Alert,
  Loader,
  Center,
  Tabs,
  Tooltip,
  Progress,
} from '@mantine/core';
import {
  IconPlus,
  IconArrowRight,
  IconLogout,
  IconHelp,
  IconFileUpload,
  IconMessageCircle,
  IconBell,
  IconTrendingUp,
  IconDots,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';

const STATUS_SEQUENCE: Order['status'][] = ['NEW', 'PROCESSING', 'READY', 'DISPATCHED', 'COMPLETED'];

const statusConfig: Record<Order['status'], { icon: string; color: string; nextLabel: string }> = {
  NEW: { icon: '📋', color: 'orange', nextLabel: 'Start Processing' },
  PROCESSING: { icon: '⚙️', color: 'blue', nextLabel: 'Mark Ready' },
  READY: { icon: '📦', color: 'purple', nextLabel: 'Assign Rider' },
  DISPATCHED: { icon: '🚀', color: 'green', nextLabel: 'Mark Complete' },
  COMPLETED: { icon: '✅', color: 'teal', nextLabel: 'Completed' },
  CANCELLED: { icon: '❌', color: 'gray', nextLabel: 'Cancelled' },
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
    <Card withBorder padding="lg" radius="md" shadow="sm" hover={{ shadow: 'md' }}>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Text size="xl">{config.icon}</Text>
          <div>
            <Text fw={600} size="sm">
              Order #{order.readable_id}
            </Text>
            <Text size="xs" c="dimmed">
              {order.customer_name}
            </Text>
          </div>
        </Group>
        <Badge color={config.color} variant="light">
          {order.status}
        </Badge>
      </Group>

      <Stack gap="xs" mb="md">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Amount
          </Text>
          <Text fw={600} c="teal">
            {formatNaira(order.price_total)}
          </Text>
        </Group>
        {order.rider_phone && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Rider
            </Text>
            <Text size="xs">{order.rider_phone}</Text>
          </Group>
        )}
        {order.delivery_address && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            📍 {order.delivery_address}
          </Text>
        )}
      </Stack>

      {nextStatus && order.status !== 'COMPLETED' && (
        <Button
          fullWidth
          variant="light"
          rightSection={<IconArrowRight size={16} />}
          onClick={() => onNextStage(order.id)}
          loading={isLoading}
          size="sm"
        >
          {config.nextLabel}
        </Button>
      )}

      {order.status === 'COMPLETED' && (
        <Button fullWidth disabled size="sm" variant="subtle" color="green">
          ✓ Delivered
        </Button>
      )}
    </Card>
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
        const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId);

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

    const order = orders.find((o) => o.id === selectedOrderId);
    if (!order) return;

    setIsAssigning(true);
    try {
      const riderToken = generateToken();
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
      setWhatsappError(`Order created but WhatsApp notification failed: ${result.error}`);
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
        (result.success ? ' Customer notified via WhatsApp.' : ' (Manual WhatsApp notification may be needed)')
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

  if (isLoading) {
    return (
      <Container>
        <Center minH="100vh">
          <Loader />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>WOT Delivery Dashboard</Title>
          <Text c="dimmed" mt="xs">
            Welcome back, {user?.name || 'SME User'}
          </Text>
        </div>
        <Group>
          <Tooltip label="Manage Forms">
            <ActionIcon component={Link} to="/forms" variant="light" size="lg">
              <IconFileUpload size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="CSV Import">
            <ActionIcon component={Link} to="/csv-import" variant="light" size="lg">
              <IconFileUpload size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="WhatsApp Config">
            <ActionIcon component={Link} to="/whatsapp" variant="light" size="lg">
              <IconMessageCircle size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Help">
            <ActionIcon component={Link} to="/help" variant="light" size="lg">
              <IconHelp size={18} />
            </ActionIcon>
          </Tooltip>
          <Menu shadow="md">
            <Menu.Target>
              <ActionIcon variant="light" size="lg">
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={logout} leftSection={<IconLogout size={14} />}>
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 1, md: 3 }} mb="xl" spacing="lg">
        <Card withBorder padding="lg">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700}>
                Total Orders
              </Text>
              <Text fw={700} size="xl">
                {totalOrders}
              </Text>
            </div>
            <RingProgress
              sections={[{ value: totalOrders, color: 'blue' }]}
              label={<Text size="xs">{totalOrders}</Text>}
              size={80}
              thickness={4}
            />
          </Group>
        </Card>

        <Card withBorder padding="lg">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700}>
                Completed
              </Text>
              <Text fw={700} size="xl" c="teal">
                {completedOrders}
              </Text>
            </div>
            <ThemeIcon color="teal" variant="light" size="xl" radius="md">
              <IconCheck size={24} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card withBorder padding="lg">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700}>
                Total Revenue
              </Text>
              <Text fw={700} size="xl" c="green">
                {formatNaira(totalRevenue)}
              </Text>
            </div>
            <ThemeIcon color="green" variant="light" size="xl" radius="md">
              <IconTrendingUp size={24} />
            </ThemeIcon>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Alerts */}
      {error && (
        <Alert icon={<IconAlertCircle />} title="Error" color="red" mb="lg">
          {error}
        </Alert>
      )}
      {whatsappError && (
        <Alert icon={<IconBell />} title="WhatsApp Notification" color="yellow" mb="lg">
          {whatsappError}
        </Alert>
      )}

      {/* Orders by Status */}
      <Tabs defaultValue="NEW" mb="xl">
        <Tabs.List>
          {STATUS_SEQUENCE.map((status) => (
            <Tabs.Tab
              key={status}
              value={status}
              leftSection={statusConfig[status as Order['status']].icon}
              badge={ordersByStatus[status as Order['status']]?.length || 0}
            >
              {status}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {STATUS_SEQUENCE.map((status) => (
          <Tabs.Panel key={status} value={status} pt="lg">
            {ordersByStatus[status as Order['status']]?.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No orders in this status
              </Text>
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                {ordersByStatus[status as Order['status']]?.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onNextStage={handleNextStage}
                    isLoading={isLoading}
                  />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        ))}
      </Tabs>

      {/* Create Order Button */}
      <Group justify="center" mb="xl">
        <Button
          leftSection={<IconPlus size={18} />}
          size="lg"
          onClick={() => setIsOrderModalOpen(true)}
          color="blue"
        >
          Create New Order
        </Button>
      </Group>

      {/* Create Order Modal */}
      <Modal opened={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Create New Order">
        <Stack gap="lg">
          <TextInput
            label="Customer Name"
            placeholder="John Doe"
            value={newOrderData.customer_name}
            onChange={(e) => setNewOrderData({ ...newOrderData, customer_name: e.currentTarget.value })}
          />
          <TextInput
            label="Phone Number"
            placeholder="+234701234567"
            value={newOrderData.customer_phone}
            onChange={(e) => setNewOrderData({ ...newOrderData, customer_phone: e.currentTarget.value })}
          />
          <Textarea
            label="Delivery Address"
            placeholder="123 Main Street, Lagos"
            value={newOrderData.delivery_address}
            onChange={(e) => setNewOrderData({ ...newOrderData, delivery_address: e.currentTarget.value })}
          />
          <NumberInput
            label="Amount (₦)"
            placeholder="5000"
            value={newOrderData.price_total}
            onChange={(val) => setNewOrderData({ ...newOrderData, price_total: val || 0 })}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setIsOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrder} loading={isCreating}>
              Create Order
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Rider Assignment Modal */}
      <Modal opened={isRiderModalOpen} onClose={() => setIsRiderModalOpen(false)} title="Assign Rider">
        <Stack gap="lg">
          <Text c="dimmed" size="sm">
            Order #
            {orders.find((o) => o.id === selectedOrderId)?.readable_id}
          </Text>
          <TextInput
            label="Rider Phone Number"
            placeholder="+2347..."
            value={riderPhone}
            onChange={(e) => setRiderPhone(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setIsRiderModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRiderAssignment} loading={isAssigning}>
              Assign Rider
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default SmeDashboard;
