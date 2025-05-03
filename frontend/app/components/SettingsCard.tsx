'use client';

import {
  Card,
  Stack,
  Title,
  Checkbox,
} from '@mantine/core';

export function SettingsCard() {
  return (
    <Card padding="lg" radius="lg" bg="gray.3">
      <Stack>
        <Title order={4}>Settings for the Card</Title>
        <Checkbox label="Show Traffic" defaultChecked />
        <Checkbox label="Enable Markers" />
        <Checkbox label="Use Satellite View" />
      </Stack>
    </Card>
  );
} 