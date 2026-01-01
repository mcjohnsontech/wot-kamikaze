import React from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Paper,
  ThemeIcon,
  Box,
  rem,
  Divider,
  List,
  Overlay,
  useMantineTheme,
  Badge,
} from '@mantine/core';
import {
  IconMessageX,
  IconTruckDelivery,
  IconMapPinCheck,
  IconShieldCheck,
  IconChartBar,
  IconDeviceMobile,
  IconBrandWhatsapp,
  IconArrowRight,
  IconCircleCheck,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const theme = useMantineTheme();

  return (
    <Box bg="white">
      {/* 1. Navbar */}
      <Box 
        component="nav" 
        style={{ 
          height: rem(70), 
          borderBottom: `${rem(1)} solid var(--mantine-color-gray-2)`,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Container size="lg" h="100%">
          <Group justify="space-between" h="100%">
            <Group gap="xs">
              <ThemeIcon variant="filled" color="blue" size="lg" radius="md">
                <IconTruckDelivery size={22} />
              </ThemeIcon>
              <Title order={3} lts={-1} fw={900}>WOT</Title>
            </Group>
            <Group visibleFrom="sm">
              <Button variant="subtle" color="gray">Features</Button>
              <Button variant="subtle" color="gray">Pricing</Button>
              <Button component={Link} to="/auth" variant="filled" radius="md">Login</Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* 2. Hero Section: The Hook */}
      <Box 
        py={rem(100)} 
        style={{ 
          background: `linear-gradient(180deg, var(--mantine-color-blue-0) 0%, white 100%)`,
        }}
      >
        <Container size="lg">
          <Stack align="center" gap="xl" ta="center">
            <Badge size="lg" variant="light" color="blue" py="md">
              The Amazon Experience for Local Brands
            </Badge>
            <Title 
              order={1} 
              style={{ fontSize: rem(56), fontWeight: 900, lineHeight: 1.1 }}
              maw={800}
            >
              Stop Talking to Your Customers <br />
              <Text span c="blue" inherit>About Their Orders.</Text>
            </Title>
            <Text size="xl" c="dimmed" maw={600} mx="auto">
              WOT automates your post-order conversations. We provide live tracking, automated WhatsApp alerts, and secure delivery codes so you can focus on making sales.
            </Text>
            <Group gap="md">
              <Button size="xl" radius="md" rightSection={<IconArrowRight size={20}/>} shadow="md">
                Start for Free
              </Button>
              <Button size="xl" radius="md" variant="outline" color="blue">
                Watch Demo
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* 3. The Problem: The "Communication Tax" */}
      <Container size="lg" py={rem(80)}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={50} verticalSpacing={50}>
          <Stack gap="md">
            <Title order={2} size={rem(36)} fw={900}>
              Stop paying the "Communication Tax"
            </Title>
            <Text c="dimmed" size="lg">
              SME owners spend up to 3 hours a day on WhatsApp answering "Where is my order?" WOT gives that time back to you.
            </Text>
            <List
              spacing="md"
              size="md"
              icon={
                <ThemeIcon color="red" size={24} radius="xl" variant="light">
                  <IconMessageX size={16} />
                </ThemeIcon>
              }
            >
              <List.Item>No more manual "He is on the way" messages.</List.Item>
              <List.Item>No more calling riders to find their location.</List.Item>
              <List.Item>No more delivery disputes or "missing" packages.</List.Item>
            </List>
          </Stack>

          <Paper withBorder p="xl" radius="lg" shadow="xl" bg="gray.0">
            <Stack>
              <Text fw={700} c="blue">Typical Afternoon for a WOT Merchant:</Text>
              <Group wrap="nowrap" align="flex-start">
                <ThemeIcon color="green" variant="light" radius="xl"><IconCircleCheck size={16}/></ThemeIcon>
                <Text size="sm"><b>12:00 PM:</b> Customer buys. WOT sends instant WhatsApp receipt.</Text>
              </Group>
              <Group wrap="nowrap" align="flex-start">
                <ThemeIcon color="green" variant="light" radius="xl"><IconCircleCheck size={16}/></ThemeIcon>
                <Text size="sm"><b>01:30 PM:</b> Order Ready. WOT sends tracking link. Customer watches rider on map.</Text>
              </Group>
              <Group wrap="nowrap" align="flex-start">
                <ThemeIcon color="green" variant="light" radius="xl"><IconCircleCheck size={16}/></ThemeIcon>
                <Text size="sm"><b>02:00 PM:</b> Secure Delivery. Rider verifies OTP. Order marked complete.</Text>
              </Group>
              <Divider label="Result" labelPosition="center" />
              <Text ta="center" fw={900} size="lg" c="green">0 Calls Made. 0 Messages Typed.</Text>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Container>

      {/* 4. Core Features Grid */}
      <Box bg="blue.9" py={rem(100)} style={{ color: 'white' }}>
        <Container size="lg">
          <Stack align="center" mb={60} ta="center">
            <Title order={2} size={rem(42)} fw={900}>Everything you need to automate trust</Title>
            <Text maw={600} opacity={0.7}>We built the high-tech logistics tools used by giants, simplified for your business.</Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
            <FeatureCard 
              icon={IconBrandWhatsapp} 
              title="WhatsApp Automation" 
              desc="Automatic status updates sent from your own business number via Twilio or Baileys."
            />
            <FeatureCard 
              icon={IconMapPinCheck} 
              title="Live GPS Tracking" 
              desc="Customers watch their rider move in real-time. No more 'Oga where are you?' calls."
            />
            <FeatureCard 
              icon={IconShieldCheck} 
              title="OTP Verification" 
              desc="Delivery is only complete when the customer gives the rider the secure code. Zero fraud."
            />
            <FeatureCard 
              icon={IconDeviceMobile} 
              title="Rider PWA" 
              desc="A lightweight app for riders that works on any smartphone, even with low data."
            />
            <FeatureCard 
              icon={IconChartBar} 
              title="Delivery Analytics" 
              desc="See your most efficient riders and your busiest delivery zones in one dashboard."
            />
            <FeatureCard 
              icon={IconTruckDelivery} 
              title="Custom Forms" 
              desc="Build custom order forms that capture landmarks and delivery specifics perfectly."
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* 5. Final CTA */}
      <Container size="md" py={rem(120)}>
        <Paper 
          radius="xl" 
          p={rem(60)} 
          shadow="xl" 
          withBorder 
          style={{ 
            textAlign: 'center', 
            background: `linear-gradient(45deg, var(--mantine-color-blue-7), var(--mantine-color-blue-9))`,
            color: 'white'
          }}
        >
          <Stack align="center" gap="lg">
            <Title order={2} size={rem(48)} fw={900}>Ready to reclaim your time?</Title>
            <Text size="lg" opacity={0.9}>
              Join 100+ merchants who have eliminated manual tracking conversations.
            </Text>
            <Button size="xl" radius="md" color="white" c="blue" shadow="xl" px={50}>
              Get Started for Free
            </Button>
          </Stack>
        </Paper>
      </Container>

      {/* 6. Footer */}
      <Box py="xl" bg="gray.0" style={{ borderTop: `${rem(1)} solid var(--mantine-color-gray-2)` }}>
        <Container size="lg">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">© 2026 WOT Logistics. All rights reserved.</Text>
            <Group gap="xl">
              <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }}>Privacy</Text>
              <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }}>Terms</Text>
              <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }}>Contact</Text>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
};

interface FeatureCardProps {
  icon: any;
  title: string;
  desc: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, desc }) => (
  <Paper p="xl" radius="lg" bg="rgba(255, 255, 255, 0.05)" style={{ border: `${rem(1)} solid rgba(255, 255, 255, 0.1)` }}>
    <ThemeIcon variant="light" color="blue" size="xl" radius="md" mb="md">
      <Icon size={24} />
    </ThemeIcon>
    <Text fw={700} size="lg" mb="sm">{title}</Text>
    <Text size="sm" opacity={0.6} style={{ lineHeight: 1.6 }}>{desc}</Text>
  </Paper>
);

export default LandingPage;