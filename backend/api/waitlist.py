"""Waitlist endpoint — collects emails when server is at capacity."""
import re
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.db.connection import get_db

log = logging.getLogger(__name__)
router = APIRouter()

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class WaitlistRequest(BaseModel):
    email: str


@router.post("/waitlist", status_code=201)
async def join_waitlist(body: WaitlistRequest) -> dict:
    email = body.email.strip().lower()
    if not _EMAIL_RE.match(email) or len(email) > 254:
        raise HTTPException(status_code=400, detail="Invalid email")

    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO waitlist (email) VALUES (?)",
            (email,),
        )
        await db.commit()
    except Exception:
        # UNIQUE constraint — already on the list
        return {"status": "already_registered"}

    log.info(f"Waitlist signup: {email}")
    return {"status": "registered"}
