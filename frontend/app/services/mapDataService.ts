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