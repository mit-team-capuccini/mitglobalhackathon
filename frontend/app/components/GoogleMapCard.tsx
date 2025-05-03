'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Stack,
  Text,
  Loader,
} from '@mantine/core';
import { GoogleMap, useJsApiLoader, HeatmapLayer, MarkerF, InfoWindowF, PolygonF, OverlayView } from '@react-google-maps/api';

// Correct imports from service
import { getDemoHeatmapData } from '../services/mapDataService';

// Placeholder/Basic types for missing imports - Define more accurately if possible
type GeoJsonFeature = any; // Replace 'any' with a proper GeoJSON Feature interface if available
type MapData = any; // Replace 'any' if you have a type for heatmap data structure

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 39.4699,
  lng: -0.3763
};

const libraries = ['visualization', 'places', 'geocoding'];

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
interface ClickedDensityInfo {
  density: number;
  position: google.maps.LatLngLiteral;
  name: string;
}

// --- START: Infrastructure Place Types ---
// Define the structure of an infrastructure place based on your API data
export interface InfrastructurePlace {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string; // Assuming each place has a name
  place_id: string; // Use place_id as a key
  vicinity?: string; // <-- Added optional vicinity field
}
// --- END: Infrastructure Place Types ---

// --- START: Road Closure Types ---
export interface RoadClosure {
  coordinates: [number, number]; // [lng, lat]
  summary: string;
  id: string; // Unique ID for keys
}
// --- END: Road Closure Types ---

// --- START: Reservoir Level Types ---
export interface ReservoirLevel {
  reservoir_name: string;
  reservoir_location: [number, number]; // [lng, lat]
  reservoir_levels: number;
  // river_level_height: number | null; // Not used for heatmap
}
// --- END: Reservoir Level Types ---

// Add visibility props
interface GoogleMapCardProps {
  showDensity: boolean;
  showHeatmap: boolean;
  showInfrastructurePins: boolean;
  showRoadClosures: boolean;
  showReservoirHeatmap: boolean;
  onRegionClick?: (region: { name: string; density: number }) => void;
  center: google.maps.LatLngLiteral;
  zoom: number;
  heatmapData: MapData;
  polygonData: GeoJsonFeature[];
  infrastructurePlaces: InfrastructurePlace[];
  roadClosures: RoadClosure[];
  reservoirLevels: ReservoirLevel[];
  infraLoading: boolean;
  infraError: string | null;
  roadClosureLoading: boolean;
  roadClosureError: string | null;
  reservoirLoading: boolean;
  reservoirError: string | null;
  onBoundsChanged: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
    centerLat: number;
    centerLng: number;
    zoom: number;
  }) => void;
  onMapClick: (point: { lat: number; lng: number }) => void;
  selectedMunicipality: GeoJsonFeature | null;
}

interface MapCoordinates {
  lat: number;
  lng: number;
}

