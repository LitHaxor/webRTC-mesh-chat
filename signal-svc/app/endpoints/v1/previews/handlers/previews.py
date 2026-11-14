from html.parser import HTMLParser
from urllib.parse import urljoin

import httpx2

from app.endpoints.v1.previews.schemas.responses import LinkPreviewResponse

META_FIELDS = {
    "og:title": "title",
    "og:description": "description",
    "description": "description",
    "og:image": "image",
}


class MetaParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.fields: dict[str, str] = {}
        self.title = ""
        self.in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "title":
            self.in_title = True
        if tag != "meta":
            return
        values = dict(attrs)
        key = values.get("property") or values.get("name")
        content = values.get("content")
        if key in META_FIELDS and content:
            self.fields.setdefault(META_FIELDS[key], content)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title += data


def parse_preview(url: str, html: str) -> LinkPreviewResponse:
    parser = MetaParser()
    parser.feed(html)

    image = parser.fields.get("image")
    if image:
        image = urljoin(url, image)

    return LinkPreviewResponse(
        url=url,
        title=parser.fields.get("title") or parser.title.strip() or None,
        description=parser.fields.get("description"),
        image=image,
    )


async def fetch_preview(url: str) -> LinkPreviewResponse:
    async with httpx2.AsyncClient(follow_redirects=True, timeout=5) as client:
        response = await client.get(url)

    if "text/html" not in response.headers.get("content-type", ""):
        return LinkPreviewResponse(url=url)

    return parse_preview(url, response.text)
