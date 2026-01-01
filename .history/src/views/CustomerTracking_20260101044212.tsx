import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useOrderByToken, useOrderSubscription } from '../hooks/useOrders';
import { calculateDistance, calculateETA } from '../lib/utils';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Loader,
  Center,
  Alert,
  SimpleGrid,
  ThemeIcon,
  Box,
  rem,
  Divider,
  Button,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconMapPin,
  IconClock,
  IconTruckDelivery,
  IconInfoCircle,
  IconRoute,
  IconArrowLeft,
  IconPackage,
} from '@tabler/icons-react';

// Custom icons for Leaflet
const riderIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2913/2913095.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const CustomerTracking: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error } = useOrderByToken(token);
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);

  // Approximate coordinates for destination (In prod: use geocoding)
  const getCoordinatesFromAddress = (_address: string) => {
    return { lat: 6.5244, lng: 3.3792 };
  };

  const handleOrderUpdate = useCallback((updatedOrder: any) => {
    if (updatedOrder.rider_lat && updatedOrder.rider_lng) {
      setRiderPos({ lat: updatedOrder.rider_lat, lng: updatedOrder.rider_lng });
      const destCoords = getCoordinatesFromAddress(updatedOrder.delivery_address);
      const dist = calculateDistance(updatedOrder.rider_lat, updatedOrder.rider_lng, destCoords.lat, destCoords.lng);
      setDistance(dist);
      setEta(calculateETA(dist));
    }
  }, []);

  useOrderSubscription(order?.id || '', handleOrderUpdate);

  useEffect(() => {
    if (order && order.rider_lat && order.rider_lng) {
      setRiderPos({ lat: order.rider_lat, lng: order.rider_lng });
      const destCoords = getCoordinatesFromAddress(order.delivery_address);
      const dist = calculateDistance(order.rider_lat, order.rider_lng, destCoords.lat, destCoords.lng);
      setDistance(dist);
      setEta(calculateETA(dist));
    }
  }, [order]);

  if (isLoading) {
    return (
      <Center mih="100vh" bg="gray.0">
        <Stack align="center" gap="md">
          <Loader size="xl" variant="bars" color="blue" />
          <Text fw={600} c="dimmed">Locating your order...</Text>
        </Stack>
      </Center>
    );
  }

  if (error || !order) {
    return (
      <Center mih="100vh" p="md" bg="gray.0">
        <Paper p="xl" radius="lg" withBorder shadow="md" maw={400} ta="center">
          <ThemeIcon size={60} radius="xl" color="red" variant="light" mb="md">
            <IconAlertCircle size={34} />
          </ThemeIcon>
          <Title order={3} mb="xs">Link Invalid</Title>
          <Text c="dimmed" size="sm" mb="xl">The tracking link has expired or is incorrect. Please contact the merchant.</Text>
          <Button fullWidth color="red" radius="md" onClick={() => navigate('/')} leftSection={<IconArrowLeft size={16}/>}>
            Go Back
          </Button>
        </Paper>
      </Center>
    );
  }

  const destCoords = getCoordinatesFromAddress(order.delivery_address);
  const centerPos: [number, number] = riderPos ? [riderPos.lat, riderPos.lng] : [destCoords.lat, destCoords.lng];

  return (
    <Box bg="gray.0" mih="100vh" pb={rem(60)}>
      {/* Sticky Header */}
      <Paper shadow="xs" p="md" radius={0} pos="sticky" top={0} style={{ zIndex: 1000 }} withBorder>
        <Container size="sm">
          <Group justify="space-between">
            <Stack gap={0}>
              <Group gap="xs">
                <IconPackage size={20} color="var(--mantine-color-blue-6)" />
                <Title order={4}>Order #{order.readable_id}</Title>
              </Group>
              <Text size="xs" c="dimmed" fw={700}>
                {order.status === 'DISPATCHED' ? '🚚 RIDER IS EN ROUTE' : `STATUS: ${order.status}`}
              </Text>
            </Stack>
            <Badge size="lg" radius="sm" variant="light" color={order.status === 'DISPATCHED' ? 'green' : 'blue'}>
              {order.status}
            </Badge>
          </Group>
        </Container>
      </Paper>

      <Container size="sm" py="xl">
        <Stack gap="lg">
          {/* Map Container */}
          <Paper withBorder radius="lg" shadow="sm" style={{ overflow: 'hidden', height: rem(350), position: 'relative' }}>
            {riderPos ? (
              <MapContainer center={centerPos} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[riderPos.lat, riderPos.lng]} icon={riderIcon}>
                  <Popup>Your rider is here</Popup>
                </Marker>
                <Marker position={[destCoords.lat, destCoords.lng]} icon={destinationIcon}>
                  <Popup>Destination</Popup>
                </Marker>
                <Circle center={[riderPos.lat, riderPos.lng]} radius={100} color="blue" weight={1} fillOpacity={0.1} />
              </MapContainer>
            ) : (
              <Center mih="100%" bg="gray.1">
                <Stack align="center" gap="xs">
                  <Loader size="sm" />
                  <Text size="sm" c="dimmed" fw={500}>Connecting to rider's GPS...</Text>
                </Stack>
              </Center>
            )}
          </Paper>

          {/* ETA Hero Card */}
          <Paper
            radius="lg"
            p="xl"
            shadow="md"
            style={{
              background: 'linear-gradient(135deg, var(--mantine-color-orange-5) 0%, var(--mantine-color-orange-7) 100%)',
              color: 'white',
            }}
          >
            <Group justify="space-between" align="center">
              <Stack gap={0}>
                <Text size="xs" fw={800} tt="uppercase" opacity={0.8} lts={1}>Estimated Arrival</Text>
                <Title order={1} size={rem(48)} fw={900}>
                  {eta > 0 ? `${eta} min` : '--'}
                </Title>
              </Stack>
              <ThemeIcon size={80} radius="xl" color="rgba(255,255,255,0.2)">
                <IconClock size={48} />
              </ThemeIcon>
            </Group>
            <Divider color="rgba(255,255,255,0.2)" my="md" />
            <Text size="sm" fw={500} opacity={0.9}>
              {riderPos ? 'Live tracking is active.' : 'Rider has not started broadcasting yet.'}
            </Text>
          </Paper>

          {/* Details Grid */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Paper withBorder p="md" radius="md" bg="white">
              <Group gap="xs" mb="xs">
                <ThemeIcon variant="light" color="blue" size="sm"><IconMapPin size={14}/></ThemeIcon>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">Delivery Address</Text>
              </Group>
              <Text size="sm" fw={600} lineClamp={2}>{order.delivery_address}</Text>
            </Paper>

            <Paper withBorder p="md" radius="md" bg="white">
              <Group gap="xs" mb="xs">
                <ThemeIcon variant="light" color="green" size="sm"><IconRoute size={14}/></ThemeIcon>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">Distance</Text>
              </Group>
              <Text size="sm" fw={600}>
                {distance > 0 ? `${distance.toFixed(2)} km away` : 'Calculating...'}
              </Text>
            </Paper>
          </SimpleGrid>

          {/* Info Alert */}
          <Alert variant="light" color="blue" radius="md" icon={<IconInfoCircle size={18} />}>
            <Text size="xs" fw={500}>
              Please ensure your phone is reachable. Your rider will call you upon arrival or to confirm the delivery location.
            </Text>
          </Alert>
        </Stack>
      </Container>
    </Box>
  );
};

export default CustomerTracking;