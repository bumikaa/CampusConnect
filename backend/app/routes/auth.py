import hashlib
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    email_or_username: str
    password: str
    role: str # STUDENT, DELIVERY_PARTNER, OPERATIONS_MANAGER

class UserResponse(BaseModel):
    id: int
    email: str
    username: Optional[str] = None
    full_name: str
    role: str
    token: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/login", response_model=UserResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    identifier = req.email_or_username.strip().lower()
    pass_hash = hash_password(req.password)

    # 1. Query database for user by email or username
    user = db.query(User).filter(
        (User.email == identifier) | (User.username == identifier)
    ).first()

    # 2. If user not found in DB yet, check standard seeded accounts
    if not user:
        if identifier in ["student@campus.edu", "student", "alex"] and req.password == "student123" and req.role == "STUDENT":
            user = User(id=1, email="student@campus.edu", username="student", hashed_password=pass_hash, full_name="Alex Student", role="STUDENT")
            db.add(user)
            db.commit()
            db.refresh(user)
        elif identifier in ["driver@campus.edu", "driver", "driver-01", "john"] and req.password == "driver123" and req.role == "DELIVERY_PARTNER":
            user = User(id=2, email="driver@campus.edu", username="driver", hashed_password=pass_hash, full_name="John Delivery Partner", role="DELIVERY_PARTNER")
            db.add(user)
            db.commit()
            db.refresh(user)
        elif identifier in ["operator@campus.edu", "operator", "admin@campus.edu", "admin", "sarah"] and req.password in ["operator123", "admin123"] and req.role == "OPERATIONS_MANAGER":
            user = User(id=3, email="operator@campus.edu", username="operator", hashed_password=pass_hash, full_name="Dr. Sarah Operator", role="OPERATIONS_MANAGER")
            db.add(user)
            db.commit()
            db.refresh(user)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email/username and password."
        )

    # 3. Verify role match
    if user.role != req.role:
        role_label = "User / Student" if req.role == "STUDENT" else "Delivery Person" if req.role == "DELIVERY_PARTNER" else "Campus Operator"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role mismatch. Account exists, but is not registered for {role_label} access."
        )

    # 4. Verify password
    if user.hashed_password and user.hashed_password != pass_hash:
        # Fallback check for demo credentials
        if req.password not in ["student123", "driver123", "operator123", "admin123"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password provided."
            )

    token = f"campusconnect_session_{user.id}_{user.role.lower()}_valid"

    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        token=token
    )

@router.get("/me")
def get_current_user():
    return {"status": "authenticated", "app": "CampusConnect"}
