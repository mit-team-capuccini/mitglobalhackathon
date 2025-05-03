import { NextResponse } from 'next/server';

// Example road closure data
const roadClosures = [
  {
    "coordinates": [
      -0.37739,
      39.46975
    ],
    "summary": "Gran Via Marqués del Turia closed between Plaza del Ayuntamiento and Puente de las Flores due to construction work.",
    "id": "rc1" // Added an ID for key prop
  },
  {
    "coordinates": [
      -0.3748,
      39.4632
    ],
    "summary": "Avenida del Cid partially closed due to parade event, expect delays.",
    "id": "rc2" // Added an ID for key prop
  }
];

export async function GET() {
  try {
    // In a real application, you would fetch this data from a database or external API
    // For now, we just return the hardcoded example data
    return NextResponse.json(roadClosures);
  } catch (e) {
    console.error(e);
    const error = e as Error;
    return NextResponse.json({ error: 'Failed to fetch road closure data', message: error.message }, { status: 500 });
  }
} 