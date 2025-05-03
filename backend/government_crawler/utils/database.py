import os
import logging
from typing import List, Dict, Any
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
from dotenv import load_dotenv

from .models import OutputItem # Assuming models.py is in the same directory

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
load_dotenv()

# --- Configuration --- 
MONGODB_CONNECTION_STRING = os.getenv("MONGODB_CONNECTION_STRING")
DATABASE_NAME = "Gov_data"
COLLECTION_NAME = "incidence_report"


# --- Database Connection --- 
_client: MongoClient | None = None

def get_mongo_client() -> MongoClient:
    """Establishes and returns a MongoDB client connection. Caches the client.

    Returns:
        A MongoClient instance.

    Raises:
        ConnectionFailure: If the connection to MongoDB fails.
        ValueError: If the MongoDB connection string is not configured.
    """
    global _client
    if _client:
        return _client

    if not MONGODB_CONNECTION_STRING:
        logging.error("MongoDB connection string not found in environment variables (MONGODB_CONNECTION_STRING).")
        raise ValueError("MongoDB connection string is not configured.")

    try:
        logging.info("Attempting to connect to MongoDB...")
        _client = MongoClient(MONGODB_CONNECTION_STRING)
        _client.admin.command('ismaster')
        logging.info("Successfully connected to MongoDB.")
        return _client
    except ConnectionFailure as e:
        logging.error(f"Failed to connect to MongoDB: {e}")
        _client = None
        raise

def save_output_items(output_list: List[OutputItem]):
    """Saves a list of OutputItem instances to MongoDB.

    Args:
        output_list: A list of OutputItem objects to save.

    Raises:
        OperationFailure: If the database insertion fails for any item.
    """
    if not output_list:
        logging.info("No items to save.")
        return

    try:
        client = get_mongo_client()
        db = client[DATABASE_NAME]
        collection = db[COLLECTION_NAME]

        data_dicts = [item.model_dump(mode='json') for item in output_list]

        logging.info(f"Inserting {len(data_dicts)} items into {DATABASE_NAME}.{COLLECTION_NAME}...")
        result = collection.insert_many(data_dicts)
        logging.info(f"Successfully inserted {len(result.inserted_ids)} items.")

    except (ConnectionFailure, ValueError) as e:
        raise RuntimeError("Failed to establish MongoDB connection.") from e
    except OperationFailure as e:
        logging.error(f"Failed to insert data batch into MongoDB: {e}")
        raise
    except Exception as e:
        logging.exception(f"An unexpected error occurred during batch data saving: {e}")
        raise RuntimeError("An unexpected error occurred while saving batch data.") from e