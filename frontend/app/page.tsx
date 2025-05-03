'use client';

import Link from 'next/link'; // Import NextLink for client-side navigation
import {
  Container,
  Title,
  Stack,
  Card,
  Text,
  Badge,
  Group,
  Anchor,
} from '@mantine/core';

// Mock data for disasters
const disasters = [
  {
    id: 'valencia-flood-1',
    title: 'Flooding in Valencia',
    location: 'Valencia, Spain',
    severity: 'High',
    link: '/valencia', // Link specific to this event
    description: 'Recent heavy rainfall has caused significant flooding in several districts...'
  },
  {
    id: 'california-fire-1',
    title: 'Wildfire near Los Angeles',
    location: 'California, USA',
    severity: 'Medium',
    description: 'A wildfire continues to burn north of the city, containment efforts underway...'
  },
  {
    id: 'japan-quake-1',
    title: 'Earthquake Reported',
    location: 'Offshore, Japan',
    severity: 'Low',
    description: 'Minor earthquake detected offshore, no tsunami warning issued...'
  },
  {
    id: 'italy-heatwave-1',
    title: 'Heatwave Advisory',
    location: 'Southern Italy',
    severity: 'Medium',
    description: 'Extreme temperatures expected to continue through the week...'
  },
];

// Helper function to get badge color based on severity
const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'high': return 'red';
    case 'medium': return 'orange';
    case 'low': return 'green';
    default: return 'gray';
  }
};

export default function HomePage() {

  return (
    <Container size="lg" my="xl">
      <Title order={1} ta="center" mb="xl">
        Event Monitoring
      </Title>

      <Stack gap="lg">
        {disasters.map((disaster) => {
          const cardContent = (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Title order={3}>{disaster.title}</Title>
                <Badge color={getSeverityColor(disaster.severity)} variant="light">
                  {disaster.severity} Severity
                </Badge>
              </Group>

              <Text size="sm" c="dimmed" mb="md">
                {disaster.location}
              </Text>

              <Text size="sm">{disaster.description}</Text>
            </Card>
          );

          // Wrap with Link only if a link is provided
          return disaster.link ? (
            <Link href={disaster.link} key={disaster.id} passHref legacyBehavior>
              <Anchor component="a" style={{ textDecoration: 'none' }}>
                 {cardContent}
              </Anchor>
            </Link>
          ) : (
            <div key={disaster.id}>{cardContent}</div>
          );
        })}
      </Stack>
    </Container>
  );
}