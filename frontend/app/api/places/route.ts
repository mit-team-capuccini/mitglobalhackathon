import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('critical_infrastructure'); // Use your actual db name
    const collection = db.collection('buildings'); // Use your actual collection name

    // Fetch the first document found in the collection
    const buildingData = await collection.findOne({});

    if (!buildingData) {
      return NextResponse.json({ error: 'No building data found' }, { status: 404 });
    }

    // Return only the places array
    return NextResponse.json(buildingData.places || []);
  } catch (e) {
    console.error(e);
    // Type assertion for error object
    const error = e as Error;
    return NextResponse.json({ error: 'Failed to fetch data', message: error.message }, { status: 500 });
  }
} 