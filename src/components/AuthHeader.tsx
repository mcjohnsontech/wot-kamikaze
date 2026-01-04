import React from 'react';
import { Link } from 'react-router-dom';
import { Group, Paper, Title, Text, Avatar, Tooltip, ActionIcon, Divider, Menu } from '@mantine/core';
import { IconClipboardList, IconMessageCircle, IconFileUpload, IconDots, IconHelp, IconLogout, IconHome } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

const AuthHeader: React.FC<{ title?: string }> = ({ title }) => {
  const { logout, user } = useAuth();

  return (
    <Paper withBorder p="md" radius="lg" shadow="xs" mb="xl">
      <Group justify="space-between">
        <Group gap="md">
          <Avatar color="blue" radius="xl" size="lg">{user?.name?.slice(0, 2).toUpperCase() || 'SM'}</Avatar>
          <div>
            <Title order={2} size="h3">{title || 'Dashboard'}</Title>
            <Text c="dimmed" size="xs">Merchant: {user?.name || 'SME'}</Text>
          </div>
        </Group>

        <Group gap="xs">
          <Tooltip label="Dashboard"><ActionIcon component={Link} to="/sme" variant="light" size="lg"><IconHome size={20} /></ActionIcon></Tooltip>
          <Tooltip label="Manage Forms"><ActionIcon component={Link} to="/forms" variant="light" size="lg"><IconClipboardList size={20} /></ActionIcon></Tooltip>
          <Tooltip label="WhatsApp Settings"><ActionIcon component={Link} to="/whatsapp" variant="light" size="lg" color="green"><IconMessageCircle size={20} /></ActionIcon></Tooltip>
          <Tooltip label="Import Data"><ActionIcon component={Link} to="/csv-import" variant="light" size="lg"><IconFileUpload size={20} /></ActionIcon></Tooltip>

          <Divider orientation="vertical" />

          <Menu shadow="md" position="bottom-end">
            <Menu.Target><ActionIcon variant="outline" size="lg" color="gray"><IconDots size={20} /></ActionIcon></Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
              <Menu.Item component={Link} to="/help" leftSection={<IconHelp size={14} />}>Support</Menu.Item>
              <Menu.Item color="red" onClick={logout} leftSection={<IconLogout size={14} />}>Logout</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Paper>
  );
};

export default AuthHeader;
