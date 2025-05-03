import { NextResponse } from 'next/server';

// Example reservoir level data
const reservoirData = [
  {
    "reservoir_name": "Alarcón Reservoir",
    "reservoir_location": [
      -1.874,
      39.708
    ],
    "reservoir_levels": 43.5, // Assuming this is the value to visualize
    "river_level_height": null
  },
  {
    "reservoir_name": "Contreras Reservoir",
    "reservoir_location": [
      -1.978,
      39.406
    ],
    "reservoir_levels": 38.9,
    "river_level_height": null
  },
  {
    "reservoir_name": "Thus Reservoir",
    "reservoir_location": null, // Will be filtered out
    "reservoir_levels": null,
    "river_level_height": null
  }
];

export async function GET() {
  try {
    // Filter out entries without location or levels
    const validData = reservoirData.filter(
      item => item.reservoir_location && item.reservoir_levels !== null
    );
    return NextResponse.json(validData);
  } catch (e) {
    console.error(e);
    const error = e as Error;
    return NextResponse.json({ error: 'Failed to fetch reservoir level data', message: error.message }, { status: 500 });
  }
} 