from typing import Any, Literal

from app.endpoints.v1.signaling.schemas.common import CamelModel, RoomInfo


class RoomsResponse(CamelModel):
    type: Literal["rooms"] = "rooms"
    rooms: list[RoomInfo]


class RoomCreatedResponse(CamelModel):
    type: Literal["roomCreated"] = "roomCreated"
    room: RoomInfo


class JoinedResponse(CamelModel):
    type: Literal["joined"] = "joined"
    room_id: str
    peers: list[str]


class OfferResponse(CamelModel):
    type: Literal["offer"] = "offer"
    room_id: str
    peer_id: str
    sdp: Any


class AnswerResponse(CamelModel):
    type: Literal["answer"] = "answer"
    room_id: str
    peer_id: str
    sdp: Any


class ErrorResponse(CamelModel):
    type: Literal["error"] = "error"
    message: str


SignalResponse = (
    RoomsResponse
    | RoomCreatedResponse
    | JoinedResponse
    | OfferResponse
    | AnswerResponse
    | ErrorResponse
)
