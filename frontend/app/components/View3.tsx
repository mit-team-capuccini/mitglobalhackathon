'use client';

import {
  Card,
  Title,
  Text,
  Stack,
} from '@mantine/core';

export function View3() {
  return (
    <Card padding="lg" radius="lg" withBorder bg="gray.1">
      <Stack align="center" justify="center" h={400}>
          <Title order={2}>View 3</Title>
          <Text c="dimmed">Content for View 3 goes here.</Text>
      </Stack>
    </Card>
  );
} 