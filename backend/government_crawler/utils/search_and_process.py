import os
import json
import logging
from typing import List, Optional, Dict
from prompts import water_reservoir_prompt_user, water_reservoir_prompt_system
from dotenv import load_dotenv  # Load .env variables

from openai import OpenAI
from pydantic import BaseModel, ValidationError

# Load environment variables from a .env file at project root
load_dotenv()

# 1. Define Pydantic models matching your desired schema
class RoadClosure(BaseModel):
    coordinates: List[float]
    summary: str

class ReservoirLevel(BaseModel):
    coordinates: List[float]
    level: float

class UtilityIncident(BaseModel):
    coordinates: List[float]
    summary: str

class RiverLevelHeight(BaseModel):
    name_of_river: str
    max_height: Optional[float] = None
    current_height: Optional[float] = None
    percent: Optional[float] = None

class OutputItem(BaseModel):
    road_closures: Optional[List[RoadClosure]]
    reservoir_levels: Optional[List[ReservoirLevel]]
    utility_incidents: Optional[List[UtilityIncident]]
    population: Optional[Dict[str, int]]
    river_level_height: Optional[RiverLevelHeight]

# Configure logging
typing_logging = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Derive JSON schema for OutputItem list using Pydantic v2 model_json_schema()
ITEM_SCHEMA = OutputItem.model_json_schema()
ITEM_SCHEMA["additionalProperties"] = False
OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "data": {
            "type": "array",
            "items": ITEM_SCHEMA
        }
    },
    "required": ["data"],
    "additionalProperties": False
}

def fetch_government_data(
     user_prompt: str = water_reservoir_prompt_user,
     model: str = "gpt-4.1-mini-2025-04-14", # Using a model known to support json_schema
     openai_api_key: Optional[str] = None
) -> List[OutputItem]:
    """Fetch structured government data based on a user prompt, returning JSON matching a predefined schema.

    Args:
        user_prompt: The user's query for information.
        model: OpenAI model to use (must support json_schema output).
        openai_api_key: OpenAI API key; if None, read from env var OPENAI_API_KEY.

    Returns:
        List of OutputItem objects parsed from the structured JSON response.

    Raises:
        ValueError: if API key is missing.
        RuntimeError: if API call or JSON parsing/validation fails.
    """
    # Get or validate API key
    if openai_api_key is None:
        openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        logging.error("OpenAI API key not found in environment variables.")
        raise ValueError("OpenAI API key not provided.")

    client = OpenAI(api_key=openai_api_key)

    # Call the OpenAI Responses API with JSON schema mode
    try:
        logging.info(f"Requesting data with model {model} for prompt: {user_prompt[:50]}...")
        response = client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": water_reservoir_prompt_system},
                {"role": "user", "content": user_prompt}
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "government_data",
                    "schema": OUTPUT_SCHEMA,
                    "strict": True
                }
            }
        )
    except Exception as e:
        logging.error(f"OpenAI API call failed: {e}")
        raise RuntimeError("Failed to call OpenAI API") from e

    # Extract the assistant's JSON text reply
    assistant_json: Optional[str] = response.output_text
    if assistant_json is None:
        logging.error("No text output received from OpenAI API.")
        raise RuntimeError("No text response from OpenAI API.")

    logging.info(f"Received response: {assistant_json[:100]}...")

    # Parse and validate JSON with Pydantic
    try:
        # Load the JSON object, expect it to have a 'data' array
        payload = json.loads(assistant_json)
        if not isinstance(payload, dict) or 'data' not in payload:
            logging.error("Expected top-level object with 'data' field in API response. Got: %s", payload)
            raise RuntimeError("Invalid API response structure: 'data' property missing.")

        records = payload['data']
        validated_items = [OutputItem.parse_obj(item) for item in records]
        logging.info(f"Successfully parsed %d items.", len(validated_items))
        return validated_items
    except json.JSONDecodeError as e:
        logging.error(f"JSON decoding failed: {e}. Response was: {assistant_json}")
        raise RuntimeError("Invalid JSON in API response") from e
    except ValidationError as e:
        logging.error(f"Structured data validation failed: {e}. Response was: {assistant_json}")
        raise RuntimeError("Structured data validation failed") from e


if __name__ == "__main__":
    try:
        items = fetch_government_data()
        logging.info(f"Fetched {len(items)} items.")
        for item in items:
            print(item.json(indent=2))
    except (ValueError, RuntimeError) as e:
        logging.error(f"Error in main execution: {e}")
    except Exception as e:
        logging.exception("An unexpected error occurred:") # Log full traceback for unexpected errors