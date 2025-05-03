'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Stack,
  SimpleGrid,
  Loader,
  Alert,
  Group,
  Avatar,
  Image,
  Badge,
  ThemeIcon,
  ActionIcon,
  rem
} from '@mantine/core';
import {
  IconAlertCircle,
  IconBrandTwitter,
  IconBrandFacebook, // Example, add others as needed
  IconPhoto,
  IconThumbUp,
  IconThumbDown,
  IconMapPin,
  IconCalendarEvent,
  IconCheck, // For verified status
  IconTags // For hashtags
} from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns'; // For relative time

// Import the Post type (or define it here if API route isn't TS)
// Assuming the API route exports it, otherwise define inline
// import type { SocialMediaPost } from '../api/social-media-posts/route';

// Define Post type inline for now, ensure it matches API response structure
interface SocialMediaPost {
  _id: string; // Serialized to string
  post_id: string;
  platform: string;
  user: {
    user_id: string;
    username: string;
  };
  timestamp: string; // Serialized to ISO string
  location?: {
    latitude?: number;
    longitude?: number;
  };
  media?: {
    image_url?: string;
    video_url?: string;
  };
  content: {
    text: string;
    hashtags?: string[];
    tags?: string[];
  };
  evaluation?: {
    severity?: string;
    estimated_damage?: string;
  };
  analytics?: {
    sentiment_score?: number;
    verified?: boolean;
    priority?: number;
  };
}

// Helper function to get platform icon
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case 'twitter':
      return <IconBrandTwitter style={{ width: rem(18), height: rem(18) }} />;
    case 'facebook':
      return <IconBrandFacebook style={{ width: rem(18), height: rem(18) }} />;
    // Add other platforms as needed
    default:
      return null; // Or a default icon
  }
};

// Helper function to get severity color
const getSeverityColor = (severity?: string) => {
  switch (severity?.toLowerCase()) {
    case 'high': return 'red';
    case 'medium': return 'orange';
    case 'low': return 'yellow';
    default: return 'gray';
  }
};

export function View3() {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/social-media-posts');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: SocialMediaPost[] = await response.json();
        setPosts(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Loader />
        <Text>Loading social media posts...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert title="Error" color="red" icon={<IconAlertCircle />}>
        {error}
      </Alert>
    );
  }

  if (posts.length === 0) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Text>No social media posts found.</Text>
      </Stack>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {posts.map((post) => (
        <Card key={post._id} shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            {/* Header: Platform, User, Verified, Timestamp */}
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon variant="light" size="lg" radius="xl">
                  <PlatformIcon platform={post.platform} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="sm" fw={500}>{post.user.username}</Text>
                  <Text size="xs" c="dimmed">
                    {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                  </Text>
                </Stack>
              </Group>
              {post.analytics?.verified && (
                <ThemeIcon variant="light" color="teal" size="sm" title="Verified">
                    <IconCheck style={{ width: rem(14), height: rem(14) }}/>
                </ThemeIcon>
              )}
            </Group>

            {/* Content Text */}
            <Text size="sm">{post.content.text}</Text>

            {/* Image */}
            {post.media?.image_url && (
              <Card.Section>
                <Image
                  src={post.media.image_url}
                  height={180}
                  alt={`Image for post ${post.post_id}`}
                  fallbackSrc="/placeholder-image.svg" // Optional: Add a placeholder
                />
              </Card.Section>
            )}

            {/* Footer: Hashtags, Severity, Location? */}
            <Stack gap="xs">
              {post.content.hashtags && post.content.hashtags.length > 0 && (
                <Group gap={4} wrap="wrap">
                  <ThemeIcon variant="subtle" color="gray" size="sm">
                     <IconTags style={{ width: rem(14), height: rem(14) }}/>
                  </ThemeIcon>
                  {post.content.hashtags.map((tag) => (
                    <Badge key={tag} variant="light" size="sm" color="blue">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              )}

              <Group justify="space-between" align="center">
                {post.evaluation?.severity && (
                  <Badge color={getSeverityColor(post.evaluation.severity)} variant="light" size="sm">
                    Severity: {post.evaluation.severity}
                  </Badge>
                )}
                {/* Optional: Add location info or action buttons */}
                {post.location?.latitude && post.location?.longitude && (
                     <ActionIcon variant="subtle" color="gray" title={`Location: ${post.location.latitude}, ${post.location.longitude}`}>
                        <IconMapPin style={{ width: rem(16), height: rem(16) }}/>
                    </ActionIcon>
                )}
              </Group>
            </Stack>

          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
} 