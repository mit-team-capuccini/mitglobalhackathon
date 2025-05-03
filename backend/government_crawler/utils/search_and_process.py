import os
import json
import logging
from typing import List, Optional, Dict
from prompts import water_reservoir_prompt_user, water_reservoir_prompt_system, road_closure_prompt_user, road_closure_prompt_system, electric_incident_prompt_user, electric_incident_prompt_system
from dotenv import load_dotenv
from openai import OpenAI

from pydantic import ValidationError
from models import RoadClosure, UtilityIncident, ReservoirData, OutputItem, RoadClosureData, ElectricIncidentData
load_dotenv()

# Configure logging
typing_logging = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

OUTPUT_SCHEMA_RESERVOIR = {
    "type": "object",
    "properties": {
        "data": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "reservoir_name": {
                        "type": ["string", "null"]
                    },
                    "reservoir_location": {
                        "type": ["array", "null"],
                        "items": { "type": "number" },
                        "description": "[latitude, longitude] or null"
                    },
                    "reservoir_levels": {
                        "type": ["number", "null"],
                        "description": "level in %"
                    },
                    "river_level_height": {
                        "type": ["object", "null"],
                        "properties": {
                            "max_height":     { "type": ["number", "null"] },
                            "current_height": { "type": ["number", "null"] }
                        },
                        "required": ["max_height", "current_height"],
                        "additionalProperties": False
                    },
                    "url": {
                        "type": ["string","null"],
                        "description": "link to the official reservoir page or null"
                    },
                },
                "required": [
                    "reservoir_name",
                    "reservoir_location",
                    "reservoir_levels",
                    "river_level_height",
                    "url"
                ],
                "additionalProperties": False
            }
        }
    },
    "required": ["data"],
    "additionalProperties": False
}

ROAD_CLOSURE_SCHEMA = {
    "type": "object",
    "properties": {
        "data": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "coordinates": {
                        "type": ["array", "null"],
                        "items": { "type": "number" },
                        "description": "[lng, lat] or null"
                    },
                    "summary": {
                        "type": ["string", "null"],
                        "description": "short description of closure or null"
                    }
                },
                "required": ["coordinates", "summary"],
                "additionalProperties": False
            }
        }
    },
    "required": ["data"],
    "additionalProperties": False
}

ELECTRIC_INCIDENT_SCHEMA = {
    "type": "object",
    "properties": {
        "data": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "coordinates": {
                        "type": ["array", "null"],
                        "items": { "type": "number" },
                        "description": "[lng, lat] or null"
                    },
                    "summary": {
                        "type": ["string", "null"],
                        "description": "short description or null"
                    },
                    "url": {
                        "type": ["string", "null"],
                        "description": "link to the official incident page or null"
                    }
                },
                "required": ["coordinates", "summary", "url"],
                "additionalProperties": False
            }
        }
    },
    "required": ["data"],
    "additionalProperties": False
}

def fetch_reservoir_data(
     user_prompt: str = water_reservoir_prompt_user,
     model: str = "gpt-4.1-mini-2025-04-14", # Using a model known to support json_schema
     openai_api_key: Optional[str] = None
) -> List[ReservoirData]:
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
    openai_api_key = os.getenv("OPENAI_API_KEY")

    client = OpenAI(api_key=openai_api_key)

    # Call the OpenAI Responses API with JSON schema mode
    try:
        logging.info(f"Requesting data with model {model} for prompt: {user_prompt[:50]}...")
        response = client.responses.create(
            model=model,
            tools=[{"type": "web_search", 
                    "user_location": { "type": "approximate", "city": "Valencia", "region": "Valencia" }}], 
            input=[
                {"role": "system", "content": water_reservoir_prompt_system},
                {"role": "user", "content": user_prompt}
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "reservoir_data",
                    "schema": OUTPUT_SCHEMA_RESERVOIR,
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
        payload = json.loads(assistant_json)
        records = payload['data']
        validated_items = [ReservoirData.model_validate(item) for item in records]
        logging.info(f"Successfully parsed %d items.", len(validated_items))
        return validated_items
    except json.JSONDecodeError as e:
        logging.error(f"JSON decoding failed: {e}. Response was: {assistant_json}")
        raise RuntimeError("Invalid JSON in API response") from e
    except ValidationError as e:
        logging.error(f"Structured data validation failed: {e}. Response was: {assistant_json}")
        raise RuntimeError("Structured data validation failed") from e

def fetch_road_closures(
    user_prompt: str = road_closure_prompt_user,
    model: str       = "gpt-4.1-mini-2025-04-14",
    openai_api_key: Optional[str] = None
) -> List[RoadClosureData]:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    resp = client.responses.create(
      model=model,
      tools=[{"type": "web_search", 
              "user_location": { "type": "approximate", "city": "Valencia", "region": "Valencia" }}], 
      input=[
        {"role":"system","content": road_closure_prompt_system},
        {"role":"user",  "content": user_prompt}
      ],
      text={"format":{
          "type":   "json_schema",
          "name":   "road_closure_data",
          "schema": ROAD_CLOSURE_SCHEMA,
          "strict": True
      }}
    )
    payload = json.loads(resp.output_text)
    records = payload["data"]
    return [RoadClosureData.model_validate(r) for r in records]

def fetch_electric_incidents(
    model: str = "gpt-4.1-mini-2025-04-14",
    openai_api_key: Optional[str] = None
) -> List[ElectricIncidentData]:
    openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
    client = OpenAI(api_key=openai_api_key)
    logging.info("Requesting electric incident data…")
    response = client.responses.create(
        model="gpt-4.1-mini-2025-04-14",
            tools=[{"type": "web_search", 
                    "user_location": { "type": "approximate", "city": "Valencia", "region": "Valencia" }}], 
            input=[
            {"role":"system","content": electric_incident_prompt_system},
            {"role":"user",  "content": electric_incident_prompt_user}
            ],
            text={
            "format": {
                "type":   "json_schema",
                "name":   "electric_incident_data",
                "schema": ELECTRIC_INCIDENT_SCHEMA,
                "strict": True
            }
            }
        )

    payload = json.loads(response.output_text)
    records = payload["data"]
    return [ElectricIncidentData.model_validate(r) for r in records]

if __name__ == "__main__":
    try:
        items = fetch_reservoir_data()
        logging.info(f"Fetched {len(items)} items.")
        for item in items:
            print(item.model_dump_json(indent=2))
    except (ValueError, RuntimeError) as e:
        logging.error(f"Error in main execution: {e}")
    except Exception as e:
        logging.exception("An unexpected error occurred:") # Log full traceback for unexpected errors