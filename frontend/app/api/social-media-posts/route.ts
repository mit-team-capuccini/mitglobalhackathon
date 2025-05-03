import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

// Define the structure of a post based on your example
export interface SocialMediaPost {
  _id: { $oid: string };
  post_id: string;
  platform: string;
  user: {
    user_id: string;
    username: string;
  };
  timestamp: { $date: string };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  media?: {
    image_url?: string;
    video_url?: string; // Assuming video might exist too
  };
  content: {
    text: string;
    hashtags?: string[];
    tags?: string[];
  };
  evaluation?: {
    severity?: string;
    estimated_damage?: string;
  };
  analytics?: {
    sentiment_score?: number;
    verified?: boolean;
    priority?: number;
  };
}

// Connection URI and Database Name - Ideally from environment variables
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'social_media'; // Default to 'social_media'
const collectionName = 'posts';

let client: MongoClient;

async function connectToDatabase() {
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
  if (client && client.topology && client.topology.isConnected()) {
    return client.db(dbName);
  }
  client = new MongoClient(uri);
  await client.connect();
  console.log("Connected successfully to MongoDB");
  return client.db(dbName);
}

export async function GET() {
  try {
    const db = await connectToDatabase();
    const posts = await db.collection<SocialMediaPost>(collectionName)
                          .find({})
                          // Optional: Sort by timestamp descending
                          .sort({ "timestamp": -1 })
                          // Optional: Limit results
                          // .limit(50)
                          .toArray();

    // We need to convert ObjectId and Date objects for JSON serialization if they aren't strings
    const serializablePosts = posts.map(post => ({
      ...post,
      _id: post._id.toString(), // Convert ObjectId to string
      timestamp: new Date(post.timestamp.$date).toISOString(), // Convert BSON date to ISO string
    }));

    return NextResponse.json(serializablePosts);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    // Ensure error is an instance of Error
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: 'Failed to fetch social media posts', details: message }, { status: 500 });
  }
  // Note: Connection closing can be handled differently depending on deployment strategy (e.g., Vercel)
  // For long-running servers, you might not close it here.
  // await client.close();
} 