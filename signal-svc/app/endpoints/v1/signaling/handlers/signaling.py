from contextlib import suppress
from uuid import uuid4

from fastapi import WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from app.endpoints.v1.signaling.repositories.rooms import (
    EVERYONE,
    Outgoing,
    RoomRepository,
    error,
)
from app.endpoints.v1.signaling.schemas.requests import (
    AnswerRequest,
    CreateRoomRequest,
    JoinRequest,
    OfferRequest,
    signal_request,
)
from app.endpoints.v1.signaling.schemas.responses import RoomsResponse


class SignalingHandler:
    def __init__(self, rooms: RoomRepository) -> None:
        self.rooms = rooms
        self.sockets: dict[str, WebSocket] = {}

    async def connect(self, socket: WebSocket) -> str:
        await socket.accept()
        conn = str(uuid4())
        self.sockets[conn] = socket
        rooms = RoomsResponse(rooms=self.rooms.waiting())
        await self.deliver([Outgoing(conn, rooms)])
        return conn

    async def receive(self, conn: str, text: str) -> None:
        await self.deliver(self.route(conn, text))

    async def disconnect(self, conn: str) -> None:
        del self.sockets[conn]
        await self.deliver(self.rooms.disconnect(conn))

    def route(self, conn: str, text: str) -> list[Outgoing]:
        try:
            request = signal_request.validate_json(text)
        except ValidationError:
            return error(conn, "Invalid message")

        match request:
            case CreateRoomRequest(name=name):
                return self.rooms.create(conn, name)
            case OfferRequest(room_id=room_id, sdp=sdp):
                return self.rooms.offer(conn, room_id, sdp)
            case JoinRequest(room_id=room_id):
                return self.rooms.join(conn, room_id)
            case AnswerRequest(room_id=room_id, sdp=sdp):
                return self.rooms.answer(conn, room_id, sdp)

    async def deliver(self, outgoing: list[Outgoing]) -> None:
        for item in outgoing:
            text = item.message.model_dump_json()
            for socket in self.recipients(item.to):
                with suppress(WebSocketDisconnect):
                    await socket.send_text(text)

    def recipients(self, to: str) -> list[WebSocket]:
        if to == EVERYONE:
            return list(self.sockets.values())
        socket = self.sockets.get(to)
        if socket is None:
            return []
        return [socket]
