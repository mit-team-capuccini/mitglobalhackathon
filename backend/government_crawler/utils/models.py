from pydantic import BaseModel
from typing import List, Optional, Dict

class RoadClosure(BaseModel):
    coordinates: List[float]
    summary: str

class UtilityIncident(BaseModel):
    coordinates: List[float]
    summary: str

class RiverLevelHeight(BaseModel):
    max_height: Optional[float]
    current_height: Optional[float]

class ReservoirData(BaseModel):
    reservoir_name:       Optional[str]
    reservoir_location:   Optional[List[float]]
    reservoir_levels:     Optional[float]
    river_level_height:   Optional[RiverLevelHeight]
    url:                  Optional[str]

class OutputItem(BaseModel):
    road_closures: Optional[List[RoadClosure]]
    reservoir_levels: Optional[List[ReservoirData]]
    utility_incidents: Optional[List[UtilityIncident]]
    population: Optional[Dict[str, int]]
    river_level_height: Optional[RiverLevelHeight]

class RoadClosureData(BaseModel):
    coordinates: Optional[List[float]] 
    summary:     Optional[str]

class ElectricIncidentData(BaseModel):
    coordinates:   Optional[List[float]] 
    summary:       Optional[str]
    url:           Optional[str] 