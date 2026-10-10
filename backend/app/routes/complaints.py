from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.database import get_db
from app.models import Complaint, Parcel, ParcelEvent
from app.schemas import ComplaintCreate, ComplaintSchema
from app.crud import log_parcel_event

router = APIRouter(prefix="/api/complaints", tags=["Student Complaints & Feedback"])

@router.post("", response_model=ComplaintSchema)
def submit_complaint(
    req: ComplaintCreate,
    db: Session = Depends(get_db)
):
    parcel = db.query(Parcel).filter(Parcel.id == req.parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel record not found")

    complaint = Complaint(
        parcel_id=req.parcel_id,
        student_name=req.student_name,
        student_contact=req.student_contact,
        complaint_type=req.complaint_type,
        feedback_text=req.feedback_text,
        status="PENDING",
        created_at=datetime.datetime.now()
    )
    db.add(complaint)

    # Log event on parcel
    log_parcel_event(
        db=db,
        parcel_id=req.parcel_id,
        batch_id=parcel.batch_id,
        prev_status=parcel.status,
        new_status=parcel.status,
        event_type="COMPLAINT_FILED",
        actor_role="STUDENT",
        actor_name=req.student_name,
        details=f"Complaint filed ({req.complaint_type}): {req.feedback_text}"
    )

    db.commit()
    db.refresh(complaint)
    return complaint

@router.get("", response_model=List[ComplaintSchema])
def list_complaints(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Complaint)
    if status_filter:
        q = q.filter(Complaint.status == status_filter)
    return q.order_by(Complaint.created_at.desc()).all()

@router.post("/{complaint_id}/resolve")
def resolve_complaint(
    complaint_id: int,
    notes: Optional[str] = "Resolved by Campus Operator",
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found")

    complaint.status = "RESOLVED"
    db.commit()
    db.refresh(complaint)
    return {"message": "Complaint marked as resolved", "complaint_id": complaint_id}