export function GoogleMapCard({
  showDensity,
  showHeatmap,
  showInfrastructurePins,
  showRoadClosures,
  showReservoirHeatmap,
  onRegionClick,
  center,
  zoom,
  heatmapData,
  polygonData,
  infrastructurePlaces,
  roadClosures,
  reservoirLevels,
  infraLoading,
  infraError,
  roadClosureLoading,
  roadClosureError,
  reservoirLoading,
  reservoirError,
  onBoundsChanged,
  onMapClick,
  selectedMunicipality
}: GoogleMapCardProps) {
  // State for map instance
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // State for clicked polygon info
  const [clickedDensityInfo, setClickedDensityInfo] = useState<ClickedDensityInfo | null>(null);
  // --- REMOVED State for fetched data (now passed as props) ---
  // const [infrastructurePlaces, setInfrastructurePlaces] = useState<InfrastructurePlace[]>([]);
  // const [infraLoading, setInfraLoading] = useState(false);
  // const [infraError, setInfraError] = useState<string | null>(null);
  // const [roadClosures, setRoadClosures] = useState<RoadClosure[]>([]);
  // const [roadClosureLoading, setRoadClosureLoading] = useState(false);
  // const [roadClosureError, setRoadClosureError] = useState<string | null>(null);
  // const [reservoirLevels, setReservoirLevels] = useState<ReservoirLevel[]>([]);
  // const [reservoirLoading, setReservoirLoading] = useState(false);
  // const [reservoirError, setReservoirError] = useState<string | null>(null);
  
  // --- State for selected items remains --- 
  const [selectedRoadClosure, setSelectedRoadClosure] = useState<RoadClosure | null>(null);
  const [selectedReservoir, setSelectedReservoir] = useState<ReservoirLevel | null>(null);
  const [selectedInfraPlace, setSelectedInfraPlace] = useState<InfrastructurePlace | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries as Array<"drawing" | "geometry" | "places" | "visualization">
  })

  // --- Heatmap Points Calculation ---
  const heatmapPoints = React.useMemo(() => {
    if (!isLoaded || typeof window === 'undefined' || !window.google?.maps?.visualization) {
      return [];
    }
    const data = getDemoHeatmapData(); // Get data from service
    return data.map(point => ({
      location: new window.google.maps.LatLng(point.lat, point.lng),
      weight: point.weight
    }));
  }, [isLoaded]);
  // --- End Heatmap Points ---

  // Define red marker icon using Symbol
  const redMarkerIcon = React.useMemo(() => {
    if (!isLoaded || typeof window === 'undefined' || !window.google || !window.google.maps) {
      return undefined;
    }
    return {
      path: window.google.maps.SymbolPath.CIRCLE, // Simple circle shape
      fillColor: 'red',
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 1,
      scale: 7 // Size of the circle
    };
  }, [isLoaded]);

  // Callback to set the map instance
  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    // Optional: Fit bounds or do other setup once map loads
    console.log('Map loaded successfully');
  }, []);

  // Callback to clear the map instance
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // --- Data Layer Styling Function (Refined Density Scale) ---
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
      strokeWeight: 0,      // No border
      fillOpacity: 0.50     // Slightly increased opacity
    };
  }, []);
  // --- End Styling Function ---

  // --- Effect for Data Layer (Conditional) ---
  useEffect(() => {
    if (!map || typeof window === 'undefined' || !window.google?.maps?.Data) {
        return;
    }

    // Function to clear data layer features
    const clearDataLayer = () => {
        map.data.forEach(feature => map.data.remove(feature));
        map.data.setStyle(null); // Remove styles
        console.log('Data Layer Effect: Cleared density data');
    };

    // If showDensity is true, load and style
    if (showDensity) {
        console.log('Data Layer Effect: showDensity is true, loading data...');
        // Clear any previous features first (in case toggled quickly)
        clearDataLayer();
        try {
            console.log(`Data Layer Effect: Loading GeoJSON from URL: ${GEOJSON_URL}`);
            // @ts-ignore
            map.data.loadGeoJson(GEOJSON_URL);
            console.log('Data Layer Effect: loadGeoJson called with URL.');

            // Add listeners when data is shown
            const addFeatureListener = map.data.addListener('addfeature', (event: google.maps.Data.AddFeatureEvent) => {
                console.log('Data Layer Effect: Feature added:', event.feature.getProperty(NAME_PROPERTY));
                map.data.setStyle(styleDataLayer);
            });
            const mouseoverListener = map.data.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
                map.data.overrideStyle(event.feature, { strokeWeight: 3, fillOpacity: 0.8 });
            });
            const mouseoutListener = map.data.addListener('mouseout', (event: google.maps.Data.MouseEvent) => {
                map.data.revertStyle();
            });
            const clickListener = map.data.addListener('click', (event: google.maps.Data.MouseEvent) => {
                const feature = event.feature;
                const population = Number(feature.getProperty(POPULATION_PROPERTY)) || 0;
                const areaSqMeters = Number(feature.getProperty(AREA_PROPERTY)) || 0;
                let density = 0;
                if (areaSqMeters > 0) { density = population / (areaSqMeters / 1_000_000); }
                const name = feature.getProperty(NAME_PROPERTY) || 'Unknown Area';
                onRegionClick?.({ name: name as string, density });
            });

            // Return cleanup function for THIS load instance
            return () => {
                console.log('Data Layer Effect: Cleaning up density data and listeners...');
                if (map && google.maps.event) {
                    if (addFeatureListener) google.maps.event.removeListener(addFeatureListener);
                    if (mouseoverListener) google.maps.event.removeListener(mouseoverListener);
                    if (mouseoutListener) google.maps.event.removeListener(mouseoutListener);
                    if (clickListener) google.maps.event.removeListener(clickListener);
                    clearDataLayer(); // Ensure features are cleared on effect cleanup/re-run
                }
                console.log('Data Layer Effect: Density cleanup complete.');
            };
        } catch (error) {
            console.error('Data Layer Effect: Error during load/style:', error);
        }
    } else {
        // If showDensity is false, ensure the layer is cleared
        console.log('Data Layer Effect: showDensity is false, clearing data...');
        clearDataLayer();
    }

  }, [map, styleDataLayer, onRegionClick, showDensity]); // Add showDensity to dependency array
  // --- End Data Layer Effect ---

  const handleBoundsChanged = () => {
    if (map && onBoundsChanged) {
      const bounds = map.getBounds();
      const center = map.getCenter();
      if (bounds && center) {
        onBoundsChanged({
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng(),
          centerLat: center.lat(),
          centerLng: center.lng(),
          zoom: map.getZoom() ?? zoom, // Use current zoom or default
        });
      }
    }
  };

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng && onMapClick) {
      onMapClick({
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      });
    }
  };

  // Log prop value on render
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

          {/* Conditional School Markers - Removed */}
          {/* School Marker rendering logic completely removed */}

          {/* Info Window for Selected School - Removed */}
          {/* School InfoWindow rendering logic completely removed */}

          {/* START: Conditional Infrastructure Place Markers */}
          {showInfrastructurePins && !infraLoading && infrastructurePlaces.map((place) => (
            <MarkerF
              key={place.place_id} // Use a unique key from your data
              position={place.geometry.location}
              title={place.name} // Show place name on hover
              onClick={() => setSelectedInfraPlace(place)} // <-- Set selected place on click
              // icon={/* Optional: Custom icon */} 
            />
          ))}
          {/* END: Conditional Infrastructure Place Markers */}

          {/* START: Info Window for Selected Infrastructure Place */}
          {selectedInfraPlace && (
            <InfoWindowF
              position={selectedInfraPlace.geometry.location}
              onCloseClick={() => setSelectedInfraPlace(null)} // <-- Clear selection on close
            >
              <div>
                {/* Display basic info - Customize as needed */} 
                <h4>{selectedInfraPlace.name}</h4>
                {/* --- START: Display Vicinity/Address --- */}
                {selectedInfraPlace.vicinity && (
                  <p>{selectedInfraPlace.vicinity}</p>
                )}
                {/* --- END: Display Vicinity/Address --- */}
                {/* You could add more details here if available in your data */}
                {/* <p>Lat: {selectedInfraPlace.geometry.location.lat}</p> */}
                {/* <p>Lng: {selectedInfraPlace.geometry.location.lng}</p> */}
              </div>
            </InfoWindowF>
          )}
          {/* END: Info Window for Selected Infrastructure Place */}

          {/* START: Conditional Road Closure Markers (using OverlayView) */}
          {showRoadClosures && !roadClosureLoading && roadClosures.map((closure) => (
            <OverlayView
              key={closure.id}
              position={{ lat: closure.coordinates[1], lng: closure.coordinates[0] }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} // Make it clickable
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
                onClick={() => setSelectedRoadClosure(closure)} // Set selected closure on click
                title={"Road Closure: " + closure.summary} // Add tooltip
              >
                🛑 
              </div>
            </OverlayView>
          ))}
          {/* END: Conditional Road Closure Markers */}
          
          {/* START: Info Window for Selected Road Closure */}
          {selectedRoadClosure && (
            <InfoWindowF
              position={{ lat: selectedRoadClosure.coordinates[1], lng: selectedRoadClosure.coordinates[0] }}
              onCloseClick={() => setSelectedRoadClosure(null)} // Clear selection
            >
              <div>
                <h4>Road Closure</h4>
                <p>{selectedRoadClosure.summary}</p>
              </div>
            </InfoWindowF>
          )}
          {/* END: Info Window for Selected Road Closure */}

          {/* START: Conditional Reservoir Heatmap Layer */}
          {showReservoirHeatmap && !reservoirLoading && reservoirHeatmapPoints.length > 0 && (
            <HeatmapLayer
              data={reservoirHeatmapPoints}
              options={reservoirHeatmapOptions} // Use the specific reservoir options
            />
          )}
          {/* END: Conditional Reservoir Heatmap Layer */}

          {/* Conditional Polygon Layer */}
          {polygonData && polygonData.map((polygon, index) => (
            <PolygonF
              key={`polygon-${index}`}
              paths={polygon.geometry.coordinates[0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))}
              options={{
                fillColor: "blue",
                fillOpacity: 0.3,
                strokeColor: "blue",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                clickable: false,
                draggable: false,
                editable: false,
                geodesic: false,
                zIndex: 1
              }}
            />
          ))}

          {/* Selected Municipality Polygon */}
          {selectedMunicipality && (
              <PolygonF
                  paths={selectedMunicipality.geometry.coordinates[0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))}
                  options={{
                      fillColor: "blue",
                      fillOpacity: 0.3,
                      strokeColor: "blue",
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      clickable: false,
                      draggable: false,
                      editable: false,
                      geodesic: false,
                      zIndex: 1
                  }}
              />
          )}

          {/* START: Conditional Reservoir Markers (for clicking) */}
          {showReservoirHeatmap && !reservoirLoading && reservoirMarkerIcon && reservoirLevels.map((level) => (
            <MarkerF
              key={`res-marker-${level.reservoir_name}`}
              position={{ lat: level.reservoir_location[1], lng: level.reservoir_location[0] }}
              icon={reservoirMarkerIcon}
              clickable={true}
              onClick={() => setSelectedReservoir(level)} // Set selected reservoir
              visible={true} // Ensure marker is visible even if icon is subtle
              // title={`${level.reservoir_name}: ${level.reservoir_levels}%`} // Optional tooltip
            />
          ))}
          {/* END: Conditional Reservoir Markers */} 

          {/* START: Info Window for Selected Reservoir */} 
          {selectedReservoir && (
            <InfoWindowF
              position={{ lat: selectedReservoir.reservoir_location[1], lng: selectedReservoir.reservoir_location[0] }}
              onCloseClick={() => setSelectedReservoir(null)} // Clear selection
            >
              <div>
                <h4>{selectedReservoir.reservoir_name}</h4>
                <p>Level: {selectedReservoir.reservoir_levels}%</p>
              </div>
            </InfoWindowF>
          )}
          {/* END: Info Window for Selected Reservoir */} 

        </GoogleMap>
      ) : (
        <Stack align="center" justify="center" h="100%">
          <Loader color="yellow" />
          <Text c="dimmed">Loading Map...</Text>
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