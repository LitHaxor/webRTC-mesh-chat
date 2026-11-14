from dataclasses import dataclass
from typing import Any
from uuid import uuid4

from app.endpoints.v1.signaling.schemas.common import RoomInfo
from app.endpoints.v1.signaling.schemas.responses import (
    AnswerResponse,
    ErrorResponse,
    OfferResponse,
    RoomCreatedResponse,
    RoomsResponse,
    SignalResponse,
)

EVERYONE = "everyone"


@dataclass
class Room:
    name: str
    host: str | None = None
    guest: str | None = None
    offer: Any = None

    def is_waiting(self) -> bool:
        return self.offer is not None and self.guest is None

    def has_member(self, conn: str) -> bool:
        return conn in (self.host, self.guest)

    def is_empty(self) -> bool:
        return self.host is None and self.guest is None


@dataclass
class Outgoing:
    to: str
    message: SignalResponse


def error(conn: str, message: str) -> list[Outgoing]:
    return [Outgoing(conn, ErrorResponse(message=message))]


class RoomRepository:
    def __init__(self) -> None:
        self.rooms: dict[str, Room] = {}

    def waiting(self) -> list[RoomInfo]:
        waiting = [
            RoomInfo(id=room_id, name=room.name)
            for room_id, room in self.rooms.items()
            if room.is_waiting()
        ]
        return sorted(waiting, key=lambda room: room.name)

    def create(self, conn: str, name: str) -> list[Outgoing]:
        room_id = str(uuid4())
        self.rooms[room_id] = Room(name=name, host=conn)
        room = RoomInfo(id=room_id, name=name)
        return [Outgoing(conn, RoomCreatedResponse(room=room))]

    def offer(self, conn: str, room_id: str, sdp: Any) -> list[Outgoing]:
        room = self.rooms.get(room_id)
        if room is None:
            return error(conn, "Room not found")
        if not room.has_member(conn):
            return error(conn, "You are not in this room")

        room.host = conn
        room.guest = None
        room.offer = sdp

        return [self.room_list()]

    def join(self, conn: str, room_id: str) -> list[Outgoing]:
        room = self.rooms.get(room_id)
        if room is None:
            return error(conn, "Room not found")
        if not room.is_waiting():
            return error(conn, "Room is not available")

        room.guest = conn

        offer = OfferResponse(room_id=room_id, sdp=room.offer)
        return [Outgoing(conn, offer), self.room_list()]

    def answer(self, conn: str, room_id: str, sdp: Any) -> list[Outgoing]:
        room = self.rooms.get(room_id)
        if room is None:
            return error(conn, "Room not found")
        if room.guest != conn:
            return error(conn, "You have not joined this room")
        if room.host is None:
            return error(conn, "The host has left")

        room.offer = None

        answer = AnswerResponse(room_id=room_id, sdp=sdp)
        return [Outgoing(room.host, answer)]

    def disconnect(self, conn: str) -> list[Outgoing]:
        for room_id, room in list(self.rooms.items()):
            if room.host == conn:
                room.host = None
            if room.guest == conn:
                room.guest = None
            if room.is_empty():
                del self.rooms[room_id]
        return [self.room_list()]

    def room_list(self) -> Outgoing:
        return Outgoing(EVERYONE, RoomsResponse(rooms=self.waiting()))
