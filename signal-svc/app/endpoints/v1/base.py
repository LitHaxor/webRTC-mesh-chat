from fastapi import APIRouter

from app.endpoints.v1.previews.routers import router as previews_router
from app.endpoints.v1.signaling.routers import router as signaling_router

router = APIRouter(prefix="/v1")
router.include_router(previews_router)
router.include_router(signaling_router)
