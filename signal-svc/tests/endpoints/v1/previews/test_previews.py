import httpx2
import pytest
from fastapi.testclient import TestClient

from app.endpoints.v1.previews import routers
from app.endpoints.v1.previews.handlers.previews import parse_preview
from app.endpoints.v1.previews.schemas.responses import LinkPreviewResponse

PAGE = """
<html>
  <head>
    <title>Fallback title</title>
    <meta property="og:title" content="Standup notes">
    <meta name="description" content="What we agreed on">
    <meta property="og:image" content="/cover.png">
  </head>
</html>
"""


def test_reads_open_graph_tags():
    preview = parse_preview("https://example.com/doc", PAGE)

    assert preview == LinkPreviewResponse(
        url="https://example.com/doc",
        title="Standup notes",
        description="What we agreed on",
        image="https://example.com/cover.png",
    )


def test_falls_back_to_the_page_title():
    preview = parse_preview("https://example.com", "<title> Example </title>")

    assert preview.title == "Example"
    assert preview.image is None


def test_returns_the_preview(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    async def fake_fetch(url: str) -> LinkPreviewResponse:
        return LinkPreviewResponse(url=url, title="Standup notes")

    monkeypatch.setattr(routers, "fetch_preview", fake_fetch)

    response = client.get("/api/v1/previews", params={"url": "https://example.com"})

    assert response.status_code == 200
    assert response.json()["title"] == "Standup notes"


def test_refuses_urls_that_are_not_http(client: TestClient):
    response = client.get("/api/v1/previews", params={"url": "file:///etc/passwd"})

    assert response.status_code == 422


def test_reports_links_that_cannot_be_loaded(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    async def failing_fetch(url: str) -> LinkPreviewResponse:
        raise httpx2.ConnectError("offline")

    monkeypatch.setattr(routers, "fetch_preview", failing_fetch)

    response = client.get("/api/v1/previews", params={"url": "https://example.com"})

    assert response.status_code == 502
