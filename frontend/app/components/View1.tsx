'use client';

import React, { useState, useCallback } from 'react';
import {
  Grid,
  Card,
  Stack,
  Text,
  List,
  Title,
  ThemeIcon,
} from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';

// Import the new components
import { GoogleMapCard } from './GoogleMapCard';
import { SettingsCard } from './SettingsCard';

export function View1() {
  // State for layer visibility
  const [showSchools, setShowSchools] = useState(true);
  const [showDensity, setShowDensity] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Handlers to toggle visibility
  const toggleSchools = useCallback(() => setShowSchools((v) => !v), []);
  const toggleDensity = useCallback(() => setShowDensity((v) => !v), []);
  const toggleHeatmap = useCallback(() => {
    setShowHeatmap((v) => {
      console.log('View1: Toggling heatmap visibility. New value should be:', !v);
      return !v;
    });
  }, []);

  return (
    <Grid gutter="md">
      {/* Left Column (2/3) */}
      <Grid.Col span={8}>
        <Stack gap="md">
          {/* Use the GoogleMapCard component */}
          <GoogleMapCard
            showSchools={showSchools}
            showDensity={showDensity}
            showHeatmap={showHeatmap}
          />

          {/* Use the SettingsCard component */}
          <SettingsCard
            showSchools={showSchools}
            showDensity={showDensity}
            showHeatmap={showHeatmap}
            onToggleSchools={toggleSchools}
            onToggleDensity={toggleDensity}
            onToggleHeatmap={toggleHeatmap}
          />
        </Stack>
      </Grid.Col>

      {/* Right Column (1/3) */}
      <Grid.Col span={4}>
        <Stack gap="md">
          {/* Info Card */}
          <Card padding="lg" radius="lg" bg="gray.3">
            <Stack>
              <Title order={4}>Info Panel</Title>
              <Text>Info 1: Some detail</Text>
              <Text>Info 2: Another detail</Text>
              <Text>Info 3: More information</Text>
            </Stack>
          </Card>

          {/* Task List Card */}
          <Card padding="lg" radius="lg" bg="gray.3">
            <Stack>
              <Title order={4}>Task List</Title>
              <List
                spacing="xs"
                size="sm"
                center
                icon={
                  <ThemeIcon size={24} radius="xl">
                    <IconCircleCheck size="1rem" />
                  </ThemeIcon>
                }
              >
                <List.Item>Task 1: Review locations</List.Item>
                <List.Item>Task 2: Check settings</List.Item>
                <List.Item>Task 3: Finalize route</List.Item>
              </List>
            </Stack>
          </Card>
        </Stack>
      </Grid.Col>
    </Grid>
  );
} 