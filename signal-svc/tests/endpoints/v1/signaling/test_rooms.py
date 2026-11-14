from app.endpoints.v1.signaling.repositories.rooms import Outgoing, RoomRepository
from app.endpoints.v1.signaling.schemas.common import RoomInfo
from app.endpoints.v1.signaling.schemas.responses import (
    AnswerResponse,
    ErrorResponse,
    JoinedResponse,
    OfferResponse,
    RoomCreatedResponse,
)

OFFER = {"type": "offer", "sdp": "A"}
ANSWER = {"type": "answer", "sdp": "B"}


def create_room(rooms: RoomRepository, creator: str) -> str:
    created = rooms.create(creator, "Standup")[0]
    assert isinstance(created.message, RoomCreatedResponse)
    return created.message.room.id


def test_lists_a_room_as_soon_as_it_is_created(rooms: RoomRepository):
    room_id = create_room(rooms, "alice")

    assert rooms.listed() == [RoomInfo(id=room_id, name="Standup")]


def test_tells_each_newcomer_who_is_already_there(rooms: RoomRepository):
    room_id = create_room(rooms, "alice")

    assert rooms.join("bob", room_id) == [
        Outgoing("bob", JoinedResponse(room_id=room_id, peers=["alice"]))
    ]
    assert rooms.join("carol", room_id) == [
        Outgoing("carol", JoinedResponse(room_id=room_id, peers=["alice", "bob"]))
    ]


def test_keeps_a_room_listed_while_people_are_in_it(rooms: RoomRepository):
    room_id = create_room(rooms, "alice")
    rooms.join("bob", room_id)

    assert rooms.listed() == [RoomInfo(id=room_id, name="Standup")]


def test_passes_an_offer_and_an_answer_between_two_members(rooms: RoomRepository):
    room_id = create_room(rooms, "alice")
    rooms.join("bob", room_id)

    assert rooms.offer("bob", room_id, "alice", OFFER) == [
        Outgoing("alice", OfferResponse(room_id=room_id, peer_id="bob", sdp=OFFER))
    ]
    assert rooms.answer("alice", room_id, "bob", ANSWER) == [
        Outgoing("bob", AnswerResponse(room_id=room_id, peer_id="alice", sdp=ANSWER))
    ]


def test_refuses_an_offer_from_someone_outside_the_room(rooms: RoomRepository):
    room_id = create_room(rooms, "alice")

    assert rooms.offer("mallory", room_id, "alice", OFFER) == [
        Outgoing("mallory", ErrorResponse(message="You are not in this room"))
    ]


def test_refuses_an_offer_to_someone_who_has_left(rooms: RoomRepository):
    room_id = create_room(rooms, "alice")
    rooms.join("bob", room_id)
    rooms.join("carol", room_id)
    rooms.disconnect("alice")

    assert rooms.offer("carol", room_id, "alice", OFFER) == [
        Outgoing("carol", ErrorResponse(message="That person has left"))
    ]


def test_refuses_to_join_the_same_room_twice(rooms: RoomRepository):
    room_id = create_room(rooms, "alice")

    assert rooms.join("alice", room_id) == [
        Outgoing("alice", ErrorResponse(message="You are already in this room"))
    ]


def test_keeps_the_room_when_one_of_several_people_leaves(rooms: RoomRepository):
    room_id = create_room(rooms, "alice")
    rooms.join("bob", room_id)

    rooms.disconnect("alice")

    assert rooms.join("carol", room_id) == [
        Outgoing("carol", JoinedResponse(room_id=room_id, peers=["bob"]))
    ]


def test_removes_a_room_when_the_last_person_leaves(rooms: RoomRepository):
    room_id = create_room(rooms, "alice")

    rooms.disconnect("alice")

    assert rooms.listed() == []
    assert rooms.join("bob", room_id) == [
        Outgoing("bob", ErrorResponse(message="Room not found"))
    ]
