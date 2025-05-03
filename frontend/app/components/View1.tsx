'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Grid,
  Card,
  Stack,
  Text,
  Title,
  ThemeIcon,
  Skeleton,
  Group,
  rem,
  Divider,
  Badge,
  Paper,
  SimpleGrid,
  ScrollArea,
  Button as MantineButton,
  Center,
  Loader,
  Modal,
  TextInput
} from '@mantine/core';
import { LineChart, DonutChart, BarChart } from '@mantine/charts';
import {
  IconMapPin,
  IconUsers,
  IconBuildingBridge,
  IconUsersGroup,
  IconAlertTriangle,
  IconChartLine,
  IconChartDonut,
  IconRoadOff,
  IconDownload
} from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import { useDisclosure } from '@mantine/hooks';

// Import the new components
import { GoogleMapCard } from './GoogleMapCard';
import { SettingsCard } from './SettingsCard';
// Import service function and types
import {
  getMunicipalitySummary,
  MunicipalitySummary
} from '../services/mapDataService';

// Import types used in GoogleMapCard
import type { InfrastructurePlace, RoadClosure, ReservoirLevel } from './GoogleMapCard';

// Import Social Media Post Type (same as in View3)
interface SocialMediaPost {
  _id: string;
  post_id: string;
  platform: string;
  user: {
    user_id: string;
    username: string;
  };
  timestamp: string | null; // Can be null due to API error handling
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

// START: Define Article Type (matching View2 fetch)
interface Article {
  url: string;
  title: string;
  date: string; // Assuming date is string from API
  translated_title?: string;
}
// END: Define Article Type

// Removed unused GeoJsonFeature type
// type GeoJsonFeature = any; 

// Mock Data for Charts
const mockReservoirTrendData = [
  { date: 'Nov 01', Level: 35.2 },
  { date: 'Nov 03', Level: 38.1 },
  { date: 'Nov 05', Level: 41.5 },
  { date: 'Nov 07', Level: 43.0 },
  { date: 'Nov 09', Level: 43.5 },
  { date: 'Nov 11', Level: 42.8 },
  { date: 'Nov 13', Level: 40.1 },
];

const mockInfraStatusData = [
  { name: 'Operational', value: 18, color: 'green.6' },
  { name: 'Damaged', value: 5, color: 'orange.6' },
  { name: 'Offline', value: 2, color: 'red.6' },
];

// --- START: New Mock Data ---
const mockRoadClosureTypesData = [
  { name: 'Construction', value: 1, color: 'orange.6' },
  { name: 'Event', value: 1, color: 'blue.6' },
  // { name: 'Accident', value: 0, color: 'red.6' }, // Example if needed
];

const mockAlertsTrendData = [
  { date: 'Nov 09', Alerts: 1 },
  { date: 'Nov 10', Alerts: 3 },
  { date: 'Nov 11', Alerts: 2 },
  { date: 'Nov 12', Alerts: 5 },
  { date: 'Nov 13', Alerts: 2 },
  { date: 'Nov 14', Alerts: 1 },
  { date: 'Nov 15', Alerts: 2 },
];
// --- END: New Mock Data ---

export function View1() {
  // --- Layer Toggle State --- 
  const [showDensity, setShowDensity] = useState(true);
  const [showInfrastructurePins, setShowInfrastructurePins] = useState(true);
  const [showRoadClosures, setShowRoadClosures] = useState(true);
  const [showReservoirHeatmap, setShowReservoirHeatmap] = useState(true);
  const [showBrokenBuilding, setShowBrokenBuilding] = useState(false);
  const [showSocialMediaPins, setShowSocialMediaPins] = useState(false);

  // --- Map View State --- 
  const mapCenter = { lat: 39.4699, lng: -0.3763 };
  const mapZoom = 12;

  // --- Fetched Data State (Lifted from GoogleMapCard) ---
  const [municipalitySummary, setMunicipalitySummary] = useState<MunicipalitySummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [infrastructurePlaces, setInfrastructurePlaces] = useState<InfrastructurePlace[]>([]);
  const [infraLoading, setInfraLoading] = useState(false);
  const [infraError, setInfraError] = useState<string | null>(null);
  const [roadClosures, setRoadClosures] = useState<RoadClosure[]>([]);
  const [roadClosureLoading, setRoadClosureLoading] = useState(false);
  const [roadClosureError, setRoadClosureError] = useState<string | null>(null);
  const [reservoirLevels, setReservoirLevels] = useState<ReservoirLevel[]>([]);
  const [reservoirLoading, setReservoirLoading] = useState(false);
  const [reservoirError, setReservoirError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [socialMediaPostsData, setSocialMediaPostsData] = useState<SocialMediaPost[]>([]);

  // --- Static/Mock Data State --- 
  const [mockTouristEstimate] = useState(15000);
  const [mockInfraStatus] = useState("Partially Degraded");
  const [mockAffectedPopulation] = useState(45000);
  const [mockAlerts] = useState<string[]>([
      "Flood warning for Turia river extended.",
      "Power outages reported in El Carmen district."
  ]);

  // --- Report State --- 
  const [reportContent, setReportContent] = useState<string>("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);

  // --- START: Specific Request Modal State ---
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [requestText, setRequestText] = useState('');
  const [specificRequestSubmitted, setSpecificRequestSubmitted] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  // --- END: Specific Request Modal State ---

  // --- Toggle Handlers --- 
  const toggleDensity = useCallback(() => setShowDensity((v) => !v), []);
  const toggleInfrastructurePins = useCallback(() => setShowInfrastructurePins((v) => !v), []);
  const toggleRoadClosures = useCallback(() => setShowRoadClosures((v) => !v), []);
  const toggleReservoirHeatmap = useCallback(() => setShowReservoirHeatmap((v) => !v), []);
  const toggleBrokenBuilding = useCallback(() => setShowBrokenBuilding((v) => !v), []);
  const toggleSocialMediaPins = useCallback(() => setShowSocialMediaPins((v) => !v), []);

  // --- Map Interaction Handlers (Refined types) --- 
  const handleBoundsChanged: (bounds: google.maps.LatLngBounds | null) => void = useCallback((bounds) => {
    if (!bounds) return;
    console.log('Bounds changed:', bounds.toJSON()); 
  }, []);

  const handleMapClick: (point: { lat: number; lng: number }) => void = useCallback((point) => {
    console.log('Map clicked:', point);
  }, []);

  // --- Data Fetching Effects --- 
  // Fetch Municipality Summary
  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const data = await getMunicipalitySummary('Valencia');
        setMunicipalitySummary(data);
      } catch (error) {
        console.error("Error fetching municipality summary:", error);
        setMunicipalitySummary(null);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
    // Fetch static heatmap data (example)
    // setHeatmapData(getDemoHeatmapData());
  }, []);

  // Fetch Infrastructure Places
  useEffect(() => {
    if (!showInfrastructurePins) {
      setInfrastructurePlaces([]);
      return;
    }
    setInfraLoading(true);
    setInfraError(null);
    fetch('/api/places')
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`Fetch failed: ${res.statusText}`))) 
      .then(data => setInfrastructurePlaces(data || [])) 
      .catch((err: Error) => setInfraError(err.message || 'Could not load infrastructure data.'))
      .finally(() => setInfraLoading(false));
  }, [showInfrastructurePins]);

  // Fetch Road Closures
  useEffect(() => {
    if (!showRoadClosures) {
      setRoadClosures([]);
      return;
    }
    setRoadClosureLoading(true);
    setRoadClosureError(null);
    fetch('/api/road-closures')
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`Fetch failed: ${res.statusText}`))) 
      .then(data => setRoadClosures(data || []))
      .catch((err: Error) => setRoadClosureError(err.message || 'Could not load road closure data.'))
      .finally(() => setRoadClosureLoading(false));
  }, [showRoadClosures]);

  // Fetch Reservoir Levels
  useEffect(() => {
    if (!showReservoirHeatmap) {
      setReservoirLevels([]);
      return;
    }
    setReservoirLoading(true);
    setReservoirError(null);
    fetch('/api/reservoir-levels')
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`Fetch failed: ${res.statusText}`))) 
      .then(data => setReservoirLevels(data || []))
      .catch((err: Error) => setReservoirError(err.message || 'Could not load reservoir level data.'))
      .finally(() => setReservoirLoading(false));
  }, [showReservoirHeatmap]);

  // Fetch Articles
  useEffect(() => {
    setArticlesLoading(true);
    setArticlesError(null);
    fetch('/api/articles')
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`Fetch failed: ${res.statusText}`)))
      .then(data => setArticles(data || []))
      .catch((err: Error) => setArticlesError(err.message || 'Could not load articles.'))
      .finally(() => setArticlesLoading(false));
  }, []);

  // Fetch Social Media Posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/social-media-posts');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: SocialMediaPost[] = await response.json();
        setSocialMediaPostsData(data);
      } catch (err) {
        console.error("Fetch social media error in View1:", err);
      }
    };
    fetchPosts();
  }, []);

  // --- New Report Generation Handler --- 
  const handleGenerateReport = useCallback(async () => {
    setReportGenerated(true);
    setReportLoading(true);
    setReportError(null);
    setReportContent("");

    await new Promise(resolve => setTimeout(resolve, 3000)); 

    try {
      const res = await fetch('/api/generate-report');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Fetch failed: ${res.statusText}`);
      }
      const data = await res.json();
      setReportContent(data.report || "");
    } catch (err: unknown) {
      console.error("Report fetch error:", err);
      setReportError(err instanceof Error ? err.message : 'Could not load report.');
      setReportGenerated(false);
    } finally {
      setReportLoading(false);
    }
  }, []);

  // --- START: Specific Request Submit Handler ---
  const handleSubmitRequest = useCallback(() => {
    setIsSubmittingRequest(true);

    setTimeout(() => {
      console.log("Submitted request:", requestText);
      setSpecificRequestSubmitted(true);
      setRequestText('');
      setIsSubmittingRequest(false);
      closeModal();
    }, 5000);

  }, [requestText, closeModal]);
  // --- END: Specific Request Submit Handler ---

  // --- Event Details --- 
  const eventTitle = "Valencia Flooding";
  const eventSeverity = "High";
  const eventDescription = "Severe flooding following heavy rainfall impacts multiple districts. Road closures, infrastructure damage, and high reservoir levels reported.";

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
        case 'high': return 'red';
        case 'medium': return 'orange';
        case 'low': return 'yellow';
        default: return 'gray';
    }
  };

 // --- Placeholder Download Function --- 
  const handleDownloadPdf = () => {
    console.log("Simulating PDF download...");
    alert("PDF download simulation (check console).");
  };

  return (
    <Grid gutter="md">
      {/* Left Column (Map + Settings + Charts) */} 
      <Grid.Col span={{ base: 12, md: 8, lg: 9 }}> 
        <Stack gap="md">
           {/* --- START: Event Title Area --- */} 
           <Group justify="space-between" align="flex-start">
                <Stack gap={0}>
                    <Title order={2}>{eventTitle}</Title>
                    <Text size="sm" c="dimmed" maw={500}>{eventDescription}</Text>
                </Stack>
                <Stack gap={2} align="flex-end"> {/* Wrap Badge and Scores */} 
                    <Badge color={getSeverityColor(eventSeverity)} size="lg" variant="light">
                        Severity: {eventSeverity}
                    </Badge>
                    {/* START: Added Scores */} 
                    <Text size="xs" c="dimmed">Severity Score: 86%</Text>
                    <Text size="xs" c="dimmed">Data Coverage: 86%</Text>
                    {/* END: Added Scores */} 
                </Stack>
           </Group>
           <Divider />
           {/* --- END: Event Title Area --- */} 

          <GoogleMapCard
            showDensity={showDensity}
            showHeatmap={showBrokenBuilding}
            showInfrastructurePins={showInfrastructurePins}
            showRoadClosures={showRoadClosures}
            showReservoirHeatmap={showReservoirHeatmap}
            showSocialMediaPins={showSocialMediaPins}
            socialMediaPosts={socialMediaPostsData}
            center={mapCenter}
            zoom={mapZoom}
            infrastructurePlaces={infrastructurePlaces}
            infraLoading={infraLoading}
            infraError={infraError}
            roadClosures={roadClosures}
            roadClosureLoading={roadClosureLoading}
            roadClosureError={roadClosureError}
            reservoirLevels={reservoirLevels}
            reservoirLoading={reservoirLoading}
            reservoirError={reservoirError}
            onBoundsChanged={handleBoundsChanged}
            onMapClick={handleMapClick}
          />
          <SettingsCard
            showDensity={showDensity}
            showInfrastructurePins={showInfrastructurePins}
            showRoadClosures={showRoadClosures}
            showReservoirHeatmap={showReservoirHeatmap}
            showSocialMediaPins={showSocialMediaPins}
            onToggleDensity={toggleDensity}
            onToggleInfrastructurePins={toggleInfrastructurePins}
            onToggleRoadClosures={toggleRoadClosures}
            onToggleReservoirHeatmap={toggleReservoirHeatmap}
            onToggleSocialMediaPins={toggleSocialMediaPins}
            onOpenSpecificRequestModal={openModal}
            specificRequestSubmitted={specificRequestSubmitted}
            showBrokenBuilding={showBrokenBuilding}
            onToggleBrokenBuilding={toggleBrokenBuilding}
          />

          {/* --- START: Charts Area --- */} 
          <Title order={4} mt="md">Analytics</Title> 
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            
            <Card shadow="sm" padding="lg" radius="md">
              <Stack gap="xs">
                 <Group gap="xs">
                    <ThemeIcon variant="light" color="blue" size="sm">
                       <IconChartLine size={14} />
                    </ThemeIcon>
                     <Title order={5}>Reservoir Level Trend</Title>
                  </Group>
                  <LineChart
                    h={150}
                    data={mockReservoirTrendData}
                    dataKey="date"
                    series={[{ name: 'Level', color: 'blue.6' }]}
                    curveType="monotone"
                    withXAxis={false}
                    withYAxis={true}
                    yAxisProps={{ width: 30 }}
                    connectNulls
                    tooltipProps={{
                      content: (props) => {
                        if (!props || !Array.isArray(props.payload) || props.payload.length === 0) return null;
                        const { label, payload } = props as { label?: string; payload?: Array<{ name: string; value: number; color: string }> };
                        return (
                          <Paper px="md" py="sm" withBorder shadow="md" radius="md">
                            <Text fw={500} mb={5}>{label}</Text>
                            {payload?.map((item) => (
                              <Text key={item.name} c={item.color} fz="sm">
                                  {item.name}: {item.value}
                              </Text>
                            ))}
                        </Paper>
                        );
                      }
                    }}
                  />
              </Stack>
            </Card>

            <Card shadow="sm" padding="lg" radius="md">
               <Stack gap="xs">
                 <Group gap="xs">
                     <ThemeIcon variant="light" color="teal" size="sm">
                        <IconChartDonut size={14} />
                     </ThemeIcon>
                     <Title order={5}>Infrastructure Status</Title>
                  </Group>
                  <DonutChart
                      h={170}
                      data={mockInfraStatusData}
                      chartLabel={`${mockInfraStatusData.reduce((acc, item) => acc + item.value, 0)} Total`}
                      tooltipDataSource="segment"
                   />
               </Stack>
            </Card>

            <Card shadow="sm" padding="lg" radius="md">
             <Stack gap="xs">
               <Group gap="xs">
                   <ThemeIcon variant="light" color="orange" size="sm">
                      <IconRoadOff size={14} />
                   </ThemeIcon>
                   <Title order={5}>Road Closure Reasons</Title>
                </Group>
                <BarChart
                    h={170}
                    data={mockRoadClosureTypesData}
                    dataKey="name"
                    type="stacked"
                    orientation="vertical"
                    series={[{ name: 'value', color: 'orange.6' }]}
                    withXAxis={false}
                    tooltipProps={{
                       content: (props) => {
                          if (!props || !Array.isArray(props.payload) || props.payload.length === 0) return null;
                          const { label, payload } = props as { label?: string; payload?: Array<{ name: string; value: number; color: string }> };
                          return (
                            <Paper px="md" py="sm" withBorder shadow="md" radius="md">
                              <Text fw={500} mb={5}>{label}</Text>
                              {payload?.map((item) => (
                                <Text key={item.name} c={item.color} fz="sm">
                                  Count: {item.value}
                                </Text>
                              ))}
                          </Paper>
                          );
                        }
                    }}
                 />
             </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md">
            <Stack gap="xs">
               <Group gap="xs">
                  <ThemeIcon variant="light" color="red" size="sm">
                     <IconAlertTriangle size={14} />
                  </ThemeIcon>
                   <Title order={5}>Daily Alert Count</Title>
                </Group>
                <LineChart
                  h={150}
                  data={mockAlertsTrendData}
                  dataKey="date"
                  series={[{ name: 'Alerts', color: 'red.6' }]}
                  curveType="step"
                  withXAxis={false}
                  withYAxis={true}
                  yAxisProps={{ width: 30, domain: [0, 'auto'] }}
                  tooltipProps={{
                    content: (props) => {
                      if (!props || !Array.isArray(props.payload) || props.payload.length === 0) return null;
                      const { label, payload } = props as { label?: string; payload?: Array<{ name: string; value: number; color: string }> };
                      return (
                        <Paper px="md" py="sm" withBorder shadow="md" radius="md">
                          <Text fw={500} mb={5}>{label}</Text>
                          {payload?.map((item) => (
                            <Text key={item.name} c={item.color} fz="sm">
                                {item.name}: {item.value}
                            </Text>
                          ))}
                      </Paper>
                      );
                    }
                  }}
                />
            </Stack>
          </Card>

          </SimpleGrid>
          {/* --- END: Charts Area --- */} 

        </Stack>
      </Grid.Col>

      {/* Right Column (Sidebar) */} 
      <Grid.Col span={{ base: 12, md: 4, lg: 3 }}> 
        <Stack gap="md">
          {/* Overview Card */} 
          <Card shadow="sm" padding="lg" radius="md">
            <Stack gap="xs">
              <Title order={4} mb="sm">Overview</Title>
              {loadingSummary ? (
                <Skeleton height={10} mt={4} radius="xl" width="70%" />
              ) : municipalitySummary ? (
                <Group gap="xs">
                  <ThemeIcon size="sm" variant="light" color="gray">
                    <IconMapPin style={{ width: rem(14), height: rem(14) }} />
                  </ThemeIcon>
                  <Text size="sm">{municipalitySummary.municipal}</Text>
                </Group>
              ) : (
                <Text size="sm" c="dimmed">Municipality data unavailable.</Text>
              )}
              {loadingSummary ? (
                  <Skeleton height={10} mt={4} radius="xl" width="60%" />
              ) : municipalitySummary?.population ? (
                <Group gap="xs">
                  <ThemeIcon size="sm" variant="light" color="gray">
                    <IconUsers style={{ width: rem(14), height: rem(14) }} />
                  </ThemeIcon>
                  <Text size="sm">Total Pop: {municipalitySummary.population.toLocaleString()}</Text>
                </Group>
               ) : null}
               <Group gap="xs">
                 <ThemeIcon size="sm" variant="light" color="gray">
                    <IconUsers style={{ width: rem(14), height: rem(14) }} />
                  </ThemeIcon>
                <Text size="sm">Est. Affected Pop: {mockAffectedPopulation.toLocaleString()}</Text>
              </Group>
              <Group gap="xs">
                 <ThemeIcon size="sm" variant="light" color="gray">
                    <IconUsersGroup style={{ width: rem(14), height: rem(14) }} />
                  </ThemeIcon>
                <Text size="sm">Est. Tourists Impacted: {mockTouristEstimate.toLocaleString()}</Text>
              </Group>
               <Group gap="xs">
                 <ThemeIcon size="sm" variant="light" color={mockInfraStatus === "Operational" ? "green" : "orange"}> 
                    <IconBuildingBridge style={{ width: rem(14), height: rem(14) }} />
                  </ThemeIcon>
                <Text size="sm">Infrastructure: {mockInfraStatus}</Text>
              </Group>
            </Stack>
          </Card>

          {/* Data Summary Card */} 
          <Card shadow="sm" padding="lg" radius="md">
            <Stack gap="xs">
              <Title order={5} mb="xs">Data Points</Title>
              <Group justify="space-between">
                <Text size="sm">Infrastructure:</Text>
                <Badge color="gray" variant="light">{infraLoading ? '...' : infraError ? 'Err' : infrastructurePlaces.length}</Badge>
              </Group>
               <Group justify="space-between">
                <Text size="sm">Road Closures:</Text>
                <Badge color="gray" variant="light">{roadClosureLoading ? '...' : roadClosureError ? 'Err' : roadClosures.length}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Reservoirs:</Text>
                 <Badge color="gray" variant="light">{reservoirLoading ? '...' : reservoirError ? 'Err' : reservoirLevels.length}</Badge>
              </Group>
               <Group justify="space-between">
                <Text size="sm">News Articles:</Text>
                 <Badge color="gray" variant="light">{articlesLoading ? '...' : articlesError ? 'Err' : articles.length}</Badge>
              </Group>
            </Stack>
          </Card>

          {/* Alerts Card */} 
           <Card shadow="sm" padding="lg" radius="md">
            <Stack gap="xs">
              <Title order={5} mb="xs">Active Alerts</Title>
              {mockAlerts.length > 0 ? (
                  mockAlerts.map((alert, index) => (
                    <Group key={index} gap="xs" wrap="nowrap">
                      <ThemeIcon size="sm" variant="light" color="orange">
                        <IconAlertTriangle style={{ width: rem(14), height: rem(14) }} />
                      </ThemeIcon>
                      <Text size="xs">{alert}</Text>
                    </Group>
                  ))
              ) : (
                  <Text size="sm" c="dimmed">No active alerts.</Text>
              )}
            </Stack>
          </Card>

          {/* Generated Report Card */} 
          <Card shadow="sm" padding="lg" radius="md">
             <Stack gap="sm">
               <Group justify="space-between">
                 <Title order={5}>Report</Title>
                 {reportGenerated && !reportLoading && !reportError && reportContent && (
                   <MantineButton
                     variant="light"
                     size="xs"
                     color="gray"
                     onClick={handleDownloadPdf}
                     leftSection={<IconDownload size={14} />}
                   >
                     Download
                   </MantineButton>
                 )}
               </Group>
               <Divider />

               {!reportGenerated && !reportLoading ? (
                 <Center>
                   <MantineButton onClick={handleGenerateReport}>Generate Report</MantineButton>
                 </Center>
               ) : reportLoading ? (
                 <Center h={250}>
                   <Loader size="sm" />
                 </Center>
               ) : reportError ? (
                 <Stack align="center" h={250} justify="center">
                   <Text c="red" size="sm">Error: {reportError}</Text>
                   <MantineButton onClick={handleGenerateReport} variant="light" size="xs">Retry</MantineButton>
                 </Stack>
               ) : (
                 <ScrollArea h={250}>
                   <div className="report-markdown">
                     <ReactMarkdown
                       components={{
                       }}
                     >
                       {reportContent}
                     </ReactMarkdown>
                   </div>
                 </ScrollArea>
               )}

             </Stack>
           </Card>
          
        </Stack>
      </Grid.Col>

      {/* --- START: Specific Request Modal --- */}
      <Modal opened={modalOpened} onClose={closeModal} title="Make a Specific Request">
        <Stack>
          <TextInput
            label="Your Request"
            placeholder="e.g., Check status of bridges over Turia"
            value={requestText}
            onChange={(event) => setRequestText(event.currentTarget.value)}
          />
          <Group justify="flex-end">
             <MantineButton 
               onClick={closeModal} 
               variant="default" 
              >
                Cancel
              </MantineButton>
             <MantineButton 
               onClick={handleSubmitRequest} 
               disabled={!requestText.trim() || isSubmittingRequest}
               loading={isSubmittingRequest}
              >
               Submit
              </MantineButton>
          </Group>
        </Stack>
      </Modal>
      {/* --- END: Specific Request Modal --- */}

    </Grid>
  );
}

// Optional: Add some basic CSS for markdown rendering if needed
// e.g., in a global CSS file or using Mantine's Styles API
/*
.report-markdown p {
  margin-bottom: 0.5rem;
  font-size: var(--mantine-font-size-sm); 
}
.report-markdown ul {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}
*/ 