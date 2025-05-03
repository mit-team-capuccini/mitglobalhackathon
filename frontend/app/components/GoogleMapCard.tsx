'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Stack,
  Text,
  Loader,
} from '@mantine/core';
import { GoogleMap, useJsApiLoader, HeatmapLayer, MarkerF, InfoWindowF } from '@react-google-maps/api';

// Import data service functions
import { getDemoHeatmapData, getDemoPopulationGeoJson } from '../services/mapDataService';

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

<<<<<<< HEAD
// Define type for School results (simplified)
interface School {
  place_id: string;
  name: string;
  geometry: {
    location: google.maps.LatLng;
  };
  vicinity: string; // Address snippet
}
=======
// --- Constants for property names (Adjust if needed based on data) ---
const POPULATION_PROPERTY = 'PAD_2C02'; // Assumed total population property
const AREA_PROPERTY = 'Shape__Area'; // Area property (assumed sq meters)
const NAME_PROPERTY = 'Texto'; // Municipality name property

// --- GeoJSON File Path (in /public directory) ---
const GEOJSON_URL = '/CensusSpain.geojson'; // Corrected filename
>>>>>>> e2eda12 (test)

// Type for storing clicked polygon info
interface ClickedDensityInfo {
  density: number;
  position: google.maps.LatLng;
}

export function GoogleMapCard() {
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

  // --- Data Layer Styling Function (Density-based, no stroke) ---
  const styleDataLayer = useCallback((feature: google.maps.Data.Feature) => {
    const density = Number(feature.getProperty('population_density')) || 0;
    let fillColor = '#FFFFE0'; // Light Yellow (Low density)

    if (density > 10000) {
      fillColor = '#FF0000'; // Red (High density)
    } else if (density > 3000) {
      fillColor = '#FFA500'; // Orange (Medium density)
    }

    // console.log(`Styling feature ${feature.getId()}: density=${density}, color=${fillColor}`); // Optional logging

    return {
      fillColor: fillColor,
      strokeWeight: 0,      // Remove border
      fillOpacity: 0.65     // Keep semi-transparent
    };
  }, []);
  // --- End Styling Function ---

  // --- Effect for Data Layer ---
  useEffect(() => {
    if (!map || typeof window === 'undefined' || !window.google?.maps?.Data) {
        console.log('Data Layer Effect: Map not ready or google.maps.Data constructor unavailable');
        return;
    }
    console.log('Data Layer Effect: Running with map instance and Data constructor available');

    map.data.forEach(feature => map.data.remove(feature));
    console.log('Data Layer Effect: Cleared previous features');

    try {
        const populationData = getDemoPopulationGeoJson(); // Get data from service
        const geoJsonDataUrl = `data:application/json;charset=UTF-8,${encodeURIComponent(
          JSON.stringify(populationData)
        )}`;
        console.log('Data Layer Effect: Loading GeoJSON via Data URL...');

        // Load the GeoJSON using the Data URL
        // Remove the @ts-ignore as we are now passing a string
        const features = map.data.loadGeoJson(geoJsonDataUrl);
        // Note: loadGeoJson might still return undefined immediately when loading from URL,
        // features are added asynchronously. We rely on the feature count check later.
        console.log('Data Layer Effect: loadGeoJson called with Data URL.');

        // Check feature count (might need a slight delay or event listener for URL loading)
        // For simplicity, we'll keep the immediate check, but be aware it might log 0 initially.
        let featureCount = 0;
        map.data.forEach(() => featureCount++);
        console.log(`Data Layer Effect: Feature count on map.data immediately after load call: ${featureCount}`);

        // Apply styling (This might need to be tied to a 'addfeature' event listener
        // when loading from URL, but let's try applying it directly first)
        console.log('Data Layer Effect: Applying style...');
        map.data.setStyle(styleDataLayer);
        console.log('Data Layer Effect: Style applied.');

        // Add a listener to log when features ARE actually added from the URL
        const addFeatureListener = map.data.addListener('addfeature', (event: google.maps.Data.AddFeatureEvent) => {
            console.log('Data Layer Effect: Feature added:', event.feature.getId());
            // Optionally re-apply styles here if needed
        });

        // Add mouseover/mouseout effects
        const mouseoverListener = map.data.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
            map.data.overrideStyle(event.feature, { strokeWeight: 3, fillOpacity: 0.8 });
        });
        const mouseoutListener = map.data.addListener('mouseout', (event: google.maps.Data.MouseEvent) => {
            map.data.revertStyle();
        });

        // Add click listener for data layer features
        const clickListener = map.data.addListener('click', (event: google.maps.Data.MouseEvent) => {
            const feature = event.feature;
            const density = Number(feature.getProperty('population_density')) || 0;
            const position = event.latLng;
            if (position) {
                console.log(`Clicked feature ID: ${feature.getId()}, Density: ${density}, Position:`, position.toJSON());
                setClickedDensityInfo({ density, position });
            }
        });

        // Cleanup function
        return () => {
            console.log('Data Layer Effect: Cleaning up...');
            if (map && google.maps.event) {
                if(addFeatureListener) google.maps.event.removeListener(addFeatureListener);
                if(mouseoverListener) google.maps.event.removeListener(mouseoverListener);
                if(mouseoutListener) google.maps.event.removeListener(mouseoutListener);
                if(clickListener) google.maps.event.removeListener(clickListener); // Cleanup click listener
                map.data.forEach(feature => {
                    try { map.data.remove(feature); } catch (e) { /* ignore */ }
                });
            }
            console.log('Data Layer Effect: Cleanup complete.');
        };
    } catch (error) {
        console.error('Data Layer Effect: Error during load/style:', error);
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
          {/* Temporarily comment out HeatmapLayer */}
          {/* {heatmapPoints.length > 0 && (
             <HeatmapLayer
               data={heatmapPoints}
               options={heatmapOptions}
             />
          )} */}

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

<<<<<<< HEAD
          {/* Density Info Window */}
=======
          {/* Density Info Window (Updated) */}
>>>>>>> e2eda12 (test)
          {clickedDensityInfo && (
            <InfoWindowF
              position={clickedDensityInfo.position}
<<<<<<< HEAD
              onCloseClick={() => setClickedDensityInfo(null)} // Hide on close
            >
              <div>
                <h4>Population Density</h4>
                <p>{clickedDensityInfo.density.toLocaleString()} people / km² (demo)</p>
=======
              onCloseClick={() => setClickedDensityInfo(null)}
              >
              {/* Display Name and Density */}
              <div>
                  <h4>{clickedDensityInfo.name}</h4>
                  <p>Density: {clickedDensityInfo.density.toFixed(1)} p/km²</p>
>>>>>>> e2eda12 (test)
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