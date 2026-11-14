from dataclasses import dataclass, field
from typing import Any
from uuid import uuid4

from app.endpoints.v1.signaling.schemas.common import RoomInfo
from app.endpoints.v1.signaling.schemas.responses import (
    AnswerResponse,
    ErrorResponse,
    JoinedResponse,
    OfferResponse,
    RoomCreatedResponse,
    RoomsResponse,
    SignalResponse,
)

EVERYONE = "everyone"


@dataclass
class Room:
    name: str
    members: list[str] = field(default_factory=list)


@dataclass
class Outgoing:
    to: str
    message: SignalResponse


def error(conn: str, message: str) -> list[Outgoing]:
    return [Outgoing(conn, ErrorResponse(message=message))]


class RoomRepository:
    def __init__(self) -> None:
        self.rooms: dict[str, Room] = {}

    def listed(self) -> list[RoomInfo]:
        listed = [
            RoomInfo(id=room_id, name=room.name) for room_id, room in self.rooms.items()
        ]
        return sorted(listed, key=lambda room: room.name)

    def create(self, conn: str, name: str) -> list[Outgoing]:
        room_id = str(uuid4())
        self.rooms[room_id] = Room(name=name, members=[conn])
        room = RoomInfo(id=room_id, name=name)
        return [Outgoing(conn, RoomCreatedResponse(room=room)), self.room_list()]

    def join(self, conn: str, room_id: str) -> list[Outgoing]:
        room = self.rooms.get(room_id)
        if room is None:
            return error(conn, "Room not found")
        if conn in room.members:
            return error(conn, "You are already in this room")

        peers = list(room.members)
        room.members.append(conn)

        return [Outgoing(conn, JoinedResponse(room_id=room_id, peers=peers))]

    def offer(self, conn: str, room_id: str, peer_id: str, sdp: Any) -> list[Outgoing]:
        offer = OfferResponse(room_id=room_id, peer_id=conn, sdp=sdp)
        return self.relay(conn, room_id, peer_id, offer)

    def answer(self, conn: str, room_id: str, peer_id: str, sdp: Any) -> list[Outgoing]:
        answer = AnswerResponse(room_id=room_id, peer_id=conn, sdp=sdp)
        return self.relay(conn, room_id, peer_id, answer)

    def relay(
        self, conn: str, room_id: str, peer_id: str, message: SignalResponse
    ) -> list[Outgoing]:
        room = self.rooms.get(room_id)
        if room is None:
            return error(conn, "Room not found")
        if conn not in room.members:
            return error(conn, "You are not in this room")
        if peer_id not in room.members:
            return error(conn, "That person has left")

        return [Outgoing(peer_id, message)]

    def disconnect(self, conn: str) -> list[Outgoing]:
        for room_id, room in list(self.rooms.items()):
            if conn in room.members:
                room.members.remove(conn)
            if not room.members:
                del self.rooms[room_id]
        return [self.room_list()]

    def room_list(self) -> Outgoing:
        return Outgoing(EVERYONE, RoomsResponse(rooms=self.listed()))
