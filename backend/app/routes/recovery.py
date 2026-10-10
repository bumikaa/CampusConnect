from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Parcel, RecoveryRequest
from app.schemas import RecoveryRequestCreate
from app.crud import format_parcel_response, create_recovery_request

router = APIRouter(prefix="/api/recovery", tags=["Failed Delivery Recovery"])

@router.get("/queue")
def get_recovery_queue(
    campus_id: Optional[int] = None,
    failure_reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Parcel).filter(
        Parcel.status.in_(["FAILED_ATTEMPT", "RESOLUTION_PENDING", "REDELIVERY_SCHEDULED", "PICKUP_REQUESTED", "ESCALATED"])
    )
    if campus_id:
        q = q.filter(Parcel.campus_id == campus_id)
    if failure_reason:
        q = q.filter(Parcel.failed_reason == failure_reason)

    unresolved_parcels = q.order_by(Parcel.updated_at.desc()).all()
    return [format_parcel_response(p) for p in unresolved_parcels]

@router.post("/parcels/{parcel_id}/action")
def submit_recovery_action(
    parcel_id: str,
    req: RecoveryRequestCreate,
    db: Session = Depends(get_db)
):
    return create_recovery_request(db, parcel_id, req)
