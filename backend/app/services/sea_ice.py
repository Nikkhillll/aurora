from datetime import datetime
from typing import Any


class SeaIceSeasonalModel:
    """
    Derived Antarctic sea-ice risk model based on seasonal climatology.

    Data tier: derived
    Source basis: NSIDC seasonal climatology
    This is not a live satellite feed.
    """

    MONTHLY_ICE_EXTENT = {
        1: 4.5,   # January
        2: 2.5,   # February
        3: 3.5,   # March
        4: 6.0,   # April
        5: 9.0,   # May
        6: 12.5,  # June
        7: 15.0,  # July
        8: 17.0,  # August
        9: 18.5,  # September
        10: 17.5, # October
        11: 14.0, # November
        12: 8.5,  # December
    }

    def get_ice_edge_latitude(self, longitude: float, month: int) -> float:
        """
        Estimate the latitude of the Antarctic ice edge.

        This is a simplified derived estimate for the demo.
        """
        base_extent = self.MONTHLY_ICE_EXTENT[month]

        # Simplified Weddell Sea sector adjustment.
        sector_offset = 2.0 if -60 < longitude < 30 else 0.0

        # Simplified conversion from extent to ice-edge latitude.
        ice_edge_lat = -65 - (base_extent / 3) - sector_offset

        return max(ice_edge_lat, -78)

    def check_route_risk(
        self,
        waypoints: list[dict[str, Any]],
        month: int | None = None,
    ) -> dict[str, Any]:
        """
        Assess ice risk at each route waypoint and determine
        the overall route risk.
        """
        if month is None:
            month = datetime.now().month

        if month not in self.MONTHLY_ICE_EXTENT:
            raise ValueError(f"Invalid month: {month}")

        risk_assessment: dict[str, Any] = {
            "month": month,
            "ice_extent_million_km2": self.MONTHLY_ICE_EXTENT[month],
            "waypoint_risks": [],
        }

        for waypoint in waypoints:
            ice_edge = self.get_ice_edge_latitude(
                waypoint["lng"],
                month,
            )

            in_ice_zone = waypoint["lat"] < ice_edge

            if in_ice_zone and waypoint["type"] != "station":
                risk_level = "HIGH"
            elif abs(waypoint["lat"] - ice_edge) < 3:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"

            risk_assessment["waypoint_risks"].append(
                {
                    "waypoint": waypoint["name"],
                    "lat": waypoint["lat"],
                    "lng": waypoint["lng"],
                    "ice_edge_estimate": ice_edge,
                    "risk_level": risk_level,
                }
            )

        risk_levels = [
            item["risk_level"]
            for item in risk_assessment["waypoint_risks"]
        ]

        if "HIGH" in risk_levels:
            overall_risk = "HIGH"
        elif "MEDIUM" in risk_levels:
            overall_risk = "MEDIUM"
        else:
            overall_risk = "LOW"

        risk_assessment["overall_risk"] = overall_risk

        if overall_risk == "HIGH":
            recommendation = "Ice conditions may threaten the route."
        elif overall_risk == "MEDIUM":
            recommendation = "Monitor ice conditions before departure."
        else:
            recommendation = "Route clear for current derived ice conditions."

        risk_assessment["recommendation"] = recommendation

        return risk_assessment