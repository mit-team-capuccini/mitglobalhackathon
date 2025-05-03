'use client';

import {
  Card,
  Stack,
  Title,
  Button,
  Group,
  Divider,
  rem
} from '@mantine/core';
import {
  IconChartHistogram,
  IconFlame,
  IconBuildingBridge,
  IconRoad,
  IconDroplet
} from '@tabler/icons-react';

// Define props interface
interface SettingsCardProps {
  showDensity: boolean;
  showHeatmap: boolean;
  showInfrastructurePins: boolean;
  showRoadClosures: boolean;
  showReservoirHeatmap: boolean;
  onToggleDensity: () => void;
  onToggleHeatmap: () => void;
  onToggleInfrastructurePins: () => void;
  onToggleRoadClosures: () => void;
  onToggleReservoirHeatmap: () => void;
}

export function SettingsCard({
  showDensity,
  showHeatmap,
  showInfrastructurePins,
  showRoadClosures,
  showReservoirHeatmap,
  onToggleDensity,
  onToggleHeatmap,
  onToggleInfrastructurePins,
  onToggleRoadClosures,
  onToggleReservoirHeatmap
}: SettingsCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md">
      <Stack>
        <Group grow>
          <Button
            leftSection={<IconChartHistogram size={16} />}
            variant={showDensity ? 'light' : 'default'}
            onClick={onToggleDensity}
            color="gray"
          >
            Density
          </Button>
          <Button
            leftSection={<IconFlame size={16} />}
            variant={showHeatmap ? 'light' : 'default'}
            onClick={onToggleHeatmap}
            color="gray"
          >
            Heatmap
          </Button>
          <Button
            leftSection={<IconBuildingBridge size={16} />}
            variant={showInfrastructurePins ? 'light' : 'default'}
            onClick={onToggleInfrastructurePins}
            color="gray"
          >
            Infra
          </Button>
          <Button
            leftSection={<IconRoad size={16} />}
            variant={showRoadClosures ? 'light' : 'default'}
            onClick={onToggleRoadClosures}
            color="gray"
          >
            Roads
          </Button>
          <Button
            leftSection={<IconDroplet size={16} />}
            variant={showReservoirHeatmap ? 'light' : 'default'}
            onClick={onToggleReservoirHeatmap}
            color="gray"
          >
            Reservoir
          </Button>
        </Group>
      </Stack>
    </Card>
  );
} 