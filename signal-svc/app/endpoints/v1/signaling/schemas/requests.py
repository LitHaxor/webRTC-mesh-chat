from typing import Annotated, Any, Literal

from pydantic import Field, TypeAdapter

from app.endpoints.v1.signaling.schemas.common import CamelModel


class CreateRoomRequest(CamelModel):
    type: Literal["createRoom"]
    name: str


class OfferRequest(CamelModel):
    type: Literal["offer"]
    room_id: str
    peer_id: str
    sdp: Any


class JoinRequest(CamelModel):
    type: Literal["join"]
    room_id: str


class AnswerRequest(CamelModel):
    type: Literal["answer"]
    room_id: str
    peer_id: str
    sdp: Any


SignalRequest = Annotated[
    CreateRoomRequest | OfferRequest | JoinRequest | AnswerRequest,
    Field(discriminator="type"),
]

signal_request = TypeAdapter(SignalRequest)
