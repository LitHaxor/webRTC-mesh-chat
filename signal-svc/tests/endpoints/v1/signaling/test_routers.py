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


def create_room(creator: WebSocketTestSession) -> str:
    creator.send_json({"type": "createRoom", "name": "Standup"})
    return next_matching(creator, of_type("roomCreated"))["room"]["id"]


def join_room(socket: WebSocketTestSession, room_id: str) -> list[str]:
    socket.send_json({"type": "join", "roomId": room_id})
    return next_matching(socket, of_type("joined"))["peers"]


def test_health_returns_ok(client: TestClient):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_three_people_exchange_offers_and_answers(client: TestClient):
    with (
        client.websocket_connect(WS_URL) as alice,
        client.websocket_connect(WS_URL) as bob,
        client.websocket_connect(WS_URL) as carol,
    ):
        room_id = create_room(alice)
        [alice_id] = join_room(bob, room_id)
        peers = join_room(carol, room_id)
        assert peers[0] == alice_id
        assert len(peers) == 2

        for peer_id in peers:
            carol.send_json(
                {
                    "type": "offer",
                    "roomId": room_id,
                    "peerId": peer_id,
                    "sdp": {"sdp": "A"},
                }
            )
        to_alice = next_matching(alice, of_type("offer"))
        to_bob = next_matching(bob, of_type("offer"))
        assert to_alice["peerId"] == to_bob["peerId"]
        assert to_alice["sdp"] == {"sdp": "A"}

        bob.send_json(
            {
                "type": "answer",
                "roomId": room_id,
                "peerId": to_bob["peerId"],
                "sdp": {"sdp": "B"},
            }
        )
        answer = next_matching(carol, of_type("answer"))
        assert answer["peerId"] == peers[1]
        assert answer["sdp"] == {"sdp": "B"}


def test_refuses_an_offer_to_someone_outside_the_room(client: TestClient):
    with client.websocket_connect(WS_URL) as alice:
        room_id = create_room(alice)
        alice.send_json(
            {"type": "offer", "roomId": room_id, "peerId": "nobody", "sdp": {}}
        )
        error = next_matching(alice, of_type("error"))

        assert error["message"] == "That person has left"


def test_removes_a_room_when_the_last_person_leaves(client: TestClient):
    with client.websocket_connect(WS_URL) as watcher:
        with client.websocket_connect(WS_URL) as alice:
            room_id = create_room(alice)
            next_matching(watcher, listing(room_id, True))

        next_matching(watcher, listing(room_id, False))


def test_answers_invalid_json_with_an_error(client: TestClient):
    with client.websocket_connect(WS_URL) as socket:
        socket.send_text("not json")
        error = next_matching(socket, of_type("error"))

        assert error["message"] == "Invalid message"
