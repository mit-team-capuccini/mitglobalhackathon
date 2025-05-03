'use client';

import {
  Card,
  Stack,
  Title,
  Switch,
  Group
} from '@mantine/core';

// Define props interface
interface SettingsCardProps {
  showSchools: boolean;
  showDensity: boolean;
  showHeatmap: boolean;
  onToggleSchools: () => void;
  onToggleDensity: () => void;
  onToggleHeatmap: () => void;
}

export function SettingsCard({
  showSchools,
  showDensity,
  showHeatmap,
  onToggleSchools,
  onToggleDensity,
  onToggleHeatmap
}: SettingsCardProps) {
  return (
    <Card padding="lg" radius="lg" bg="gray.3">
      <Stack>
        <Title order={4}>Map Layers</Title>
        <Switch
          label="Show Schools"
          checked={showSchools}
          onChange={onToggleSchools}
          color="yellow"
        />
        <Switch
          label="Show Population Density"
          checked={showDensity}
          onChange={onToggleDensity}
          color="yellow"
        />
        <Switch
          label="Show Heatmap"
          checked={showHeatmap}
          onChange={onToggleHeatmap}
          color="yellow"
        />
      </Stack>
    </Card>
  );
} 