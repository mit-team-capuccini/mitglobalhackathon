'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Stack,
  Text,
  Loader,
} from '@mantine/core';
import { GoogleMap, useJsApiLoader, HeatmapLayer, MarkerF, InfoWindowF } from '@react-google-maps/api';

// Correct imports from service
import { getDemoHeatmapData, fetchNearbySchools, School } from '../services/mapDataService';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 39.4699,
  lng: -0.3763
};

const libraries = ['visualization', 'places'];

// Define map options to disable controls
const mapOptions = {
  // disableDefaultUI overrides individual controls below
  disableDefaultUI: true,

  // Keep other options for clarity or potential future use if disableDefaultUI is removed
  mapTypeControl: false,
  zoomControl: false,
  streetViewControl: false,
  fullscreenControl: true, // This will be overridden by disableDefaultUI: true
  scaleControl: false,
  rotateControl: false,
  clickableIcons: true,
  keyboardShortcuts: false, // Also disable keyboard shortcuts
  // Note: logo cannot be disabled via options due to ToS
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
  position: google.maps.LatLng;
  name: string;
}

// Add visibility props
interface GoogleMapCardProps {
  showSchools: boolean;
  showDensity: boolean;
  showHeatmap: boolean;
  onRegionClick?: (region: { name: string; density: number }) => void; // Keep if needed
}

export function GoogleMapCard({ // Destructure new props
  showSchools,
  showDensity,
  showHeatmap,
  onRegionClick
}: GoogleMapCardProps) {
  // State for map instance, schools, and selected school
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  // State for clicked polygon info
  const [clickedDensityInfo, setClickedDensityInfo] = useState<ClickedDensityInfo | null>(null);

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
  }, []);

  // Callback to clear the map instance
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // --- Effect for fetching schools ---
  useEffect(() => {
    if (!isLoaded || !map || typeof window === 'undefined' || !window.google || !window.google.maps.places) {
      return;
    }

    const service = new window.google.maps.places.PlacesService(map);
    const request: google.maps.places.PlaceSearchRequest = {
      location: center, // Use map center
      radius: 5000, // Search within 5km (adjust as needed)
      type: 'school',
    };

    const loadSchools = async () => {
      try {
        const fetchedSchools = await fetchNearbySchools(service, request);
        setSchools(fetchedSchools);
      } catch (error) {
        console.error("Error fetching schools from service:", error);
        setSchools([]);
      }
    };
    loadSchools();
  }, [isLoaded, map]);
  // --- End school fetching effect ---

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

  // Log prop value on render
  console.log('GoogleMapCard render - showHeatmap:', showHeatmap);

  if (loadError) {
    return (
      <Card padding="lg" radius="lg" withBorder bg="gray.1" h={400}>
          <Stack align="center" justify="center" h="100%">
            <Text c="red">Error loading map</Text>
          </Stack>
      </Card>
    );
  }

  return (
    <Card padding={0} radius="lg" bg="gray.3" h={400}>
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={13}
          options={mapOptions}
          onLoad={onLoad} // Set map instance on load
          onUnmount={onUnmount} // Clear map instance on unmount
        >
          {/* Conditional Heatmap Layer */}
          {showHeatmap && heatmapPoints.length > 0 && (
             <HeatmapLayer
               data={heatmapPoints}
               options={heatmapOptions}
             />
          )}

          {/* Conditional School Markers */}
          {showSchools && redMarkerIcon && schools.map(school => (
            <MarkerF
              key={school.place_id}
              position={school.geometry.location}
              title={school.name}
              icon={redMarkerIcon}
              onClick={() => setSelectedSchool(school)}
            />
          ))}

          {/* Info Window for Selected School (conditionally rendered with markers) */}
          {showSchools && selectedSchool && redMarkerIcon && (
            <InfoWindowF
              position={selectedSchool.geometry.location}
              onCloseClick={() => setSelectedSchool(null)}
            >
              <div>
                <h4>{selectedSchool.name}</h4>
                <p>{selectedSchool.vicinity}</p>
              </div>
            </InfoWindowF>
          )}

          <></>
        </GoogleMap>
      ) : (
        <Stack align="center" justify="center" h="100%">
          <Loader color="yellow" />
          <Text c="dimmed">Loading Map...</Text>
        </Stack>
      )}
    </Card>
  );
} 