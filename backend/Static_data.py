from government_crawler.utils.search_and_process import fetch_reservoir_data, fetch_road_closures, fetch_electric_incidents
import json
from pydantic import ValidationError
import logging
from government_crawler.utils.database import save_output_items
from government_crawler.utils.models import OutputItem
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    try:
        res_data = fetch_reservoir_data()
        road_data = fetch_road_closures()
        elec_data = fetch_electric_incidents()

        combined = OutputItem(
            road_closures=[r.model_dump() for r in road_data],
            reservoir_levels=[r.model_dump() for r in res_data],
            utility_incidents=[e.model_dump() for e in elec_data]
        )
        save_output_items([combined])
    except (ValueError, RuntimeError, ValidationError) as e:
        logger.error(f"Error in main execution: {e}")
    except Exception:
        logger.exception("Unexpected error:")
