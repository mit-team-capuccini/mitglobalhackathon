'use client';

import React from 'react';
import {
  Card,
  Stack,
  Title,
  Button,
  Group,
  Divider,
  rem,
  Switch,
  ThemeIcon,
  Text,
  ActionIcon
} from '@mantine/core';
import {
  IconBuildingBridge,
  IconDroplet,
  IconMapSearch,
  IconRoadOff,
  IconPlus,
  IconBuildingCommunity,
  IconMessageCircle
} from '@tabler/icons-react';

// Define props interface
interface SettingsCardProps {
  showDensity: boolean;
  showInfrastructurePins: boolean;
  showRoadClosures: boolean;
  showReservoirHeatmap: boolean;
  showSocialMediaPins: boolean;
  onToggleDensity: () => void;
  onToggleInfrastructurePins: () => void;
  onToggleRoadClosures: () => void;
  onToggleReservoirHeatmap: () => void;
  onToggleSocialMediaPins: () => void;
  onOpenSpecificRequestModal: () => void;
  specificRequestSubmitted: boolean;
  showBrokenBuilding: boolean;
  onToggleBrokenBuilding: () => void;
}

export function SettingsCard({
  showDensity,
  showInfrastructurePins,
  showRoadClosures,
  showReservoirHeatmap,
  showSocialMediaPins,
  onToggleDensity,
  onToggleInfrastructurePins,
  onToggleRoadClosures,
  onToggleReservoirHeatmap,
  onToggleSocialMediaPins,
  onOpenSpecificRequestModal,
  specificRequestSubmitted,
  showBrokenBuilding,
  onToggleBrokenBuilding
}: SettingsCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md">
      <Title order={4} mb="md">Map Layers & Requests</Title>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
             <ThemeIcon variant="light" color="gray" size="sm">
                <IconMapSearch size={14} />
              </ThemeIcon>
            <Text size="sm">Population Density</Text>
          </Group>
          <Switch size="sm" checked={showDensity} onChange={onToggleDensity} />
        </Group>
        <Group justify="space-between">
           <Group gap="xs">
             <ThemeIcon variant="light" color="gray" size="sm">
                <IconBuildingBridge size={14} />
              </ThemeIcon>
             <Text size="sm">Infrastructure Pins</Text>
           </Group>
          <Switch size="sm" checked={showInfrastructurePins} onChange={onToggleInfrastructurePins} />
        </Group>
        <Group justify="space-between">
           <Group gap="xs">
             <ThemeIcon variant="light" color="gray" size="sm">
                <IconRoadOff size={14} />
              </ThemeIcon>
             <Text size="sm">Road Closures</Text>
           </Group>
          <Switch size="sm" checked={showRoadClosures} onChange={onToggleRoadClosures} />
        </Group>
        <Group justify="space-between">
           <Group gap="xs">
             <ThemeIcon variant="light" color="gray" size="sm">
                <IconDroplet size={14} />
              </ThemeIcon>
             <Text size="sm">Reservoir Levels</Text>
           </Group>
          <Switch size="sm" checked={showReservoirHeatmap} onChange={onToggleReservoirHeatmap} />
        </Group>
        <Group justify="space-between">
           <Group gap="xs">
             <ThemeIcon variant="light" color="gray" size="sm">
                <IconMessageCircle size={14} />
              </ThemeIcon>
             <Text size="sm">Social Media Pins</Text>
           </Group>
          <Switch 
            size="sm" 
            checked={showSocialMediaPins} 
            onChange={onToggleSocialMediaPins} 
            color="dark"
          />
        </Group>

        <Divider
          my="xs"
          labelPosition="left"
          label={
            <Group gap="xs">
              <Text size="sm" fw={500}>Specific Requests</Text>
              <ActionIcon size="sm" variant="subtle" onClick={onOpenSpecificRequestModal} title="Add Specific Request">
                <IconPlus size={14} />
              </ActionIcon>
            </Group>
          }
        />

        {specificRequestSubmitted && (
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon variant="light" color="dark" size="sm">
                <IconBuildingCommunity size={14} />
              </ThemeIcon>
              <Text size="sm">Broken Building</Text>
            </Group>
            <Switch
              size="sm"
              checked={showBrokenBuilding}
              onChange={onToggleBrokenBuilding}
              color="dark"
            />
          </Group>
        )}
      </Stack>
    </Card>
  );
} 