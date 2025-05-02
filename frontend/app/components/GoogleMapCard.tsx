'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Stack,
  Text,
  Loader,
} from '@mantine/core';
import { GoogleMap, useJsApiLoader, HeatmapLayer, MarkerF, InfoWindowF } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 39.4699,
  lng: -0.3763
};

// Sample heatmap data with weights
const heatmapData = [
  { lat: 39.47, lng: -0.37, weight: 1 },
  { lat: 39.471, lng: -0.375, weight: 1 },
  { lat: 39.469, lng: -0.378, weight: 1 },
  { lat: 39.472, lng: -0.372, weight: 1 },
  { lat: 39.468, lng: -0.38, weight: 1 },
];

// Remove static schoolData if not needed or keep if needed alongside population

const libraries = ['visualization', 'places'];

// --- Demo Population GeoJSON Data ---
const demoPopulationGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { population_density: 500 }, // Low density
      geometry: {
        type: 'Polygon',
        coordinates: [[ // Approx polygon 1 (adjust coordinates as needed)
          [-0.38, 39.47],
          [-0.37, 39.47],
          [-0.37, 39.46],
          [-0.38, 39.46],
          [-0.38, 39.47]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { population_density: 5000 }, // Medium density
      geometry: {
        type: 'Polygon',
        coordinates: [[ // Approx polygon 2
          [-0.37, 39.47],
          [-0.36, 39.47],
          [-0.36, 39.46],
          [-0.37, 39.46],
          [-0.37, 39.47]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { population_density: 15000 }, // High density
      geometry: {
        type: 'Polygon',
        coordinates: [[ // Approx polygon 3
          [-0.38, 39.48],
          [-0.37, 39.48],
          [-0.37, 39.47],
          [-0.38, 39.47],
          [-0.38, 39.48]
        ]]
      }
    }
  ]
};
// --- End Demo Data ---

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

// Define type for School results (simplified)
interface School {
  place_id: string;
  name: string;
  geometry: {
    location: google.maps.LatLng;
  };
  vicinity: string; // Address snippet
}

export function GoogleMapCard() {
  // State for map instance, schools, and selected school
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries as Array<"drawing" | "geometry" | "places" | "visualization">
  })

  const heatmapPoints = React.useMemo(() => {
    if (!isLoaded || typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.visualization) {
      return [];
    }
    return heatmapData.map(point => ({
      location: new window.google.maps.LatLng(point.lat, point.lng),
      weight: point.weight
    }));
  }, [isLoaded]);

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

  // Effect to fetch schools when map is loaded
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

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // Filter out results without geometry or location
        const validSchools = results.filter(
            (result): result is google.maps.places.PlaceResult & { geometry: { location: google.maps.LatLng }, vicinity: string } =>
                !!result.geometry?.location && !!result.vicinity && !!result.place_id
        );
        setSchools(validSchools as School[]); // Update state with fetched schools
      } else {
        console.error(`Places search failed: ${status}`);
        setSchools([]); // Clear schools on error
      }
    });
  }, [isLoaded, map]); // Rerun when map or isLoaded changes

  // --- Data Layer Styling Function (Simplified for Debugging) ---
  const styleDataLayer = useCallback((feature: google.maps.Data.Feature) => {
    console.log('Styling feature:', feature.getId()); // Log which feature is being styled
    return {
      fillColor: 'blue',    // Simple, solid color
      strokeWeight: 2,      // Visible border
      strokeColor: '#000000', // Black border
      fillOpacity: 0.5      // Semi-transparent
    };
  }, []);
  // --- End Styling Function ---

  // --- Effect for Data Layer ---
  useEffect(() => {
    if (!map || typeof window === 'undefined' || !window.google || !window.google.maps.Data) {
        console.log('Data Layer Effect: Map not ready or Data API unavailable');
        return;
    }
    console.log('Data Layer Effect: Running with map instance:', map);

    // Clear previous data features
    map.data.forEach(feature => map.data.remove(feature));
    console.log('Data Layer Effect: Cleared previous features');

    try {
        // Load the demo GeoJSON data
        console.log('Data Layer Effect: Loading GeoJSON...');
        // @ts-ignore - Bypassing incorrect type definition
        const features = map.data.loadGeoJson(demoPopulationGeoJson);
        console.log('Data Layer Effect: Loaded features:', features); // Log loaded features

        // Apply styling
        console.log('Data Layer Effect: Applying style...');
        map.data.setStyle(styleDataLayer);
        console.log('Data Layer Effect: Style applied.');

        // Add mouseover/mouseout effects
        const mouseoverListener = map.data.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
            map.data.overrideStyle(event.feature, { strokeWeight: 3, fillOpacity: 0.8 });
        });
        const mouseoutListener = map.data.addListener('mouseout', (event: google.maps.Data.MouseEvent) => {
            map.data.revertStyle();
        });

        // Cleanup function
        return () => {
            console.log('Data Layer Effect: Cleaning up...');
            if (map && google.maps.event) {
                if(mouseoverListener) google.maps.event.removeListener(mouseoverListener);
                if(mouseoutListener) google.maps.event.removeListener(mouseoutListener);
                map.data.forEach(feature => {
                    try { map.data.remove(feature); } catch (e) { /* ignore */ }
                });
            }
            console.log('Data Layer Effect: Cleanup complete.');
        };
    } catch (error) {
        console.error('Data Layer Effect: Error loading or styling GeoJSON:', error);
    }

  }, [map, styleDataLayer]);
  // --- End Data Layer Effect ---

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
    <Card padding={0} radius="lg" withBorder bg="gray.1" h={400}>
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={13}
          options={mapOptions}
          onLoad={onLoad} // Set map instance on load
          onUnmount={onUnmount} // Clear map instance on unmount
        >
          {heatmapPoints.length > 0 && (
             <HeatmapLayer
               data={heatmapPoints}
               options={heatmapOptions}
             />
          )}

          {/* School Markers - Use fetched schools data */}
          {redMarkerIcon && schools.map(school => (
            <MarkerF
              key={school.place_id}
              position={school.geometry.location}
              title={school.name}
              icon={redMarkerIcon}
              onClick={() => setSelectedSchool(school)} // Set selected school on click
            />
          ))}

          {/* Info Window for Selected School */}
          {selectedSchool && redMarkerIcon && (
            <InfoWindowF
              position={selectedSchool.geometry.location}
              onCloseClick={() => setSelectedSchool(null)} // Clear selection on close
            >
              <div>
                <h4>{selectedSchool.name}</h4>
                <p>{selectedSchool.vicinity}</p> {/* Display address snippet */}
              </div>
            </InfoWindowF>
          )}

          {/* Data Layer is managed via map instance, not as a child component */}

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