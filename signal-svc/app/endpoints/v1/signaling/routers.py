from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.endpoints.v1.signaling.handlers.signaling import SignalingHandler
from app.endpoints.v1.signaling.repositories.rooms import RoomRepository

router = APIRouter(prefix="/signaling", tags=["signaling"])

handler = SignalingHandler(RoomRepository())


@router.websocket("/ws")
async def signaling(socket: WebSocket) -> None:
    conn = await handler.connect(socket)
    try:
        while True:
            await handler.receive(conn, await socket.receive_text())
    except WebSocketDisconnect:
        await handler.disconnect(conn)
