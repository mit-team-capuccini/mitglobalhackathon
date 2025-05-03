'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Grid,
  Card,
  Stack,
  Text,
  List,
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
  Button,
  Center,
  Loader
} from '@mantine/core';
import { LineChart, DonutChart, BarChart } from '@mantine/charts';
import {
  IconCircleCheck,
  IconMapPin,
  IconUsers,
  IconRulerMeasure,
  IconBuildingBridge,
  IconRoad,
  IconDroplet,
  IconInfoCircle,
  IconChartBar,
  IconUsersGroup,
  IconAlertTriangle,
  IconArticle,
  IconChartLine,
  IconChartDonut,
  IconRoadOff,
  IconDownload
} from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';

// Import the new components
import { GoogleMapCard } from './GoogleMapCard';
import { SettingsCard } from './SettingsCard';
// Import service function and types
import {
  getMunicipalitySummary,
  MunicipalitySummary,
  getDemoHeatmapData
} from '../services/mapDataService';

// Import types used in GoogleMapCard (now needed here)
import type { InfrastructurePlace, RoadClosure, ReservoirLevel } from './GoogleMapCard';

// Placeholder types - adjust if you have proper types
type GeoJsonFeature = any;
type MapData = any;

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
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showInfrastructurePins, setShowInfrastructurePins] = useState(true);
  const [showRoadClosures, setShowRoadClosures] = useState(true);
  const [showReservoirHeatmap, setShowReservoirHeatmap] = useState(true);

  // --- Map View State --- 
  const [mapCenter, setMapCenter] = useState({ lat: 39.4699, lng: -0.3763 });
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedMunicipality, setSelectedMunicipality] = useState<GeoJsonFeature | null>(null);

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
  const [articles, setArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  // --- Static/Mock Data State --- 
  const [heatmapData, setHeatmapData] = useState<MapData>([]); // Static heatmap data
  const [polygonData, setPolygonData] = useState<GeoJsonFeature[]>([]); // Static polygon data
  const [mockTouristEstimate] = useState(15000); // Adjusted mock data
  const [mockInfraStatus] = useState("Partially Degraded"); // Adjusted mock data
  const [mockAffectedPopulation] = useState(45000); // New mock data
  const [mockAlerts] = useState<string[]>([
      "Flood warning for Turia river extended.",
      "Power outages reported in El Carmen district."
  ]); // Example mock data

  // --- START: Report State --- 
  const [reportContent, setReportContent] = useState<string>("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  // --- END: Report State --- 

  // --- Toggle Handlers --- 
  const toggleDensity = useCallback(() => setShowDensity((v) => !v), []);
  const toggleHeatmap = useCallback(() => setShowHeatmap((v) => !v), []);
  const toggleInfrastructurePins = useCallback(() => setShowInfrastructurePins((v) => !v), []);
  const toggleRoadClosures = useCallback(() => setShowRoadClosures((v) => !v), []);
  const toggleReservoirHeatmap = useCallback(() => setShowReservoirHeatmap((v) => !v), []);

  // --- Map Interaction Handlers --- 
  const handleBoundsChanged = useCallback((bounds: any) => {
    console.log('Bounds changed:', bounds);
    // Update map center/zoom based on interaction
    // setMapCenter({ lat: bounds.centerLat, lng: bounds.centerLng });
    // setMapZoom(bounds.zoom);
  }, []);

  const handleMapClick = useCallback((point: { lat: number; lng: number }) => {
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
    setHeatmapData(getDemoHeatmapData());
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
      .catch(err => setInfraError(err.message || 'Could not load infrastructure data.'))
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
      .catch(err => setRoadClosureError(err.message || 'Could not load road closure data.'))
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
      .catch(err => setReservoirError(err.message || 'Could not load reservoir level data.'))
      .finally(() => setReservoirLoading(false));
  }, [showReservoirHeatmap]);

  // Fetch Articles
  useEffect(() => {
    setArticlesLoading(true);
    setArticlesError(null);
    fetch('/api/articles')
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`Fetch failed: ${res.statusText}`)))
      .then(data => setArticles(data || []))
      .catch(err => setArticlesError(err.message || 'Could not load articles.'))
      .finally(() => setArticlesLoading(false));
  }, []); // Fetch articles once on mount

  // --- START: Fetch Generated Report --- 
  /*
  useEffect(() => {
    setReportLoading(true);
    setReportError(null);
    fetch('/api/generate-report')
      .then(res => {
        if (!res.ok) { 
          return res.json().then(err => { throw new Error(err.error || `Fetch failed: ${res.statusText}`) });
        }
        return res.json();
      })
      .then(data => {
        setReportContent(data.report || "");
      })
      .catch(err => {
        console.error("Report fetch error:", err);
        setReportError(err.message || 'Could not load report.');
        setReportContent("");
      })
      .finally(() => setReportLoading(false));
  }, []); // Fetch report once on mount
  */
  // --- END: Fetch Generated Report --- 

  // --- START: New Report Generation Handler --- 
  const handleGenerateReport = useCallback(async () => {
    setReportGenerated(true); // Mark generation as started
    setReportLoading(true);
    setReportError(null);
    setReportContent(""); // Clear previous report/error

    // Simulate initial loading delay
    await new Promise(resolve => setTimeout(resolve, 3000)); 

    try {
      const res = await fetch('/api/generate-report');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Fetch failed: ${res.statusText}`);
      }
      const data = await res.json();
      setReportContent(data.report || "");
    } catch (err: any) {
      console.error("Report fetch error:", err);
      setReportError(err.message || 'Could not load report.');
      setReportGenerated(false); // Allow retry on error
    } finally {
      setReportLoading(false);
    }
  }, []); // No dependencies, safe to use useCallback
  // --- END: New Report Generation Handler --- 

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

  // --- REMOVED: Mock Report & Download Logic (now fetched) --- 
  /*
  const mockReportText = ...;
  const handleDownloadPdf = () => { ... };
  */
 // --- START: Placeholder Download Function (still needed) --- 
  const handleDownloadPdf = () => {
    console.log("Simulating PDF download...");
    // In a real app, trigger download using `reportContent`
    alert("PDF download simulation (check console).");
  };
 // --- END: Placeholder Download Function --- 

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
            showHeatmap={showHeatmap}
            showInfrastructurePins={showInfrastructurePins}
            showRoadClosures={showRoadClosures}
            showReservoirHeatmap={showReservoirHeatmap}
            center={mapCenter}
            zoom={mapZoom}
            // Pass fetched data and states down
            heatmapData={heatmapData}
            polygonData={polygonData}
            infrastructurePlaces={infrastructurePlaces}
            infraLoading={infraLoading}
            infraError={infraError}
            roadClosures={roadClosures}
            roadClosureLoading={roadClosureLoading}
            roadClosureError={roadClosureError}
            reservoirLevels={reservoirLevels}
            reservoirLoading={reservoirLoading}
            reservoirError={reservoirError}
            // Pass article data if needed by map later
            // articles={articles}
            // articlesLoading={articlesLoading}
            // articlesError={articlesError}
            // Callbacks
            onBoundsChanged={handleBoundsChanged}
            onMapClick={handleMapClick}
            selectedMunicipality={selectedMunicipality}
          />
          <SettingsCard
            showDensity={showDensity}
            showHeatmap={showHeatmap}
            showInfrastructurePins={showInfrastructurePins}
            showRoadClosures={showRoadClosures}
            showReservoirHeatmap={showReservoirHeatmap}
            onToggleDensity={toggleDensity}
            onToggleHeatmap={toggleHeatmap}
            onToggleInfrastructurePins={toggleInfrastructurePins}
            onToggleRoadClosures={toggleRoadClosures}
            onToggleReservoirHeatmap={toggleReservoirHeatmap}
          />

          {/* --- START: Charts Area --- */} 
          <Title order={4} mt="md">Analytics</Title> 
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md"> {/* Grid for charts */} 
            
            {/* Reservoir Trend Chart (Moved) */} 
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
                      content: ({ label, payload }) => (
                        <Paper px="md" py="sm" withBorder shadow="md" radius="md">
                          <Text fw={500} mb={5}>{label}</Text>
                          {payload?.map((item: any) => (
                             <Text key={item.name} c={item.color} fz="sm">
                                {item.name}: {item.value}
                             </Text>
                          ))}
                       </Paper>
                      ),
                    }}
                  />
              </Stack>
            </Card>

            {/* Infrastructure Status Chart (Moved) */} 
             <Card shadow="sm" padding="lg" radius="md">
               <Stack gap="xs">
                 <Group gap="xs">
                     <ThemeIcon variant="light" color="teal" size="sm">
                        <IconChartDonut size={14} />
                     </ThemeIcon>
                     <Title order={5}>Infrastructure Status</Title>
                  </Group>
                  <DonutChart
                      h={170} // Slightly taller for donut
                      data={mockInfraStatusData}
                      chartLabel={`${mockInfraStatusData.reduce((acc, item) => acc + item.value, 0)} Total`}
                      tooltipDataSource="segment"
                   />
               </Stack>
            </Card>

            {/* NEW: Road Closure Types Chart */} 
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
                    series={[{ name: 'value', color: 'orange.6' }]} // Use a single series for simple count
                    withXAxis={false}
                    tooltipProps={{
                       content: ({ label, payload }) => (
                         <Paper px="md" py="sm" withBorder shadow="md" radius="md">
                           <Text fw={500} mb={5}>{label}</Text>
                           {payload?.map((item: any) => (
                              <Text key={item.name} c={item.color} fz="sm">
                                 Count: {item.value}
                              </Text>
                           ))}
                        </Paper>
                       ),
                    }}
                 />
             </Stack>
          </Card>

          {/* NEW: Alert Trend Chart */} 
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
                  yAxisProps={{ width: 30, domain: [0, 'auto'] }} // Ensure y-axis starts at 0
                  tooltipProps={{
                    content: ({ label, payload }) => (
                      <Paper px="md" py="sm" withBorder shadow="md" radius="md">
                        <Text fw={500} mb={5}>{label}</Text>
                        {payload?.map((item: any) => (
                           <Text key={item.name} c={item.color} fz="sm">
                              {item.name}: {item.value}
                           </Text>
                        ))}
                     </Paper>
                    ),
                  }}
                />
            </Stack>
          </Card>

          </SimpleGrid> {/* End Grid for charts */} 
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
              {/* START: Add Total Population */} 
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
               {/* END: Add Total Population */} 
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
              {/* Add more counts as needed */} 
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
                 {/* Show Download button only when report is successfully loaded */}
                 {reportGenerated && !reportLoading && !reportError && reportContent && (
                   <Button
                     variant="light"
                     size="xs"
                     color="gray"
                     onClick={handleDownloadPdf}
                     leftSection={<IconDownload size={14} />}
                   >
                     Download
                   </Button>
                 )}
               </Group>
               <Divider />

               {/* Conditional Rendering based on state */}
               {!reportGenerated && !reportLoading ? (
                 // Initial state: Show Generate button
                 <Center>
                   <Button onClick={handleGenerateReport}>Generate Report</Button>
                 </Center>
               ) : reportLoading ? (
                 // Loading state
                 <Center h={250}> {/* Give height to center loader */}
                   <Loader size="sm" />
                 </Center>
               ) : reportError ? (
                 // Error state
                 <Stack align="center" h={250} justify="center"> {/* Give height */}
                   <Text c="red" size="sm">Error: {reportError}</Text>
                   <Button onClick={handleGenerateReport} variant="light" size="xs">Retry</Button>
                 </Stack>
               ) : (
                 // Success state: Show report
                 <ScrollArea h={250}>
                   <div className="report-markdown"> {/* Wrapper for styling */}
                     <ReactMarkdown
                       components={{
                         // Optional styling components
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