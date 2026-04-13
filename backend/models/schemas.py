"""
Pydantic schemas for WebSocket messages (C-04: validation on all WS messages).
Grid bounds enforced: 0-19. Enums validated. Max message 1KB enforced at
transport layer in websocket.py.
"""
from typing import Annotated, Literal, Union
from pydantic import BaseModel, Field

from .enums import BuildingType, Direction


GridCoord = Annotated[int, Field(ge=0, le=19)]


# ---------------------------------------------------------------------------
# Client -> Server messages
# ---------------------------------------------------------------------------

class PlaceBuildingMsg(BaseModel):
    type: Literal["place_building"]
    x: GridCoord
    y: GridCoord
    building_type: BuildingType
    direction: Direction = Direction.EAST


class RemoveBuildingMsg(BaseModel):
    type: Literal["remove_building"]
    x: GridCoord
    y: GridCoord


class RotateBuildingMsg(BaseModel):
    type: Literal["rotate_building"]
    x: GridCoord
    y: GridCoord
    direction: Direction


class TogglePauseMsg(BaseModel):
    type: Literal["toggle_pause"]


# Union for deserialization dispatcher
ClientMessage = Union[
    PlaceBuildingMsg,
    RemoveBuildingMsg,
    RotateBuildingMsg,
    TogglePauseMsg,
]


def parse_client_message(data: dict) -> ClientMessage:
    """
    Deserialize and validate an incoming WebSocket message.
    Raises pydantic.ValidationError on bad input.
    """
    msg_type = data.get("type", "")
    mapping = {
        "place_building": PlaceBuildingMsg,
        "remove_building": RemoveBuildingMsg,
        "rotate_building": RotateBuildingMsg,
        "toggle_pause": TogglePauseMsg,
    }
    cls = mapping.get(msg_type)
    if cls is None:
        raise ValueError(f"Unknown message type: {msg_type!r}")
    return cls(**data)


# ---------------------------------------------------------------------------
# REST response schemas (C-05: never include session_id)
# ---------------------------------------------------------------------------

class SessionResponse(BaseModel):
    """POST /api/sessions response -- never includes session_id in body."""
    expires_at: str
    has_active_game: bool = False


class SessionMeResponse(BaseModel):
    """GET /api/sessions/me response."""
    has_active_game: bool


class GameResponse(BaseModel):
    game_id: str
    status: str
    grid: dict
    advanced_circuits: int
    uptime_pct: float
    current_wave: int


class HealthResponse(BaseModel):
    status: str = "ok"
