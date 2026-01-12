import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Paper, Title, Text, Stack, Card, Group, Accordion, Button, ThemeIcon, Badge, Divider, Box, Alert, List } from '@mantine/core';
import { IconHelpCircle, IconMail, IconPhone, IconBook, IconAlertCircle, IconCheck, IconArrowRight } from '@tabler/icons-react';
import AuthHeader from '../components/AuthHeader';

const HelpPage: React.FC = () => {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <AuthHeader title="Help & Support" />
        {/* Overview */}
        <Paper withBorder p="xl" radius="lg" bg="blue.0">
          <Stack gap="md">
            <Group gap="md">
              <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                <IconBook size={24} />
              </ThemeIcon>
              <Stack gap={0}>
                <Title order={2}>Welcome to WOT – Your Independent Delivery Dashboard</Title>
                <Text c="dimmed" size="sm">Complete guide to setting up and running your business with Twilio WhatsApp integration</Text>
              </Stack>
            </Group>
          </Stack>
        </Paper>



        {/* Step 4: Create & Manage Orders */}
        <Paper withBorder p="xl" radius="lg">
          <Stack gap="lg">
            <Group gap="md">
              <Badge size="lg" variant="filled" color="teal">Step 1</Badge>
              <Title order={2}>Create & Manage Orders</Title>
            </Group>

            <Card withBorder p="lg" bg="teal.0" radius="md">
              <Stack gap="lg">
                <Stack gap="sm">
                  <Group gap="xs">
                    <ThemeIcon color="teal" variant="light">
                      <IconCheck size={20} />
                    </ThemeIcon>
                    <Text fw={500}>Create Custom Order Forms</Text>
                  </Group>
                  <Text size="sm" ml="lg">Go to "Manage Forms" to design custom order templates. Only the fields YOU need.</Text>
                </Stack>

                <Divider />

                <Stack gap="sm">
                  <Group gap="xs">
                    <ThemeIcon color="teal" variant="light">
                      <IconCheck size={20} />
                    </ThemeIcon>
                    <Text fw={500}>Create Orders (Manually or Import)</Text>
                  </Group>
                  <Text size="sm" ml="lg">Create orders one-by-one in the dashboard, or bulk import via CSV</Text>
                </Stack>

                <Divider />

                <Stack gap="sm">
                  <Group gap="xs">
                    <ThemeIcon color="teal" variant="light">
                      <IconCheck size={20} />
                    </ThemeIcon>
                    <Text fw={500}>Auto-Send WhatsApp Notifications</Text>
                  </Group>
                  <List size="sm" ml="lg" mt="xs">
                    <List.Item>Customer receives order confirmation via WhatsApp</List.Item>
                    <List.Item>Customer gets live tracking link when rider is assigned</List.Item>
                    <List.Item>Customer gets satisfaction survey after delivery</List.Item>
                  </List>
                </Stack>

                <Divider />

                <Stack gap="sm">
                  <Group gap="xs">
                    <ThemeIcon color="teal" variant="light">
                      <IconCheck size={20} />
                    </ThemeIcon>
                    <Text fw={500}>Move Orders Through Pipeline</Text>
                  </Group>
                  <Text size="sm" ml="lg">Drag orders through status: NEW → PROCESSING → READY → DISPATCHED → COMPLETED</Text>
                </Stack>
              </Stack>
            </Card>
          </Stack>
        </Paper>

        {/* How It Works */}
        <Paper withBorder p="xl" radius="lg" bg="indigo.0">
          <Stack gap="lg">
            <Group gap="md">
              <ThemeIcon size="lg" radius="md" variant="light" color="indigo">
                <IconArrowRight size={24} />
              </ThemeIcon>
              <Title order={2}>How Everything Works Together</Title>
            </Group>

            <Card withBorder p="lg" radius="md">
              <Stack gap="md">
                <Group gap="sm" align="flex-start">
                  <Badge color="indigo" size="lg">1</Badge>
                  <Stack gap={0}>
                    <Text fw={500}>Customer places order (via you or WhatsApp)</Text>
                    <Text size="sm" c="dimmed">You create order manually or customer messages your WhatsApp number</Text>
                  </Stack>
                </Group>

                <Divider />

                <Group gap="sm" align="flex-start">
                  <Badge color="indigo" size="lg">2</Badge>
                  <Stack gap={0}>
                    <Text fw={500}>Order appears in YOUR dashboard (NEW status)</Text>
                    <Text size="sm" c="dimmed">You see all order details in real-time</Text>
                  </Stack>
                </Group>

                <Divider />

                <Group gap="sm" align="flex-start">
                  <Badge color="indigo" size="lg">3</Badge>
                  <Stack gap={0}>
                    <Text fw={500}>WOT sends confirmation via Twilio WhatsApp</Text>
                    <Text size="sm" c="dimmed">Customer knows their order is confirmed (using YOUR Twilio account)</Text>
                  </Stack>
                </Group>

                <Divider />

                <Group gap="sm" align="flex-start">
                  <Badge color="indigo" size="lg">4</Badge>
                  <Stack gap={0}>
                    <Text fw={500}>You prepare & assign a rider</Text>
                    <Text size="sm" c="dimmed">Click "Assign Rider" and enter rider's phone number</Text>
                  </Stack>
                </Group>

                <Divider />

                <Group gap="sm" align="flex-start">
                  <Badge color="indigo" size="lg">5</Badge>
                  <Stack gap={0}>
                    <Text fw={500}>Rider gets tracking link + Customer gets tracking</Text>
                    <Text size="sm" c="dimmed">Both receive WhatsApp links (via your Twilio) with live GPS tracking</Text>
                  </Stack>
                </Group>

                <Divider />

                <Group gap="sm" align="flex-start">
                  <Badge color="indigo" size="lg">6</Badge>
                  <Stack gap={0}>
                    <Text fw={500}>Rider completes delivery</Text>
                    <Text size="sm" c="dimmed">Rider taps "Delivered & Paid" button to confirm</Text>
                  </Stack>
                </Group>

                <Divider />

                <Group gap="sm" align="flex-start">
                  <Badge color="indigo" size="lg">7</Badge>
                  <Stack gap={0}>
                    <Text fw={500}>Customer satisfaction survey sent</Text>
                    <Text size="sm" c="dimmed">Quick 2-tap survey via WhatsApp. You see feedback instantly.</Text>
                  </Stack>
                </Group>
              </Stack>
            </Card>
          </Stack>
        </Paper>

        {/* Pro Tips */}
        <Paper withBorder p="xl" radius="lg" bg="lime.0">
          <Stack gap="lg">
            <Title order={2}>💡 Pro Tips for Success</Title>

            <Stack gap="md">
              <Card withBorder p="md" radius="md">
                <Group gap="md" align="flex-start">
                  <Text size="xl">🎯</Text>
                  <Stack gap={0}>
                    <Text fw={500}>Keep Phone Numbers Accurate</Text>
                    <Text size="sm" c="dimmed">Double-check customer & rider phone numbers before creating orders. Mistakes = wrong delivery.</Text>
                  </Stack>
                </Group>
              </Card>

              <Card withBorder p="md" radius="md">
                <Group gap="md" align="flex-start">
                  <Text size="xl">⚡</Text>
                  <Stack gap={0}>
                    <Text fw={500}>Monitor Your Kanban Board Daily</Text>
                    <Text size="sm" c="dimmed">Keep orders flowing left to right. The faster you move orders, the better your customer experience.</Text>
                  </Stack>
                </Group>
              </Card>

              <Card withBorder p="md" radius="md">
                <Group gap="md" align="flex-start">
                  <Text size="xl">💰</Text>
                  <Stack gap={0}>
                    <Text fw={500}>Monitor Twilio Costs</Text>
                    <Text size="sm" c="dimmed">Each WhatsApp message costs a small amount. Check your Twilio dashboard to see usage & costs.</Text>
                  </Stack>
                </Group>
              </Card>

              <Card withBorder p="md" radius="md">
                <Group gap="md" align="flex-start">
                  <Text size="xl">📊</Text>
                  <Stack gap={0}>
                    <Text fw={500}>Use Customer Feedback</Text>
                    <Text size="sm" c="dimmed">Check satisfaction ratings daily. If scores drop, investigate delivery issues quickly.</Text>
                  </Stack>
                </Group>
              </Card>

              <Card withBorder p="md" radius="md">
                <Group gap="md" align="flex-start">
                  <Text size="xl">🔄</Text>
                  <Stack gap={0}>
                    <Text fw={500}>Automate Everything You Can</Text>
                    <Text size="sm" c="dimmed">Use custom forms to auto-capture data. Bulk import CSV for high-volume orders. Let WOT handle the messaging.</Text>
                  </Stack>
                </Group>
              </Card>
            </Stack>
          </Stack>
        </Paper>

        {/* FAQ */}
        <Paper withBorder p="xl" radius="lg">
          <Stack gap="lg">
            <Title order={2}>Frequently Asked Questions</Title>

            <Accordion defaultValue="q1">
              <Accordion.Item value="q2">
                <Accordion.Control>Do I own my customer data?</Accordion.Control>
                <Accordion.Panel>
                  <Text>100% yes. Your customer data stays in YOUR Supabase database. You own it. You control it. We just provide the dashboard to manage it.</Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="q3">
                <Accordion.Control>Can I export my orders?</Accordion.Control>
                <Accordion.Panel>
                  <Text>Yes. You can export orders, feedback, and rider data as CSV anytime. WOT keeps the data portable.</Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="q5">
                <Accordion.Control>Can multiple team members use WOT?</Accordion.Control>
                <Accordion.Panel>
                  <Text>Not yet, but it's planned. Currently, one account = one SME. We're working on team collaboration features.</Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="q7">
                <Accordion.Control>Is there a cost to use WOT?</Accordion.Control>
                <Accordion.Panel>
                  <Text>WOT itself is free. You only pay for WhatsApp messages sent.</Text>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        </Paper>

        {/* Support Card */}
        <Paper withBorder p="xl" radius="lg" bg="pink.0">
          <Stack gap="md">
            <Title order={2}>Need Help?</Title>
            <Text>Explore the WOT documentation or reach out to our support team at:</Text>
            <Group gap="md">
              <Button leftSection={<IconMail size={16} />} variant="light">
                support@wot.app
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default HelpPage;