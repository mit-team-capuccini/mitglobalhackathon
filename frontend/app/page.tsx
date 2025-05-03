'use client';

import {
  AppShell,
  Tabs,
  Container,
} from '@mantine/core';
// Remove imports that are now in View1.tsx
// Keep AppShell, Tabs, Container

// Import the new view components
import { View1 } from './components/View1';
import { View2 } from './components/View2';
import { View3 } from './components/View3';

export default function HomePage() {
  return (
    // Wrap AppShell with Tabs
    <Tabs defaultValue="view1">
      <AppShell header={{ height: 60 }} padding="md" px="md">
        <AppShell.Header>
          <Container fluid h="100%">
            {/* Tabs.List remains here, but the parent Tabs is now outside AppShell */}
            <Tabs.List grow h="100%">
              <Tabs.Tab value="view1">View 1</Tabs.Tab>
              <Tabs.Tab value="view2">View 2</Tabs.Tab>
              <Tabs.Tab value="view3">View 3</Tabs.Tab>
            </Tabs.List>
            {/* Remove the Tabs component that was here */}
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
