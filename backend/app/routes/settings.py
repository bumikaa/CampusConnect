from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Campus, PickupLocation, SystemSettings
from app.schemas import CampusSchema, PickupLocationSchema, PickupLocationBase
from app.seed import seed_database

router = APIRouter(prefix="/api/settings", tags=["Settings & Configuration"])

@router.get("/campuses", response_model=List[CampusSchema])
def get_campuses(db: Session = Depends(get_db)):
    return db.query(Campus).all()

@router.get("/pickup-locations", response_model=List[PickupLocationSchema])
def get_pickup_locations(db: Session = Depends(get_db)):
    return db.query(PickupLocation).all()

@router.post("/pickup-locations", response_model=PickupLocationSchema)
def add_pickup_location(loc: PickupLocationBase, db: Session = Depends(get_db)):
    db_loc = PickupLocation(
        campus_id=loc.campus_id,
        name=loc.name,
        building=loc.building,
        room_number=loc.room_number,
        operating_hours=loc.operating_hours,
        is_active=loc.is_active
    )
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return db_loc

@router.post("/reset-demo-data")
def reset_demo_data():
    seed_database()
    return {"message": "Demo data successfully reset to clean initial seed state."}
