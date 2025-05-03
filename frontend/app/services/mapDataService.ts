// frontend/app/services/mapDataService.ts

// --- Heatmap Data ---
// TODO: Replace with actual API call
const heatmapData = [
  // Dense cluster near the beach
  { lat: 39.4720, lng: -0.3300, weight: 1 },
  { lat: 39.4680, lng: -0.3280, weight: 1 },
  { lat: 39.4750, lng: -0.3260, weight: 1 },
  { lat: 39.4640, lng: -0.3320, weight: 1 },
  { lat: 39.4600, lng: -0.3290, weight: 1 },
  { lat: 39.4780, lng: -0.3270, weight: 1 },
  { lat: 39.4650, lng: -0.3250, weight: 1 },
  { lat: 39.4710, lng: -0.3310, weight: 1 },
  { lat: 39.4760, lng: -0.3240, weight: 1 },
  { lat: 39.4630, lng: -0.3230, weight: 1 },

  // Medium density mid-range
  { lat: 39.4700, lng: -0.3550, weight: 1 },
  { lat: 39.4750, lng: -0.3500, weight: 1 },
  { lat: 39.4620, lng: -0.3520, weight: 1 },
  { lat: 39.4680, lng: -0.3480, weight: 1 },
  { lat: 39.4770, lng: -0.3570, weight: 1 },
  { lat: 39.4640, lng: -0.3530, weight: 1 },

  // Distributed city center
  { lat: 39.4710, lng: -0.3810, weight: 1 },
  { lat: 39.4685, lng: -0.3795, weight: 1 },
  { lat: 39.4730, lng: -0.3780, weight: 1 },
  { lat: 39.4665, lng: -0.3765, weight: 1 },
  { lat: 39.4725, lng: -0.3750, weight: 1 },
  { lat: 39.4670, lng: -0.3735, weight: 1 },
  { lat: 39.4735, lng: -0.3720, weight: 1 },
  { lat: 39.4680, lng: -0.3705, weight: 1 },
  { lat: 39.4715, lng: -0.3680, weight: 1 },
  { lat: 39.4695, lng: -0.3740, weight: 1 },
  { lat: 39.4740, lng: -0.3770, weight: 1 },
  { lat: 39.4660, lng: -0.3725, weight: 1 },
  { lat: 39.4730, lng: -0.3695, weight: 1 },
  { lat: 39.4690, lng: -0.3710, weight: 1 },
  { lat: 39.4690, lng: -0.3800, weight: 1 }
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
    // _service?: google.maps.places.PlacesService, // Removed unused
    // _request?: google.maps.places.PlaceSearchRequest // Removed unused
): Promise<School[]> => {
    console.log('mapDataService: Returning MOCK school data.');
    return Promise.resolve(mockSchoolData);
};

// --- Define Summary Info Interface ---
export interface MunicipalitySummary {
    municipal: string;
    population: number;
    population_density: number;
}

// --- Mock Valencia Summary Data ---
// TODO: Replace with actual API call for summary data
const mockValenciaSummary: MunicipalitySummary = {
    municipal: "Valencia",
    population: 791413, // Approx population from 2017 Padrón data
    population_density: 5851.5 // Calculated from Padrón data (Pop / Area in km²)
};

// --- Function to get Valencia Summary ---
export const getMunicipalitySummary = async (municipalityName: string): Promise<MunicipalitySummary | null> => {
    console.log(`mapDataService: Getting summary for ${municipalityName}`);
    // Simulate API call - currently only returns Valencia data
    if (municipalityName.toLowerCase() === 'valencia') {
        return Promise.resolve(mockValenciaSummary);
    }
    // In a real scenario, fetch data based on municipalityName
    console.warn(`mapDataService: No summary data available for ${municipalityName}, returning null.`);
    return Promise.resolve(null);
}; 