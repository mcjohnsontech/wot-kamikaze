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

        {/* Step 1: Twilio Setup */}
        <Paper withBorder p="xl" radius="lg">
          <Stack gap="lg">
            <Group gap="md">
              <Badge size="lg" variant="filled" color="green">Step 1</Badge>
              <Title order={2}>Get Your Own Twilio Account</Title>
            </Group>
            
            <Text fw={500}>Why Twilio? It's the industry standard for sending WhatsApp messages reliably.</Text>
            
            <Card withBorder p="lg" bg="green.0" radius="md">
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon color="green" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Text fw={500}>Visit <Text component="span" fw={700} c="green">https://www.twilio.com</Text></Text>
                </Group>
                
                <Group gap="xs">
                  <ThemeIcon color="green" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={500}>Sign up for a free account</Text>
                    <Text size="sm" c="dimmed">You get trial credits to test everything</Text>
                  </Stack>
                </Group>
                
                <Group gap="xs">
                  <ThemeIcon color="green" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={500}>Verify your phone number (for testing)</Text>
                    <Text size="sm" c="dimmed">Receive a verification code via SMS</Text>
                  </Stack>
                </Group>
                
                <Group gap="xs">
                  <ThemeIcon color="green" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={500}>Find your Account SID and Auth Token</Text>
                    <Text size="sm" c="dimmed">Located in your Twilio Console dashboard</Text>
                  </Stack>
                </Group>
              </Stack>
            </Card>
          </Stack>
        </Paper>

        {/* Step 2: WhatsApp Business API */}
        <Paper withBorder p="xl" radius="lg">
          <Stack gap="lg">
            <Group gap="md">
              <Badge size="lg" variant="filled" color="cyan">Step 2</Badge>
              <Title order={2}>Connect WhatsApp Business Account</Title>
            </Group>
            
            <Alert icon={<IconAlertCircle size={16} />} title="You control everything" color="blue">
              <Text size="sm">Your customers message YOU directly on your WhatsApp Business number. All messages & notifications come through YOUR account—not ours.</Text>
            </Alert>

            <Card withBorder p="lg" bg="cyan.0" radius="md">
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon color="cyan" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={500}>In Twilio Console, go to Messaging → Services</Text>
                    <Text size="sm" c="dimmed">Create a new Messaging Service</Text>
                  </Stack>
                </Group>
                
                <Group gap="xs">
                  <ThemeIcon color="cyan" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={500}>Add WhatsApp Sender as a channel</Text>
                    <Text size="sm" c="dimmed">You'll either use your personal WhatsApp number (sandbox) or your official WhatsApp Business Account</Text>
                  </Stack>
                </Group>
                
                <Group gap="xs">
                  <ThemeIcon color="cyan" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={500}>Get your Twilio WhatsApp Sender ID</Text>
                    <Text size="sm" c="dimmed">This is the phone number that sends messages to customers</Text>
                  </Stack>
                </Group>

                <Divider />

                <Box p="md" bg="yellow.0" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                  <Group gap="xs">
                    <Text fw={700} size="sm">🔗 Sandbox vs Production:</Text>
                  </Group>
                  <List size="sm" mt="xs" ml="lg">
                    <List.Item><Text size="sm"><Text fw={500} component="span">Sandbox (Free):</Text> Send to pre-approved test numbers</Text></List.Item>
                    <List.Item><Text size="sm"><Text fw={500} component="span">Production:</Text> Send to any WhatsApp user (requires business verification)</Text></List.Item>
                  </List>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Paper>

        {/* Step 3: Connect in WOT */}
        <Paper withBorder p="xl" radius="lg">
          <Stack gap="lg">
            <Group gap="md">
              <Badge size="lg" variant="filled" color="grape">Step 3</Badge>
              <Title order={2}>Configure WOT with Your Twilio Credentials</Title>
            </Group>

            <Card withBorder p="lg" bg="grape.0" radius="md">
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon color="grape" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={500}>Go to WhatsApp Config</Text>
                    <Text size="sm" c="dimmed">In the WOT app, click "WhatsApp Setup" from the menu</Text>
                  </Stack>
                </Group>
                
                <Group gap="xs">
                  <ThemeIcon color="grape" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={500}>Select "Twilio (Official)"</Text>
                    <Text size="sm" c="dimmed">Click the Twilio tab</Text>
                  </Stack>
                </Group>
                
                <Group gap="xs">
                  <ThemeIcon color="grape" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={500}>Enter your Twilio credentials:</Text>
                    <List size="sm" ml="lg" mt="xs">
                      <List.Item>Account SID</List.Item>
                      <List.Item>Auth Token</List.Item>
                      <List.Item>Twilio Phone Number (WhatsApp sender)</List.Item>
                    </List>
                  </Stack>
                </Group>

                <Group gap="xs">
                  <ThemeIcon color="grape" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={500}>Click "Test Connection"</Text>
                    <Text size="sm" c="dimmed">WOT verifies your Twilio credentials work</Text>
                  </Stack>
                </Group>

                <Group gap="xs">
                  <ThemeIcon color="grape" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Text fw={500}>✅ You're connected! Start creating orders.</Text>
                </Group>
              </Stack>
            </Card>

            <Alert icon={<IconAlertCircle size={16} />} title="Important" color="orange">
              <Text size="sm">Your credentials are encrypted and stored securely. We never share them with third parties.</Text>
            </Alert>
          </Stack>
        </Paper>

        {/* Step 4: Create & Manage Orders */}
        <Paper withBorder p="xl" radius="lg">
          <Stack gap="lg">
            <Group gap="md">
              <Badge size="lg" variant="filled" color="teal">Step 4</Badge>
              <Title order={2}>Create & Manage Orders Independently</Title>
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
              <Accordion.Item value="q1">
                <Accordion.Control>What if I don't have a WhatsApp Business Account?</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    <Text>You can start with Twilio's WhatsApp sandbox (free). It works perfectly for testing. When ready for production, apply for a WhatsApp Business Account through Meta. Twilio guides you through the process.</Text>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

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

              <Accordion.Item value="q4">
                <Accordion.Control>What if my Twilio account runs out of credits?</Accordion.Control>
                <Accordion.Panel>
                  <Text>WhatsApp messages won't be sent until you add credits. WOT will show an error. Orders stay in the system—you just won't get automated messages. Add credits in your Twilio dashboard immediately.</Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="q5">
                <Accordion.Control>Can multiple team members use WOT?</Accordion.Control>
                <Accordion.Panel>
                  <Text>Not yet, but it's planned. Currently, one account = one SME. We're working on team collaboration features.</Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="q6">
                <Accordion.Control>How do I reset my Twilio connection?</Accordion.Control>
                <Accordion.Panel>
                  <Text>Go to WhatsApp Config and delete your Twilio credentials. Then re-enter new ones. Your orders stay intact—only the connection is refreshed.</Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="q7">
                <Accordion.Control>Is there a cost to use WOT?</Accordion.Control>
                <Accordion.Panel>
                  <Text>WOT itself is free. You only pay Twilio for WhatsApp messages (usually ₦5-10 per message in Nigeria). Twilio free tier includes trial credits for testing.</Text>
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