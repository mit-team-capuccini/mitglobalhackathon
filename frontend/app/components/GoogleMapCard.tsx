'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Stack,
  Text,
  Loader,
  Group,
  Badge,
  ThemeIcon,
  Image
} from '@mantine/core';
import { GoogleMap, useJsApiLoader, HeatmapLayer, MarkerF, InfoWindowF, OverlayView } from '@react-google-maps/api';
import {
  IconMessageCircle
} from '@tabler/icons-react';

// Correct imports from service
import { getDemoHeatmapData } from '../services/mapDataService';

// Removed unused GeoJsonFeature type
// type GeoJsonFeature = google.maps.Data.Feature; 
type MapDataPoint = { lat: number; lng: number; weight?: number };

// START: Define Social Media Post Type (matching View1 fetch)
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
// END: Define Social Media Post Type

const containerStyle = {
  width: '100%',
  height: '100%'
};

const libraries: ('visualization' | 'places' | 'geocoding')[] = ['visualization', 'places', 'geocoding'];

// Define map options to disable controls and apply custom styles
const mapOptions = {
  disableDefaultUI: true,
  mapTypeControl: false,
  zoomControl: false,
  streetViewControl: false,
  fullscreenControl: false, // Keep this false if disableDefaultUI is true
  scaleControl: false,
  rotateControl: false,
  clickableIcons: true,
  keyboardShortcuts: false,
  // --- START: Custom Map Styles --- 
  styles: [
    {
      "featureType": "all",
      "elementType": "geometry.fill",
      "stylers": [
        { "saturation": -100 }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.icon",
      "stylers": [
        { "visibility": "off" } // Hide default POI icons
      ]
    },
    {
      "featureType": "poi.business",
      "elementType": "labels.text.fill",
      "stylers": [
        { "visibility": "off" } // Hide business labels
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [
        { "visibility": "off" } // Hide road outlines
      ]
    },
    {
        "featureType": "road.highway",
        "elementType": "labels.icon",
        "stylers": [
            { "visibility": "off" } // Hide highway icons
        ]
    },
    {
      "featureType": "transit",
      "elementType": "labels.icon",
      "stylers": [
        { "visibility": "off" } // Hide transit icons
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [
        { "color": "#c9e3f4" } // Light blue for water
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        { "color": "#8a8a8a" }
      ]
    }
  ]
  // --- END: Custom Map Styles --- 
};

// Define Heatmap options to better show differences
const heatmapOptions = {
  radius: 20, // Try a smaller radius
  opacity: 0.6, // Increase opacity slightly
  gradient: [
    'rgba(0, 255, 255, 0)', // Transparent cyan (low weight)
    'rgba(0, 255, 255, 1)',
    'rgba(0, 191, 255, 1)',
    'rgba(0, 127, 255, 1)',
    'rgba(0, 63, 255, 1)',
    'rgba(0, 0, 255, 1)',
    'rgba(0, 0, 127, 1)',
    'rgba(63, 0, 91, 1)',
    'rgba(127, 0, 63, 1)',
    'rgba(191, 0, 31, 1)',
    'rgba(255, 0, 0, 1)' // Red (high weight)
  ],
  maxIntensity: 1, // Set max intensity to match the current max weight
  dissipating: true, // Set dissipating to true
};

// --- Reinstate Constants for property names ---
const POPULATION_PROPERTY = 'PAD_2C02';
const AREA_PROPERTY = 'Shape__Area';
const NAME_PROPERTY = 'Texto';
const GEOJSON_URL = '/CensusSpain.geojson'; // Keep corrected filename

// Type for storing clicked polygon info
// interface ClickedDensityInfo { // Removed unused type
//   density: number;
//   position: google.maps.LatLngLiteral;
//   name: string;
// }

// --- START: Infrastructure Place Types ---
export interface InfrastructurePlace {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string; 
  place_id: string; 
  vicinity?: string; 
  // Adding fields used in InfoWindow
  status?: 'operational' | 'damaged' | 'offline'; 
  type?: string; 
}
// --- END: Infrastructure Place Types ---

// --- START: Road Closure Types ---
export interface RoadClosure {
  coordinates: [number, number]; // [lng, lat]
  summary: string;
  id: string;
  // Adding fields used in InfoWindow
  location?: string; // Name/location description
}
// --- END: Road Closure Types ---

// --- START: Reservoir Level Types ---
export interface ReservoirLevel {
  reservoir_name: string;
  reservoir_location: [number, number]; // [lng, lat]
  reservoir_levels: number;
}
// --- END: Reservoir Level Types ---

// Add visibility props
interface GoogleMapCardProps {
  showDensity: boolean;
  showHeatmap: boolean;
  showInfrastructurePins: boolean;
  showRoadClosures: boolean;
  showReservoirHeatmap: boolean;
  showSocialMediaPins: boolean;
  onRegionClick?: (region: { name: string; density: number }) => void;
  center: google.maps.LatLngLiteral;
  zoom: number;
  // heatmapData: MapData; // Removed unused prop (using demo data)
  infrastructurePlaces: InfrastructurePlace[];
  roadClosures: RoadClosure[];
  reservoirLevels: ReservoirLevel[];
  infraLoading: boolean;
  infraError: string | null;
  roadClosureLoading: boolean;
  roadClosureError: string | null;
  reservoirLoading: boolean;
  reservoirError: string | null;
  socialMediaPosts: SocialMediaPost[];
  onBoundsChanged: (bounds: google.maps.LatLngBounds | null) => void;
  onMapClick: (point: { lat: number; lng: number }) => void;
}

// interface MapCoordinates { // Removed unused type
//   lat: number;
//   lng: number;
// }

export function GoogleMapCard({
  showDensity,
  showHeatmap,
  showInfrastructurePins,
  showRoadClosures,
  showReservoirHeatmap,
  showSocialMediaPins,
  onRegionClick,
  center,
  zoom,
  // heatmapData, // Removed unused prop
  infrastructurePlaces,
  roadClosures,
  reservoirLevels,
  infraLoading,
  infraError,
  roadClosureLoading,
  roadClosureError,
  reservoirLoading,
  reservoirError,
  socialMediaPosts,
  onBoundsChanged,
  onMapClick
}: GoogleMapCardProps) {
  // State for map instance
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // State for clicked polygon info - Removed unused state
  // const [clickedDensityInfo, setClickedDensityInfo] = useState<ClickedDensityInfo | null>(null);
  
  // Removed individual selection states
  // const [selectedRoadClosure, setSelectedRoadClosure] = useState<RoadClosure | null>(null);
  // const [selectedReservoir, setSelectedReservoir] = useState<ReservoirLevel | null>(null);
  // const [selectedInfraPlace, setSelectedInfraPlace] = useState<InfrastructurePlace | null>(null);
  // Unified InfoWindow State
  const [selectedMarker, setSelectedMarker] = useState<InfrastructurePlace | RoadClosure | ReservoirLevel | SocialMediaPost | null>(null);
  const [markerType, setMarkerType] = useState<'infra' | 'road' | 'reservoir' | 'social' | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries as Array<"drawing" | "geometry" | "places" | "visualization">
  })

  // --- Heatmap Points Calculation (Corrected Type) ---
  const heatmapPoints = React.useMemo(() => {
    if (!isLoaded || typeof window === 'undefined' || !window.google?.maps?.visualization) {
      return [];
    }
    const data = getDemoHeatmapData(); 
    // Ensure the generated data conforms to WeightedLocation[]
    const points: google.maps.visualization.WeightedLocation[] = data.map((point: MapDataPoint) => ({
      location: new window.google.maps.LatLng(point.lat, point.lng),
      weight: point.weight ?? 1 // Provide a default weight if undefined
    }));
    return points;
  }, [isLoaded]);
  // --- End Heatmap Points ---

  // Removed unused redMarkerIcon
  // const redMarkerIcon = React.useMemo(() => { ... }, [isLoaded]);

  // Callback to set the map instance
  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    console.log('Map loaded successfully');
  }, []);

  // Callback to clear the map instance
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // --- Data Layer Styling Function ---
  const styleDataLayer = useCallback((feature: google.maps.Data.Feature) => {
    const population = Number(feature.getProperty(POPULATION_PROPERTY)) || 0;
    const areaSqMeters = Number(feature.getProperty(AREA_PROPERTY)) || 0;
    let density = 0;
    if (areaSqMeters > 0) {
        density = population / (areaSqMeters / 1_000_000); // Density per km²
    }

    // Refined 5-step color scale (adjust thresholds/colors as needed)
    let fillColor = '#FFFFE0'; // Very Low (< 50)
    if (density > 3000) {
      fillColor = '#BD0026'; // Very High (> 3000)
    } else if (density > 1000) {
      fillColor = '#F03B20'; // High (1000-3000)
    } else if (density > 250) {
      fillColor = '#FD8D3C'; // Medium (250-1000)
    } else if (density > 50) {
      fillColor = '#FECC5C'; // Low (50-250)
    }

    return {
      fillColor: fillColor,
      strokeWeight: 0,      
      fillOpacity: 0.50     
    };
  }, []);
  // --- End Styling Function ---

  // --- Effect for Data Layer (Conditional) ---
  useEffect(() => {
    if (!map || typeof window === 'undefined' || !window.google?.maps?.Data) {
        return;
    }
    const clearDataLayer = () => {
        map.data.forEach(feature => map.data.remove(feature));
        map.data.setStyle(null); 
        console.log('Data Layer Effect: Cleared density data');
    };

    if (showDensity) {
        console.log('Data Layer Effect: showDensity is true, loading data...');
        clearDataLayer();
        try {
            console.log(`Data Layer Effect: Loading GeoJSON from URL: ${GEOJSON_URL}`);
            // We attempt the call directly. If the build fails here, it confirms a type discrepancy.
            map.data.loadGeoJson(GEOJSON_URL); 
            console.log('Data Layer Effect: loadGeoJson called with URL.');

            const addFeatureListener = map.data.addListener('addfeature', () => { // Removed unused 'event' param
                console.log('Data Layer Effect: Feature added:');
                map.data.setStyle(styleDataLayer);
            });
            const mouseoverListener = map.data.addListener('mouseover', (event: google.maps.Data.MouseEvent) => { // Use specific type
                map.data.overrideStyle(event.feature, { strokeWeight: 3, fillOpacity: 0.8 });
            });
            const mouseoutListener = map.data.addListener('mouseout', () => { // Removed unused 'event' param
                map.data.revertStyle();
            });
            const clickListener = map.data.addListener('click', (event: google.maps.Data.MouseEvent) => { // Use specific type
                const feature = event.feature;
                const population = Number(feature.getProperty(POPULATION_PROPERTY)) || 0;
                const areaSqMeters = Number(feature.getProperty(AREA_PROPERTY)) || 0;
                let density = 0;
                if (areaSqMeters > 0) { density = population / (areaSqMeters / 1_000_000); }
                const name = feature.getProperty(NAME_PROPERTY) || 'Unknown Area';
                onRegionClick?.({ name: name as string, density });
            });

            return () => {
                console.log('Data Layer Effect: Cleaning up density data and listeners...');
                if (map && google.maps.event) {
                    if (addFeatureListener) google.maps.event.removeListener(addFeatureListener);
                    if (mouseoverListener) google.maps.event.removeListener(mouseoverListener);
                    if (mouseoutListener) google.maps.event.removeListener(mouseoutListener);
                    if (clickListener) google.maps.event.removeListener(clickListener);
                    clearDataLayer(); 
                }
                console.log('Data Layer Effect: Density cleanup complete.');
            };
        } catch (error) {
            console.error('Data Layer Effect: Error during load/style:', error);
        }
    } else {
        console.log('Data Layer Effect: showDensity is false, clearing data...');
        clearDataLayer();
    }

  }, [map, styleDataLayer, onRegionClick, showDensity]); 
  // --- End Data Layer Effect ---

  // --- Bounds Change Handler ---
  const handleBoundsChanged = () => {
    if (map && onBoundsChanged) {
      const bounds = map.getBounds();
      onBoundsChanged(bounds || null);
    }
  };

  // --- Map Click Handler ---
  const handleMapClick = (event: google.maps.MapMouseEvent) => { // Use specific type
    if (event.latLng && onMapClick) {
      onMapClick({
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      });
    }
  };

  console.log('GoogleMapCard render - showHeatmap:', showHeatmap);

  // --- START: Reservoir Heatmap Points Calculation --- 
  const reservoirHeatmapPoints = useMemo(() => {
    if (!isLoaded || typeof window === 'undefined' || !window.google?.maps?.visualization || !reservoirLevels) {
      return [];
    }
    return reservoirLevels.map(level => ({
      // Ensure correct coordinate order: Lat first for Google Maps LatLng
      location: new window.google.maps.LatLng(level.reservoir_location[1], level.reservoir_location[0]),
      weight: level.reservoir_levels // Use the level directly as weight
    }));
  }, [isLoaded, reservoirLevels]);
  // --- END: Reservoir Heatmap Points Calculation --- 

  // --- START: Reservoir Heatmap Options --- 
  // Separate options for the reservoir heatmap 
  const reservoirHeatmapOptions = {
    radius: 25, // <-- Reduced radius
    opacity: 0.6, // <-- Slightly reduced opacity
    // Gradient focused on less intense colors (e.g., Blues/Greens -> Yellow)
    gradient: [
      'rgba(0, 255, 255, 0)', // Transparent Cyan
      'rgba(0, 255, 255, 1)', // Cyan
      'rgba(0, 191, 255, 1)', // Deep Sky Blue
      'rgba(173, 216, 230, 1)', // Light Blue
      'rgba(144, 238, 144, 1)', // Light Green
      'rgba(255, 255, 0, 1)'  // Yellow
    ],
    // Adjust maxIntensity based on expected range of reservoir_levels, or leave undefined to auto-scale
    // maxIntensity: 50, // Example: if levels go up to ~50
    dissipating: true, // <-- Changed back to true
  };
  // --- END: Reservoir Heatmap Options --- 

  // --- START: Reservoir Marker Icon (Subtle) --- 
  const reservoirMarkerIcon = useMemo(() => {
      if (!isLoaded || typeof window === 'undefined' || !window.google?.maps) {
          return undefined;
      }
      return {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#808080', // Gray
          fillOpacity: 0.5, // Semi-transparent
          strokeColor: '#FFFFFF',
          strokeWeight: 1,
          scale: 4, // Small size
      };
  }, [isLoaded]);
  // --- END: Reservoir Marker Icon --- 

  // --- Unified Marker Click Handler --- 
  const handleMarkerClick = (marker: InfrastructurePlace | RoadClosure | ReservoirLevel | SocialMediaPost, type: 'infra' | 'road' | 'reservoir' | 'social') => {
    setSelectedMarker(marker);
    setMarkerType(type);
    // Clear other selections if needed (optional)
    // setSelectedInfraPlace(null);
    // setSelectedRoadClosure(null);
    // setSelectedReservoir(null);
  };

  // --- InfoWindow Close Handler ---
  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
    setMarkerType(null);
    // Also clear individual selections
    // setSelectedInfraPlace(null);
    // setSelectedRoadClosure(null);
    // setSelectedReservoir(null);
  };

  if (loadError) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder h={400}>
          <Stack align="center" justify="center" h="100%">
            <Text c="red">Error loading map</Text>
          </Stack>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding={0} radius="md" withBorder h={400}>
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          options={mapOptions}
          onLoad={onLoad} // Set map instance on load
          onUnmount={onUnmount} // Clear map instance on unmount
          onBoundsChanged={handleBoundsChanged}
          onClick={handleMapClick}
        >
          {/* Conditional Heatmap Layer */}
          {showHeatmap && heatmapPoints.length > 0 && (
             <HeatmapLayer
               data={heatmapPoints}
               options={heatmapOptions}
             />
          )}

          {/* Infrastructure Markers */}
          {showInfrastructurePins && !infraLoading && infrastructurePlaces.map((place) => (
            <MarkerF
              key={place.place_id} 
              position={place.geometry.location}
              title={place.name} 
              onClick={() => handleMarkerClick(place, 'infra')} // Use unified handler
            />
          ))}

          {/* Road Closure Markers */}
          {showRoadClosures && !roadClosureLoading && roadClosures.map((closure) => (
            <OverlayView
              key={closure.id}
              position={{ lat: closure.coordinates[1], lng: closure.coordinates[0] }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} 
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.7)', // Slight white background for contrast
                  padding: '2px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px', // Adjust emoji size
                  transform: 'translate(-50%, -50%)' // Center the emoji on the coordinate
                }}
                onClick={() => handleMarkerClick(closure, 'road')} // Use unified handler
                title={"Road Closure: " + closure.summary} 
              >
                🛑 
              </div>
            </OverlayView>
          ))}
          
          {/* Reservoir Heatmap Layer */}
          {showReservoirHeatmap && !reservoirLoading && reservoirHeatmapPoints.length > 0 && (
            <HeatmapLayer
              data={reservoirHeatmapPoints}
              options={reservoirHeatmapOptions} 
            />
          )}

          {/* Reservoir Markers (for clicking) */}
          {showReservoirHeatmap && !reservoirLoading && reservoirMarkerIcon && reservoirLevels.map((level) => (
            <MarkerF
              key={`res-marker-${level.reservoir_name}`}
              position={{ lat: level.reservoir_location[1], lng: level.reservoir_location[0] }}
              icon={reservoirMarkerIcon}
              clickable={true}
              onClick={() => handleMarkerClick(level, 'reservoir')} // Use unified handler
              visible={true} 
            />
          ))}

          {/* Social Media Markers */}
          {showSocialMediaPins && socialMediaPosts.map(post => {
            if (post.location?.latitude != null && post.location?.longitude != null) {
              return (
                <MarkerF
                  key={post._id}
                  position={{ lat: post.location.latitude, lng: post.location.longitude }}
                  icon={{
                    // Example: Message icon (adjust color/style)
                    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-message-circle-2-filled" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="cyan" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5.821 4.81c3.574 -2.412 8.771 -2.412 12.346 .002c3.607 2.438 5.343 6.723 4.66 10.941c-.67 4.13 -3.814 7.585 -7.981 8.218c-1.134 .172 -2.29 .172 -3.426 0c-4.167 -.633 -7.312 -4.089 -7.981 -8.218c-.682 -4.218 1.053 -8.503 4.66 -10.942z" stroke-width="0" fill="currentColor" /></svg>',
                    scaledSize: new google.maps.Size(20, 20), // Adjust size
                  }}
                  title={`@${post.user.username}: ${post.content.text.substring(0, 30)}...`}
                  onClick={() => handleMarkerClick(post, 'social')} // Use unified handler
                />
              );
            }
            return null;
          })}

          {/* Unified Info Window (Corrected Checks) */}
          {selectedMarker && (() => {
            let position: google.maps.LatLngLiteral | undefined;
            let content: React.ReactNode = null;

            // Determine position and content based on marker type
            if (markerType === 'infra') {
                const place = selectedMarker as InfrastructurePlace;
                if(place.geometry?.location && typeof place.geometry.location.lat === 'number' && typeof place.geometry.location.lng === 'number') {
                    position = { lat: place.geometry.location.lat, lng: place.geometry.location.lng };
                    content = (
                        <Stack gap="xs">
                            <Text fw={500}>{place.name}</Text>
                            {place.status && <Badge color={place.status === 'operational' ? 'green' : place.status === 'damaged' ? 'orange' : 'red'}>{place.status}</Badge>}
                            {place.type && <Text size="sm">Type: {place.type}</Text>}
                            {place.vicinity && <Text size="sm">{place.vicinity}</Text>}
                        </Stack>
                    );
                }
            } else if (markerType === 'road') {
                const closure = selectedMarker as RoadClosure;
                if(closure.coordinates && closure.coordinates.length === 2 && typeof closure.coordinates[0] === 'number' && typeof closure.coordinates[1] === 'number') {
                    position = { lat: closure.coordinates[1], lng: closure.coordinates[0] };
                    content = (
                        <Stack gap="xs">
                            <Text fw={500}>{closure.location || 'Road Closure'}</Text>
                            <Badge color="red">Road Closure</Badge>
                            <Text size="sm">Reason: {closure.summary}</Text>
                        </Stack>
                    );
                }
            } else if (markerType === 'reservoir') {
                const level = selectedMarker as ReservoirLevel;
                if(level.reservoir_location && level.reservoir_location.length === 2 && typeof level.reservoir_location[0] === 'number' && typeof level.reservoir_location[1] === 'number') {
                    position = { lat: level.reservoir_location[1], lng: level.reservoir_location[0] };
                    content = (
                        <Stack gap="xs">
                            <Text fw={500}>{level.reservoir_name}</Text>
                            <Badge color={level.reservoir_levels > 80 ? 'red' : level.reservoir_levels > 50 ? 'orange' : 'blue'}>
                                Level: {level.reservoir_levels}%
                            </Badge>
                        </Stack>
                    );
                }
            } else if (markerType === 'social') {
                const post = selectedMarker as SocialMediaPost;
                if (post.location && typeof post.location.latitude === 'number' && typeof post.location.longitude === 'number') {
                    position = { lat: post.location.latitude, lng: post.location.longitude };
                    content = (
                         <Stack gap="xs">
                            <Group gap="xs">
                                <ThemeIcon variant="light" size="sm" radius="xl">
                                    <IconMessageCircle size={12} />
                                </ThemeIcon>
                                <Text fw={500}>@{post.user.username}</Text>
                            </Group>
                            <Text size="sm">{post.content.text}</Text>
                            {post.media?.image_url && (
                                <Image
                                    src={post.media.image_url}
                                    radius="sm"
                                    mt="xs"
                                    mah={150}
                                    fit="contain"
                                    alt="Social media post image"
                                />
                            )}
                        </Stack>
                    );
                }
            }

            // Render InfoWindow only if position is valid
            if (position) {
              return (
                <InfoWindowF
                  position={position} 
                  onCloseClick={handleInfoWindowClose}
                >
                  <div>{content}</div>
                </InfoWindowF>
              );
            }
            return null;
          })()}

        </GoogleMap>
      ) : (
        <Stack align="center" justify="center" h="100%">
          <Loader color="yellow" />
          {infraLoading && <Text c="dimmed" size="sm">Loading infrastructure data...</Text>}
          {infraError && <Text c="red" size="sm">Error loading infrastructure: {infraError}</Text>}
          {roadClosureLoading && <Text c="dimmed" size="sm">Loading road closures...</Text>}
          {roadClosureError && <Text c="red" size="sm">Error loading road closures: {roadClosureError}</Text>}
          {reservoirLoading && <Text c="dimmed" size="sm">Loading reservoir levels...</Text>}
          {reservoirError && <Text c="red" size="sm">Error loading reservoir levels: {reservoirError}</Text>}
        </Stack>
      )}
    </Card>
  );
} 