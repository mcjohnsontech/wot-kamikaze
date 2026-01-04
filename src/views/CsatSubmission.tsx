import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderByToken, useSubmitCSAT } from '../hooks/useOrders';
import { Container, Card, Title, Text, Button, Stack, Group, Alert, Loader, Center, Textarea } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';

const CsatSubmission: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error } = useOrderByToken(token);
  const { submit, isSubmitting } = useSubmitCSAT(order?.id || '');

  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!order?.id || score === null) return;
    await submit(score, comment);
    setIsSubmitted(true);
  };

  if (isLoading) {
    return (
      <Center mih="100vh">
        <Stack align="center">
          <Loader />
          <Text>Loading feedback form...</Text>
        </Stack>
      </Center>
    );
  }

  if (error || !order) {
    return (
      <Center mih="100vh" p="xl">
        <Alert icon={<IconAlertCircle />} title="Invalid Feedback Link" color="red" style={{ maxWidth: 400 }}>
          This feedback form has expired or is invalid
        </Alert>
      </Center>
    );
  }

  if (isSubmitted) {
    return (
      <Center mih="100vh" p="xl">
        <Stack align="center" gap="lg" style={{ maxWidth: 400 }}>
          <IconCheck size={64} color="var(--mantine-color-green-6)" />
          <Stack gap="xs" align="center">
            <Title order={2}>Thank You!</Title>
            <Text c="dimmed" ta="center">
              Your feedback has been recorded. We appreciate your business and look forward to serving you again!
            </Text>
          </Stack>
          <Button color="green" fullWidth variant="light" onClick={() => window.close()}>
            You can close this tab
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Center mih="100vh" p="xl">
      <Card withBorder shadow="lg" padding="xl" style={{ maxWidth: 400 }} radius="md">
        {/* Header */}
        <Stack gap="xs" mb="xl">
          <Title order={1} ta="center">How was your experience?</Title>
          <Text c="dimmed" ta="center" size="sm">
            Order #{order.readable_id} - {order.customer_name}
          </Text>
        </Stack>

        {/* Score Selection */}
        <Stack gap="md" mb="xl">
          <Button
            onClick={() => setScore(5)}
            variant={score === 5 ? 'filled' : 'light'}
            color="teal"
            size="lg"
            leftSection="⭐"
            fullWidth
          >
            Loved it!
          </Button>

          <Button
            onClick={() => setScore(3)}
            variant={score === 3 ? 'filled' : 'light'}
            color="orange"
            size="lg"
            leftSection="⚠️"
            fullWidth
          >
            Had issues
          </Button>
        </Stack>

        {/* Comment Section & Submit */}
        {score !== null && !isSubmitted && (
          <Stack gap="md" mb="xl" style={{ borderTop: '1px solid var(--mantine-color-gray-2)', paddingTop: 'var(--mantine-spacing-lg)' }}>
            <Text fw={500} size="sm">
              {score === 5 ? 'Tell us what you loved!' : 'Tell us what went wrong'}
            </Text>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.currentTarget.value)}
              placeholder="Your feedback helps us improve..."
              rows={4}
            />
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              size="lg"
              radius="md"
              fullWidth
            >
              Submit Feedback
            </Button>
          </Stack>
        )}

        {/* Info */}
        <Alert color="blue" title="✨ Your feedback is valuable">
          It helps other customers make better choices
        </Alert>
      </Card>
    </Center>
  );
};

export default CsatSubmission;
