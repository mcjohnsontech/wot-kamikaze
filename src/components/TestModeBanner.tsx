import React from 'react';
import { Alert, Text, Group, CopyButton, Button, ThemeIcon, Stack, Box, rem } from '@mantine/core';
import { IconAlertTriangle, IconBrandWhatsapp, IconCopy, IconCheck } from '@tabler/icons-react';

const TestModeBanner: React.FC = () => {
    return (
        <Alert
            variant="filled"
            color="orange"
            radius="md"
            mb="xl"
            icon={<IconAlertTriangle size={24} />}
            title={<Text fw={900} size="lg">TEST MODE: WHATSAPP SANDBOX REQUIRED</Text>}
            styles={{
                message: {
                    color: 'white'
                }
            }}
        >
            <Stack gap="md">
                <Text size="sm" c="white" style={{ lineHeight: 1.5 }}>
                    The application is currently in <b>Test Mode</b>. To enable order notifications for your customers and riders,
                    you <b>MUST</b> join the Twilio WhatsApp Sandbox on every number you intend to test with.
                </Text>

                <Box
                    bg="rgba(255, 255, 255, 0.15)"
                    p="sm"
                    style={{ borderRadius: '8px' }}
                >
                    <Group gap="lg" align="center" justify="flex-start" style={{ rowGap: '1rem' }}>
                        {/* Part 1: Phone Number */}
                        <Group gap="xs" bg="white" px="sm" py="xs" style={{ borderRadius: '6px', flexGrow: 0 }}>
                            <ThemeIcon color="green" size="sm" radius="xl" variant="light">
                                <IconBrandWhatsapp size={14} />
                            </ThemeIcon>
                            <Text size="sm" c="dark" fw={700} style={{ whiteSpace: 'nowrap' }}>+1 415 523 8886</Text>
                        </Group>

                        {/* Part 2: Join Code */}
                        <Group gap="xs" align="center" style={{ flexGrow: 1 }}>
                            <Text fw={600} c="white" size="sm" style={{ whiteSpace: 'nowrap' }}>
                                Send this code:
                            </Text>
                            <Group gap={0} wrap="nowrap">
                                <Box
                                    bg="white"
                                    c="dark"
                                    py={5}
                                    px={10}
                                    style={{
                                        borderTopLeftRadius: '6px',
                                        borderBottomLeftRadius: '6px',
                                        fontFamily: 'monospace',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        borderRight: '1px solid #eee'
                                    }}
                                >
                                    join string-cell
                                </Box>
                                <CopyButton value="join string-cell" timeout={2000}>
                                    {({ copied, copy }) => (
                                        <Button
                                            color={copied ? 'teal' : 'dark'}
                                            onClick={copy}
                                            size="sm"
                                            radius={0}
                                            style={{
                                                borderTopRightRadius: '6px',
                                                borderBottomRightRadius: '6px',
                                                height: '32px', // Match the height of the text box + padding approx
                                            }}
                                            px="xs"
                                        >
                                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                        </Button>
                                    )}
                                </CopyButton>
                            </Group>
                        </Group>
                    </Group>
                </Box>
            </Stack>
        </Alert>
    );
};

export default TestModeBanner;
