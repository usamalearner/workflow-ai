"""WorkFlow AI — FastAPI application entrypoint."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import (
    actions,
    analytics,
    chat,
    documents,
    files,
    health,
    reports,
)
from app.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("workflow")

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Turn workplace information into action.",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)

for r in (documents, chat, actions, reports, analytics, files):
    app.include_router(r.router, prefix=settings.api_prefix)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all so an unexpected bug returns a clean 500 instead of crashing
    the connection.

    Bare ``Exception`` handlers run in Starlette's outermost error middleware,
    which sits OUTSIDE ``CORSMiddleware`` — so a response built here never
    gets CORS headers added automatically. Without this, any real backend bug
    shows up in the browser as a misleading "blocked by CORS policy" error
    instead of the actual 500, which is very hard to debug from the frontend.
    We add the same headers CORSMiddleware would add ourselves.
    """
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    response = JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )
    origin = request.headers.get("origin")
    if origin and origin in settings.cors_origin_list:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    return response


@app.get("/")
def root() -> dict:
    return {
        "name": settings.app_name,
        "tagline": "Turn workplace information into action.",
        "docs": "/docs",
        "demo_mode": settings.is_demo,
    }
