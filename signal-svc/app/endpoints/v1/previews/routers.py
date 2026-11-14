import httpx2
from fastapi import APIRouter, HTTPException
from pydantic import HttpUrl

from app.endpoints.v1.previews.handlers.previews import fetch_preview
from app.endpoints.v1.previews.schemas.responses import LinkPreviewResponse

router = APIRouter(prefix="/previews", tags=["previews"])


@router.get("", responses={502: {"description": "Could not load the link"}})
async def preview(url: HttpUrl) -> LinkPreviewResponse:
    try:
        return await fetch_preview(str(url))
    except httpx2.HTTPError as error:
        raise HTTPException(502, "Could not load the link") from error
