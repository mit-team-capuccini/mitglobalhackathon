'use client';

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
  return (
    <Grid gutter="md">
      {/* Left Column (2/3) */}
      <Grid.Col span={8}>
        <Stack gap="md">
          {/* Use the GoogleMapCard component */}
          <GoogleMapCard />


          {/* Use the SettingsCard component */}
          <SettingsCard />
        </Stack>
      </Grid.Col>

      {/* Right Column (1/3) */}
      <Grid.Col span={4}>
        <Stack gap="md">
          {/* Info Card */}
          <Card padding="lg" radius="lg" withBorder bg="gray.1">
            <Stack>
              <Title order={4}>Info Panel</Title>
              <Text>Info 1: Some detail</Text>
              <Text>Info 2: Another detail</Text>
              <Text>Info 3: More information</Text>
            </Stack>
          </Card>

          {/* Task List Card */}
          <Card padding="lg" radius="lg" withBorder bg="gray.1">
            <Stack>
              <Title order={4}>Task List</Title>
              <List
                spacing="xs"
                size="sm"
                center
                icon={
                  <ThemeIcon color="yellow" size={24} radius="xl">
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