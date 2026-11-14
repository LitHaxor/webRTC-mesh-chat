from app.endpoints.v1.signaling.repositories.rooms import Outgoing, RoomRepository
from app.endpoints.v1.signaling.schemas.common import RoomInfo
from app.endpoints.v1.signaling.schemas.responses import (
    AnswerResponse,
    ErrorResponse,
    OfferResponse,
    RoomCreatedResponse,
)

OFFER = {"type": "offer", "sdp": "A"}
ANSWER = {"type": "answer", "sdp": "B"}


def create_room(rooms: RoomRepository, host: str) -> str:
    [created] = rooms.create(host, "Standup")
    assert isinstance(created.message, RoomCreatedResponse)
    return created.message.room.id


def create_waiting_room(rooms: RoomRepository, host: str) -> str:
    room_id = create_room(rooms, host)
    rooms.offer(host, room_id, OFFER)
    return room_id


def test_lists_a_room_once_its_host_has_sent_an_offer(rooms: RoomRepository):
    room_id = create_room(rooms, "alice")
    assert rooms.waiting() == []

    rooms.offer("alice", room_id, OFFER)

    assert rooms.waiting() == [RoomInfo(id=room_id, name="Standup")]


def test_hands_the_offer_to_the_guest_and_the_answer_to_the_host(
    rooms: RoomRepository,
):
    room_id = create_waiting_room(rooms, "alice")

    joined = rooms.join("bob", room_id)
    assert joined[0] == Outgoing("bob", OfferResponse(room_id=room_id, sdp=OFFER))
    assert rooms.waiting() == []

    assert rooms.answer("bob", room_id, ANSWER) == [
        Outgoing("alice", AnswerResponse(room_id=room_id, sdp=ANSWER))
    ]


def test_turns_away_a_second_guest(rooms: RoomRepository):
    room_id = create_waiting_room(rooms, "alice")
    rooms.join("bob", room_id)

    assert rooms.join("carol", room_id) == [
        Outgoing("carol", ErrorResponse(message="Room is not available"))
    ]


def test_removes_a_waiting_room_when_its_host_disconnects(rooms: RoomRepository):
    room_id = create_waiting_room(rooms, "alice")

    rooms.disconnect("alice")

    assert rooms.waiting() == []
    assert rooms.join("bob", room_id)[0].message.type == "error"


def test_lets_the_person_who_stays_reopen_the_room(rooms: RoomRepository):
    room_id = create_waiting_room(rooms, "alice")
    rooms.join("bob", room_id)

    rooms.disconnect("alice")
    rooms.offer("bob", room_id, OFFER)

    assert len(rooms.waiting()) == 1


def test_refuses_an_offer_from_someone_outside_the_room(rooms: RoomRepository):
    room_id = create_room(rooms, "alice")

    assert rooms.offer("mallory", room_id, OFFER) == [
        Outgoing("mallory", ErrorResponse(message="You are not in this room"))
    ]
