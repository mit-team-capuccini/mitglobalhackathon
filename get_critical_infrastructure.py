import requests
import os
from pymongo import MongoClient
from datetime import datetime
import time

def get_coordinates(municipality_name, api_key):
    # URL for Google Geocoding API
    geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
    
    # Build the request parameters
    params = {
        'address': municipality_name,
        'key': api_key
    }
    
    # Send the GET request to the Geocoding API
    response = requests.get(geocode_url, params=params)
    
    # Check for successful response
    if response.status_code == 200:
        data = response.json()
        if data['status'] == 'OK':
            location = data['results'][0]['geometry']['location']
            return f"{location['lat']},{location['lng']}"
        else:
            return None
    else:
        return None

# Function to get critical infrastructure (buildings) in a city
def get_critical_buildings(api_key, location, radius=1000):
    # URL for Google Places API
    places_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    
    # List of critical infrastructure types
    types = [
        'library', 'preschool', 'primary_school', 'school', 'secondary_school', 'university',
        'city_hall', 'courthouse', 'embassy', 'fire_station', 'government_office',
        'local_government_office', 'police', 'post_office', 'dental_clinic', 'dentist',
        'doctor', 'drugstore', 'hospital', 'pharmacy', 'church', 'hindu_temple',
        'mosque', 'synagogue', 'supermarket', 'convenience_store', 'airport', 'ferry_terminal'
    ]
    
    all_places = []
    
    # Make a separate request for each type
    for place_type in types:
        next_page_token = None
        
        # Build the initial request parameters
        params = {
            'location': location,  # Latitude and Longitude in "lat,lng" format
            'radius': radius,  # Search radius in meters
            'type': place_type,  # Single type for each request
            'key': api_key  # Your Google Maps API key
        }
        
        # Make requests until there are no more results for this type
        while True:
            # If we have a next_page_token, add it to the parameters
            if next_page_token:
                params['pagetoken'] = next_page_token
                # Wait for a short time as required by the API
                time.sleep(2)
            
            # Send the GET request to the Places API
            response = requests.get(places_url, params=params)
            
            # Check for successful response
            if response.status_code == 200:
                data = response.json()
                
                # Check if the request was successful
                if data['status'] == 'OK':
                    places = data.get('results', [])
                    all_places.extend(places)
                    
                    # Check if there are more results
                    next_page_token = data.get('next_page_token')
                    if not next_page_token:
                        break
                else:
                    break
            else:
                break
        
        # Wait a short time between different type requests to avoid rate limiting
        time.sleep(1)
    
    # Remove duplicates based on place_id
    unique_places = {}
    for place in all_places:
        place_id = place.get('place_id')
        if place_id and place_id not in unique_places:
            unique_places[place_id] = place
    
    return list(unique_places.values())

def save_to_mongodb(places, location, radius, municipality_name):
    # MongoDB connection string - replace with your actual connection string
    mongo_uri = os.getenv('MONGODB_URI', 'mongodb+srv://ncampana:HKjOOUBQiUJCF2ox@cluster0.m2ha5ti.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    
    try:
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        db = client['critical_infrastructure']
        collection = db['buildings']
        
        # Prepare the document to insert
        document = {
            'municipality_name': municipality_name,
            'location': location,
            'radius': radius,
            'timestamp': datetime.now(),
            'places': places
        }
        
        # Insert the document
        result = collection.insert_one(document)
        
        # Close the connection
        client.close()
        return True
    except Exception as e:
        return False

# Example usage
api_key = os.getenv('GOOGLE_API_KEY')  # Replace with your Google API Key
municipality_name = "Valencia, Spain"  # Example municipality name
radius = 15000  # Search radius in meters

# Get coordinates for the municipality
location = get_coordinates(municipality_name, api_key)

if location:
    # Get the critical buildings
    critical_buildings = get_critical_buildings(api_key, location, radius)
    
    if critical_buildings:
        # Save to MongoDB
        save_to_mongodb(critical_buildings, location, radius, municipality_name)
