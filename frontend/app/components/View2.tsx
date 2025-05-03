'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Stack,
  SimpleGrid,
  Loader,
  Center,
  Anchor,
  Badge,
  Group,
  Avatar,
  rem
} from '@mantine/core';

interface Article {
  url: string;
  title: string;
  date: string;
  translated_title?: string;
}

function formatDate(dateString: string): string {
  if (!dateString || dateString.length < 8) return 'Invalid Date';
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  return `${year}-${month}-${day}`;
}

function getFaviconUrl(articleUrl: string): string {
  try {
    const url = new URL(articleUrl);
    const domain = url.hostname;
    // Use Google's S2 service for favicons (adjust size 'sz' if needed)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (e) {
    console.error("Error parsing URL for favicon:", articleUrl, e);
    return ''; // Return empty string or a default favicon URL
  }
}

export function View2() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/articles')
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.error || `Failed to fetch articles: ${res.statusText}`);
          });
        }
        return res.json();
      })
      .then((data: Article[]) => {
        setArticles(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch articles error:", err);
        setError(err.message || 'Could not load articles.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Center style={{ height: 400 }}>
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Center style={{ height: 400 }}>
        <Text color="red">Error loading articles: {error}</Text>
      </Center>
    );
  }

  if (articles.length === 0) {
    return (
      <Center style={{ height: 400 }}>
        <Text>No articles found.</Text>
      </Center>
    );
  }

  return (
    <Stack>
      <Title order={2} ta="center" mb="lg">News Articles</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {articles.map((article, index) => (
          <Anchor href={article.url} target="_blank" rel="noopener noreferrer" key={article.url + index} style={{ textDecoration: 'none' }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: '100%' }}>
              <Stack justify="space-between" style={{ height: '100%' }}>
                <Stack gap="xs">
                  <Text fw={500} size="sm" lineClamp={3}>
                    {article.translated_title || article.title}
                  </Text>
                </Stack>
                <Group justify="space-between" mt="sm">
                  <Avatar src={getFaviconUrl(article.url)} size={rem(20)} radius="sm" />
                  <Badge color="gray" variant="light" size="xs">
                    {formatDate(article.date)}
                  </Badge>
                </Group>
              </Stack>
            </Card>
          </Anchor>
        ))}
      </SimpleGrid>
    </Stack>
  );
} 