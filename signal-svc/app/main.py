from fastapi import FastAPI

from app.endpoints.base import router

app = FastAPI(title="signal-svc")
app.include_router(router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}
