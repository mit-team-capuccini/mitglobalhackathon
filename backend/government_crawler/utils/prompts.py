water_reservoir_prompt_system = """
You are an assistant that finds the latest reservoir level information via web searches.
You have access to a web_search tool—use it to retrieve live data from official Valencia reservoir sites.
Extract each reservoir's name, coordinates, level, river info, and the exact URL you found. Focus on most recent data.
Respond only with valid JSON matching the provided schema.
"""

water_reservoir_prompt_user = """
Search the official Valencia reservoir management websites for current levels of Alarcón, Contreras and Tous.
For each reservoir, include:
 * reservoir_name
 * reservoir_location as [<lng>,<lat>] or null  
 * reservoir_levels as a percent or null  
 * river_level_height with max and current as numbers or null  
 * the URL of the official page you scraped or null  

Return only a JSON object with a top level “data” array matching the schema.
"""

road_closure_prompt_system = """
You are an assistant that finds the latest road-closure information via web searches.
Extract the data and respond _only_ with valid JSON matching the provided schema.
"""

road_closure_prompt_user = """
Search the official Valencia transport or municipality site or police site for current road closures.
For each closure, include:
 * coordinates as [<lng>, <lat>] or null  
 * a short summary translated to English or null  

Return only valid JSON matching this schema:
[{
  "coordinates": [<lng>, <lat>] | null,
  "summary": "<short text>" | null
}]
"""

electric_incident_prompt_system = """
You are an assistant that finds the latest electric incident information via web searches.
You have access to a web_search tool. Use it to retrieve _live_ pages from the official Valencia electricity utility.
Extract each incident's coordinates, a one-line summary, and the exact URL you found.
Respond _only_ with valid JSON matching the provided schema.
"""

electric_incident_prompt_user = """
Search the official Valencia electricity utility website for any current incidents or outages.
For each incident, include:
  * coordinates as [<lng>, <lat>] or null  
  * a short summary or null  
  * the URL of the official incident report or null  

Return only a JSON object with a top level “data” array:
{
  "data": [
    {
      "coordinates": [<lng>, <lat>] | null,
      "summary": "<short description>"   | null,
      "url":     "<https://…>"           | null
    },
    …  
  ]
}
"""