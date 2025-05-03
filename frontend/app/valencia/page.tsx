'use client';

import {
  AppShell,
  Tabs,
  Container,
  Group,
  ThemeIcon,
  Title,
  Stack
} from '@mantine/core';
import { IconLayoutDashboard } from '@tabler/icons-react';
// Remove imports that are now in View1.tsx
// Keep AppShell, Tabs, Container

// Import the new view components
import { View1 } from '../components/View1';
import { View2 } from '../components/View2';
import { View3 } from '../components/View3';

export default function HomePage() {
  return (
    // Wrap AppShell with Tabs
    <Tabs defaultValue="view1">
      {/* Reduce header height */}
      <AppShell header={{ height: 60 }} padding="md" px="md">
        <AppShell.Header>
          <Container fluid h="100%">
            {/* Use Group for horizontal arrangement */}
            <Group justify="space-between" h="100%">
              {/* App Title and Icon (left) */}
              <Group gap="xs">
                <ThemeIcon variant="light" size="lg">
                  <IconLayoutDashboard size={20} />
                </ThemeIcon>
                <Title order={3}>Crisis Monitor</Title>
              </Group>
              {/* Tabs.List (right/center) - remove grow */}
              <Tabs.List>
                <Tabs.Tab value="view1">Dashboard</Tabs.Tab>
                <Tabs.Tab value="view2">News Articles</Tabs.Tab>
                <Tabs.Tab value="view3">Social Media Posts</Tabs.Tab>
              </Tabs.List>
            </Group>
          </Container>
        </AppShell.Header>

        <AppShell.Main>
          {/* Panels are direct children of the main Tabs component */}
          <Tabs.Panel value="view1" pt="md">
            <View1 />
          </Tabs.Panel>

          <Tabs.Panel value="view2" pt="md">
            <View2 />
          </Tabs.Panel>

          <Tabs.Panel value="view3" pt="md">
            <View3 />
          </Tabs.Panel>
          {/* Remove the Tabs component that was here */}
        </AppShell.Main>
      </AppShell>
    </Tabs>
  );
}
