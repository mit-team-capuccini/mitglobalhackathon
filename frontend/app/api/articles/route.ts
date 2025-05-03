import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('news'); // Connect to the 'news' database
    const collection = db.collection('articles'); // Access the 'articles' collection

    // Fetch the first document found in the collection
    const newsData = await collection.findOne({});

    if (!newsData || !newsData.articles) {
      // Handle case where the document or the articles array is missing
      return NextResponse.json({ error: 'No articles found in the expected format' }, { status: 404 });
    }

    // Return only the articles array
    return NextResponse.json(newsData.articles);
  } catch (e) {
    console.error(e);
    const error = e as Error;
    return NextResponse.json({ error: 'Failed to fetch articles', message: error.message }, { status: 500 });
  }
} 