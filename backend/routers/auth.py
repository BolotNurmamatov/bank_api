from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models import User, ActivityLog
import uuid
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

# For internal service-to-service communication
import os
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "super-secret-key-change-me-in-prod")

def verify_internal_secret(x_api_secret: str = Header(...)):
    if x_api_secret != INTERNAL_API_SECRET:
        raise HTTPException(status_code=403, detail="Invalid internal API secret")
    return True

class SyncUserRequest(BaseModel):
    email: str
    name: str

@router.post("/sync", dependencies=[Depends(verify_internal_secret)])
def sync_user(req: SyncUserRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        user = User(email=req.email, name=req.name, last_login=datetime.now())
        db.add(user)
        # Log creation
        log = ActivityLog(id=str(uuid.uuid4()), user_email=req.email, action="User Registered")
        db.add(log)
    else:
        user.last_login = datetime.now()
        # Log login
        log = ActivityLog(id=str(uuid.uuid4()), user_email=req.email, action="User Logged In")
        db.add(log)
    db.commit()
    return {"status": "success", "message": "User synced and logged"}

class LogActionRequest(BaseModel):
    email: str
    action: str

@router.post("/log", dependencies=[Depends(verify_internal_secret)])
def log_action(req: LogActionRequest, db: Session = Depends(get_db)):
    log = ActivityLog(id=str(uuid.uuid4()), user_email=req.email, action=req.action)
    db.add(log)
    db.commit()
    return {"status": "success"}
