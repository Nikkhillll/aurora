from typing import Literal, Optional
from pydantic import BaseModel, Field

Scenario = Literal["storm", "equipment_failure", "resupply_delay"]


class IngestPayload(BaseModel):
    station_id: str
    timestamp: Optional[str] = None
    readings: dict[str, float] = Field(default_factory=dict)


class SimulateRequest(BaseModel):
    station_id: str
    scenario: Scenario = "storm"
    severity: int = Field(50, ge=0, le=100)
