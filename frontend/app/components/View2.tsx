'use client';

import {
  Card,
  Title,
  Text,
  Stack,
} from '@mantine/core';

export function View2() {
  return (
    <Card padding="lg" radius="lg" withBorder bg="gray.1">
      <Stack align="center" justify="center" h={400}>
          <Title order={2}>View 2</Title>
          <Text c="dimmed">Content for View 2 goes here.</Text>
      </Stack>
    </Card>
  );
} 