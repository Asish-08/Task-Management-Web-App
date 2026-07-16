from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import User
from app.schemas import LoginIn, ProfileUpdate, SignupIn, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenOut, status_code=201)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    username = payload.username.strip()
    if db.query(User).filter(func.lower(User.username) == username.lower()).first():
        raise HTTPException(status_code=409, detail="Username already taken")
    user = User(username=username, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    username = payload.username.strip()
    user = db.query(User).filter(func.lower(User.username) == username.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()
    duplicate = (
        db.query(User)
        .filter(func.lower(User.email) == email, User.id != current_user.id)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    current_user.name = payload.name
    current_user.email = email
    current_user.bio = (payload.bio or "").strip() or None
    db.commit()
    db.refresh(current_user)
    return current_user
