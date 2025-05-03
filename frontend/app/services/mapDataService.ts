// frontend/app/services/mapDataService.ts

// --- Heatmap Data ---
// TODO: Replace with actual API call
const heatmapData = [
    { lat: 39.47, lng: -0.37, weight: 1 },
    { lat: 39.471, lng: -0.375, weight: 1 },
    { lat: 39.469, lng: -0.378, weight: 1 },
    { lat: 39.472, lng: -0.372, weight: 1 },
    { lat: 39.468, lng: -0.38, weight: 1 },
];

export const getDemoHeatmapData = () => {
    // In the future, this could fetch data from an API
    return heatmapData;
};

// --- Population Density GeoJSON Data ---
// TODO: Replace with actual API call or loading from a static file
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

export const getDemoPopulationGeoJson = () => {
    // In the future, this could fetch data from an API or file
    return demoPopulationGeoJson;
};

// --- School Interface (Exported) ---
export interface School {
    place_id: string;
    name: string;
    geometry: {
      location: { lat: number; lng: number };
    };
    vicinity: string;
}

// --- Mock School Data (Used by exported function) ---
const mockSchoolData: School[] = [
    {
        place_id: 'mock_school_1',
        name: 'IES Lluís Vives (Mock)',
        geometry: { location: { lat: 39.4675, lng: -0.3755 } },
        vicinity: 'Av. de Xàtiva, Valencia (Mock)'
    },
    {
        place_id: 'mock_school_2',
        name: 'Colegio Salesiano San Juan Bosco (Mock)',
        geometry: { location: { lat: 39.4788, lng: -0.3495 } },
        vicinity: 'Av. de la Plata, Valencia (Mock)'
    },
    {
        place_id: 'mock_school_3',
        name: 'CEIP Jaume I (Mock)',
        geometry: { location: { lat: 39.4618, lng: -0.3812 } },
        vicinity: 'Carrer de Quart, Valencia (Mock)'
    }
];

// --- School Data Fetching (Exported, returns mock data) ---
export const fetchNearbySchools = async (
    _service?: google.maps.places.PlacesService,
    _request?: google.maps.places.PlaceSearchRequest
): Promise<School[]> => {
    console.log('mapDataService: Returning MOCK school data.');
    return Promise.resolve(mockSchoolData);
}; 