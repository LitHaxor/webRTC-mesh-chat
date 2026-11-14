import pytest
from fastapi.testclient import TestClient

from app.endpoints.v1.signaling.repositories.rooms import RoomRepository
from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def rooms() -> RoomRepository:
    return RoomRepository()
