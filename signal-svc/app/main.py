from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.endpoints.base import router

app = FastAPI(title="signal-svc")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"])
app.include_router(router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}
