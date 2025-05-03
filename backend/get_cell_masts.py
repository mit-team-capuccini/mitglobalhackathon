#!/usr/bin/env python3
import sys
import os
import math
import gzip
import sqlite3
import requests
from geopy.geocoders import Nominatim
from pymongo import MongoClient
from datetime import datetime

# Default configuration
DEFAULT_DOWNLOAD_URL = "https://archive.org/download/openbmap/openbmap2017-10-29.sqlite.gz"
DEFAULT_DUMP_PATH = "cache/openbmap_signals.sqlite.gz"
DEFAULT_SQLITE_PATH = "cache/openbmap_signals.sqlite"

def download_file(url, local_path):
    """
    Stream-download a large file from `url` to `local_path`.
    """
    print(f"Downloading from {url} …")
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        total = int(r.headers.get('Content-Length', 0))
        downloaded = 0
        with open(local_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                if not chunk:
                    continue
                f.write(chunk)
                downloaded += len(chunk)
                percent = downloaded * 100 // total if total else 0
                print(f"\r  {percent}% ({downloaded//1024//1024} MiB)", end='', flush=True)
    print("\nDownload complete.")
    return local_path

def extract_gz(gz_path, output_path):
    """
    Extract a gzipped file.
    """
    print(f"Extracting {gz_path} to {output_path}...")
    with gzip.open(gz_path, 'rb') as f_in:
        with open(output_path, 'wb') as f_out:
            f_out.write(f_in.read())
    print("Extraction complete.")

def get_city_center(city_name):
    """
    Use OSM Nominatim to get the latitude/longitude of a city center.
    """
    geolocator = Nominatim(user_agent="cellmapper_data_collector")
    loc = geolocator.geocode(city_name)
    if not loc:
        raise ValueError(f"Could not geocode '{city_name}'")
    return loc.latitude, loc.longitude

def haversine(lat1, lon1, lat2, lon2):
    """
    Compute Haversine distance (in meters) between two (lat,lon) points.
    """
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def save_to_mongodb(cell_masts, city_name, center_lat, center_lon, radius_m):
    """
    Save cell mast data to MongoDB.
    """
    mongo_uri = os.getenv('MONGODB_URI')
    
    try:
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        db = client['critical_infrastructure']
        collection = db['cell_masts']
        
        # Prepare the document to insert
        document = {
            'city_name': city_name,
            'center_location': {
                'lat': center_lat,
                'lng': center_lon
            },
            'radius_meters': radius_m,
            'timestamp': datetime.now(),
            'cell_masts': cell_masts
        }
        
        # Insert the document
        result = collection.insert_one(document)
        print(f"Successfully saved {len(cell_masts)} cell masts to MongoDB with ID: {result.inserted_id}")
        
        # Close the connection
        client.close()
        return True
    except Exception as e:
        print(f"Error saving to MongoDB: {str(e)}")
        return False

def filter_by_radius(sqlite_path, city_name, center_lat, center_lon, radius_m=15000):
    """
    Read SQLite database and keep only rows within `radius_m` of center.
    """
    print(f"Filtering for points within {radius_m} m of ({center_lat}, {center_lon}) …")
    cell_masts = []
    
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(sqlite_path)
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("Available tables:", [table[0] for table in tables])
        
        # Use the cell_zone table
        table_name = 'cell_zone'
        print(f"Using table: {table_name}")
        
        # Get column names
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        print("Available columns:", [col[1] for col in columns])
        
        # Query the database for cell towers
        query = """
            SELECT 
                latitude,
                longitude,
                cid,
                mcc,
                mnc,
                area,
                source,
                technology,
                measurements,
                last_updated,
                created_at
            FROM cell_zone
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        """
        cursor.execute(query)
        
        for row in cursor.fetchall():
            try:
                lat, lon = float(row[0]), float(row[1])
                
                if haversine(center_lat, center_lon, lat, lon) <= radius_m:
                    # Format the cell mast data
                    cell_mast = {
                        'location': {
                            'lat': lat,
                            'lng': lon
                        },
                        'data': {
                            'cid': row[2],
                            'mcc': row[3],
                            'mnc': row[4],
                            'area': row[5],
                            'source': row[6],
                            'technology': row[7],
                            'measurements': row[8],
                            'last_updated': row[9],
                            'created_at': row[10]
                        }
                    }
                    cell_masts.append(cell_mast)
            except (ValueError, TypeError) as e:
                print(f"Error processing row: {str(e)}")
                continue
        
        conn.close()
        
        print(f"Found {len(cell_masts)} cell masts within the radius.")
        
        # Save to MongoDB
        if cell_masts:
            save_to_mongodb(cell_masts, city_name, center_lat, center_lon, radius_m)
        else:
            print("No cell masts found within the specified radius.")
            
    except sqlite3.Error as e:
        print(f"Error reading SQLite database: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python get_cell_masts.py \"City, Country\" [download_url]")
        sys.exit(1)

    city_name = sys.argv[1]
    download_url = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_DOWNLOAD_URL
    gz_path = DEFAULT_DUMP_PATH
    sqlite_path = DEFAULT_SQLITE_PATH

    # Create cache directory if it doesn't exist
    os.makedirs(os.path.dirname(gz_path), exist_ok=True)

    # 1) Download and extract if needed
    if not os.path.isfile(sqlite_path):
        if not os.path.isfile(gz_path):
            download_file(download_url, gz_path)
        extract_gz(gz_path, sqlite_path)
    else:
        print(f"Found existing SQLite database at {sqlite_path}, skipping download and extraction.")

    # 2) Geocode
    lat0, lon0 = get_city_center(city_name)
    print(f"City center for '{city_name}': {lat0}, {lon0}")

    # 3) Filter and save to MongoDB
    filter_by_radius(sqlite_path, city_name, lat0, lon0, radius_m=15000)
