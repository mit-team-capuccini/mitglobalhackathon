'use client';

import {
  Card,
  Stack,
  Title,
  Checkbox,
} from '@mantine/core';

export function SettingsCard() {
  return (
    <Card padding="lg" radius="lg" withBorder bg="gray.1">
      <Stack>
        <Title order={4}>Settings for the Card</Title>
        <Checkbox label="Show Traffic" defaultChecked />
        <Checkbox label="Enable Markers" />
        <Checkbox label="Use Satellite View" />
      </Stack>
    </Card>
  );
} 