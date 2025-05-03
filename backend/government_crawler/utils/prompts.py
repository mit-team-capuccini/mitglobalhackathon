water_reservoir_prompt_system = """You are an assistant that finds the latest information on specific topics 
using web searches. Extract the requested data and respond ONLY with a valid JSON object matching the provided 
schema. The data should be enclosed in a list, even if only one item is found."""

water_reservoir_prompt_user = """Can you search from local governmental website of Valencia for the 
information on reservoir levels? Please look specifically on official websites for the levels of Alarcon, 
Contreras and thus reservoir. 
output only a JSON array in this exact form:

[{
  "reservoir_levels": [{"coordinates": [<lng>, <lat>], "level": <percent>}] | null,
  "river_level_height": {
    "name_of_river": "<RiverName>",
    "max_height": <meters>,
    "current_height": <meters>
  } | null"""

