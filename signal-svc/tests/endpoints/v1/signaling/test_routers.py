from collections.abc import Callable
from typing import Any

from fastapi.testclient import TestClient
from starlette.testclient import WebSocketTestSession

WS_URL = "/api/v1/signaling/ws"

Message = dict[str, Any]


def next_matching(socket: WebSocketTestSession, match: Callable[[Message], bool]):
    while True:
        message = socket.receive_json()
        if match(message):
            return message


def of_type(type: str) -> Callable[[Message], bool]:
    return lambda message: message["type"] == type


def listing(room_id: str, listed: bool) -> Callable[[Message], bool]:
    def match(message: Message) -> bool:
        if message["type"] != "rooms":
            return False
        ids = [room["id"] for room in message["rooms"]]
        return (room_id in ids) == listed

    return match


def create_waiting_room(host: WebSocketTestSession) -> str:
    host.send_json({"type": "createRoom", "name": "Standup"})
    room_id = next_matching(host, of_type("roomCreated"))["room"]["id"]
    host.send_json({"type": "offer", "roomId": room_id, "sdp": {"sdp": "A"}})
    return room_id


def test_health_returns_ok(client: TestClient):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_two_people_exchange_an_offer_and_an_answer(client: TestClient):
    with client.websocket_connect(WS_URL) as alice:
        room_id = create_waiting_room(alice)

        with client.websocket_connect(WS_URL) as bob:
            next_matching(bob, listing(room_id, True))
            bob.send_json({"type": "join", "roomId": room_id})
            offer = next_matching(bob, of_type("offer"))
            assert offer["sdp"] == {"sdp": "A"}

            bob.send_json({"type": "answer", "roomId": room_id, "sdp": {"sdp": "B"}})
            answer = next_matching(alice, of_type("answer"))
            assert answer["sdp"] == {"sdp": "B"}


def test_turns_away_a_second_guest(client: TestClient):
    with client.websocket_connect(WS_URL) as alice:
        room_id = create_waiting_room(alice)

        with client.websocket_connect(WS_URL) as bob:
            next_matching(bob, listing(room_id, True))
            bob.send_json({"type": "join", "roomId": room_id})
            next_matching(bob, of_type("offer"))

            with client.websocket_connect(WS_URL) as carol:
                carol.send_json({"type": "join", "roomId": room_id})
                error = next_matching(carol, of_type("error"))

                assert error["message"] == "Room is not available"


def test_removes_a_waiting_room_when_its_host_leaves(client: TestClient):
    with client.websocket_connect(WS_URL) as watcher:
        with client.websocket_connect(WS_URL) as alice:
            room_id = create_waiting_room(alice)
            next_matching(watcher, listing(room_id, True))

        next_matching(watcher, listing(room_id, False))


def test_answers_invalid_json_with_an_error(client: TestClient):
    with client.websocket_connect(WS_URL) as socket:
        socket.send_text("not json")
        error = next_matching(socket, of_type("error"))

        assert error["message"] == "Invalid message"
