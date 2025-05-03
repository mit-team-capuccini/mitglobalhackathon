'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  rem,
  Paper,
  Center,
  Anchor
} from '@mantine/core';
import {
  IconAlertCircle,
  IconBrandTwitter,
  IconBrandFacebook,
  IconPhoto,
  IconThumbUp,
  IconThumbDown,
  IconMapPin,
  IconCalendarEvent,
  IconCheck,
  IconTags,
  IconMessage,
  IconMoodSmile,
  IconArticle
} from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';

// Import the Post type (or define it here if API route isn't TS)
// Assuming the API route exports it, otherwise define inline
// import type { SocialMediaPost } from '../api/social-media-posts/route';

// Define Post type inline for now, ensure it matches API response structure
interface SocialMediaPost {
  _id: string;
  post_id: string;
  platform: string;
  user: {
    user_id: string;
    username: string;
  };
  timestamp: string | null; // Adjusted for potential null
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

  // --- START: Mock Summary Data Calculation ---
  const summaryData = useMemo(() => {
    const totalPosts = posts.length;
    // Extract all hashtags, flatten, count uniques (Example)
    const allHashtags = posts.flatMap(p => p.content.hashtags || []);
    const uniqueHashtags = [...new Set(allHashtags)];
    // Mock sentiment
    const mockSentiment = 0.45;

    return {
      totalPosts,
      mockSentiment,
      topHashtags: uniqueHashtags.slice(0, 3), // Show top 3
    };
  }, [posts]);
  // --- END: Mock Summary Data Calculation ---

  if (loading) {
    return (
      <Center style={{ height: 400 }}>
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert title="Error" color="red" icon={<IconAlertCircle />}>
        {error}
      </Alert>
    );
  }

  return (
    <Stack>
      <Title order={2} ta="center" mb="lg">Social Media Analysis</Title>

      {/* --- START: Summary Section --- */}
      {posts.length > 0 && (
        <Paper p="md" withBorder radius="md" mb="lg">
          <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }}>
            {/* Total Posts */}
            <Group wrap="nowrap" gap="xs">
              <ThemeIcon size="lg" variant="light" color="teal">
                <IconMessage style={{ width: rem(24), height: rem(24) }} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text fw={500}>{summaryData.totalPosts}</Text>
                <Text size="xs" c="dimmed">Total Posts</Text>
              </Stack>
            </Group>

            {/* Mock Sentiment */}
            <Group wrap="nowrap" gap="xs">
              <ThemeIcon size="lg" variant="light" color={summaryData.mockSentiment > 0.5 ? 'green' : 'orange'}>
                <IconMoodSmile style={{ width: rem(24), height: rem(24) }} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text fw={500}>{`${(summaryData.mockSentiment * 100).toFixed(0)}%`}</Text>
                <Text size="xs" c="dimmed">Avg. Sentiment</Text>
              </Stack>
            </Group>

            {/* Top Hashtags */}
            <Group wrap="nowrap" gap="xs">
              <ThemeIcon size="lg" variant="light" color="indigo">
                <IconTags style={{ width: rem(24), height: rem(24) }} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text fw={500} lineClamp={1}>{summaryData.topHashtags.join(', ') || 'N/A'}</Text>
                <Text size="xs" c="dimmed">Top Hashtags</Text>
              </Stack>
            </Group>
          </SimpleGrid>
        </Paper>
      )}
      {/* --- END: Summary Section --- */}

      {posts.length === 0 && !loading && !error && (
         <Center style={{ height: 200 }}>
           <Text>No social media posts found.</Text>
         </Center>
      )}

      {/* --- START: Post Grid --- */}
      {posts.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {posts.map((post) => (
            <Card key={post._id} shadow="sm" padding="lg" radius="md" withBorder style={{ minHeight: '380px' }}>
              <Stack gap="md" justify="space-between" style={{ height: '100%' }}>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <ThemeIcon variant="light" size="lg" radius="xl">
                        <PlatformIcon platform={post.platform} />
                      </ThemeIcon>
                      <Stack gap={0}>
                        <Text size="sm" fw={500}>{post.user.username}</Text>
                        {post.timestamp && (
                          <Text size="xs" c="dimmed">
                            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                          </Text>
                        )}
                      </Stack>
                    </Group>
                    {post.analytics?.verified && (
                      <ThemeIcon variant="light" color="teal" size="sm" title="Verified">
                          <IconCheck style={{ width: rem(14), height: rem(14) }}/>
                      </ThemeIcon>
                    )}
                  </Group>

                  <Text size="sm" lineClamp={4}>{post.content.text}</Text>
                </Stack>
                
                {post.media?.image_url && (
                  <Card.Section my="sm">
                    <Image
                      src={post.media.image_url}
                      height={160}
                      fit="cover"
                      alt={`Image for post ${post.post_id}`}
                      fallbackSrc="/placeholder-image.svg"
                    />
                  </Card.Section>
                )}

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
      )}
      {/* --- END: Post Grid --- */}
    </Stack>
  );
} 