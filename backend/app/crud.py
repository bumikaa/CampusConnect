import datetime
import uuid
import re
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from fastapi import HTTPException, status
from app.models import Campus, PickupLocation, DeliveryBatch, Parcel, ParcelEvent, RecoveryRequest, SystemSettings
from app.schemas import ParcelCreate, HandoverRequest, FailHandoverRequest, RecoveryRequestCreate, StatusUpdateRequest

VALID_STATUSES = [
    "BATCH_CREATED",
    "IDENTIFIED",
    "AWAITING_HANDOVER",
    "HANDED_OVER",
    "FAILED_ATTEMPT",
    "RESOLUTION_PENDING",
    "REDELIVERY_SCHEDULED",
    "PICKUP_REQUESTED",
    "FORMALLY_CLOSED",
    "ESCALATED"
]

def mask_name(name: str) -> str:
    if not name:
        return "***"
    parts = name.strip().split()
    masked_parts = []
    for part in parts:
        if len(part) <= 2:
            masked_parts.append(part[0] + "*")
        else:
            masked_parts.append(part[0] + "*" * (len(part) - 2) + part[-1])
    return " ".join(masked_parts)

def mask_phone(phone: str) -> str:
    if not phone:
        return "***"
    digits = re.sub(r'\D', '', phone)
    if len(digits) >= 10:
        return f"+{digits[:2]}-***-***-{digits[-4:]}"
    return f"***-***-{digits[-3:] if len(digits)>=3 else '000'}"

def format_parcel_response(parcel: Parcel) -> dict:
    return {
        "id": parcel.id,
        "tracking_id": parcel.tracking_id,
        "order_ref": parcel.order_ref,
        "batch_id": parcel.batch_id,
        "campus_id": parcel.campus_id,
        "recipient_name": parcel.recipient_name,
        "recipient_name_masked": mask_name(parcel.recipient_name),
        "recipient_phone": parcel.recipient_phone,
        "recipient_phone_masked": mask_phone(parcel.recipient_phone),
        "recipient_hostel": parcel.recipient_hostel,
        "parcel_description": parcel.parcel_description,
        "shelf_location": parcel.shelf_location or "Unassigned",
        "status": parcel.status,
        "failed_reason": parcel.failed_reason,
        "pickup_location_id": parcel.pickup_location_id,
        "redelivery_time": parcel.redelivery_time,
        "resolution_notes": parcel.resolution_notes,
        "created_at": parcel.created_at,
        "updated_at": parcel.updated_at,
        "events": [
            {
                "id": e.id,
                "parcel_id": e.parcel_id,
                "batch_id": e.batch_id,
                "previous_status": e.previous_status,
                "new_status": e.new_status,
                "event_type": e.event_type,
                "reason": e.reason,
                "actor_role": e.actor_role,
                "actor_name": e.actor_name,
                "timestamp": e.timestamp,
                "details": e.details
            } for e in parcel.events
        ],
        "recovery_requests": [
            {
                "id": r.id,
                "parcel_id": r.parcel_id,
                "requested_by": r.requested_by,
                "action_type": r.action_type,
                "preferred_pickup_location_id": r.preferred_pickup_location_id,
                "preferred_time_slot": r.preferred_time_slot,
                "notes": r.notes,
                "status": r.status,
                "created_at": r.created_at
            } for r in parcel.recovery_requests
        ]
    }

def update_batch_counts(db: Session, batch_id: str):
    batch = db.query(DeliveryBatch).filter(DeliveryBatch.id == batch_id).first()
    if not batch:
        return
    parcels = db.query(Parcel).filter(Parcel.batch_id == batch_id).all()
    batch.total_parcels = len(parcels)
    batch.handed_over_count = sum(1 for p in parcels if p.status == "HANDED_OVER")
    batch.failed_count = sum(1 for p in parcels if p.status in ["FAILED_ATTEMPT", "RESOLUTION_PENDING", "ESCALATED"])
    batch.pending_count = sum(1 for p in parcels if p.status in ["BATCH_CREATED", "IDENTIFIED", "AWAITING_HANDOVER", "REDELIVERY_SCHEDULED", "PICKUP_REQUESTED"])
    db.commit()

def validate_state_transition(current_status: str, new_status: str):
    if current_status == "HANDED_OVER" and new_status == "HANDED_OVER":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate handover blocked: Parcel has already been handed over."
        )
    if current_status == "FORMALLY_CLOSED" and new_status != "FORMALLY_CLOSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot alter status of a formally closed parcel record."
        )

def log_parcel_event(
    db: Session,
    parcel_id: str,
    batch_id: str,
    prev_status: str,
    new_status: str,
    event_type: str,
    actor_role: str,
    actor_name: str,
    reason: str = None,
    details: str = None
):
    event = ParcelEvent(
        parcel_id=parcel_id,
        batch_id=batch_id,
        previous_status=prev_status,
        new_status=new_status,
        event_type=event_type,
        reason=reason,
        actor_role=actor_role,
        actor_name=actor_name,
        timestamp=datetime.datetime.utcnow(),
        details=details
    )
    db.add(event)

def confirm_handover(db: Session, parcel_id: str, req: HandoverRequest) -> dict:
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    
    validate_state_transition(parcel.status, "HANDED_OVER")

    prev_status = parcel.status
    parcel.status = "HANDED_OVER"
    parcel.updated_at = datetime.datetime.utcnow()

    log_parcel_event(
        db=db,
        parcel_id=parcel.id,
        batch_id=parcel.batch_id,
        prev_status=prev_status,
        new_status="HANDED_OVER",
        event_type="HANDOVER_SUCCESS",
        actor_role="DELIVERY_PARTNER",
        actor_name=req.actor_name,
        details=req.notes or "Handover confirmed successfully to student."
    )

    db.commit()
    db.refresh(parcel)
    update_batch_counts(db, parcel.batch_id)
    return format_parcel_response(parcel)

def mark_failed_handover(db: Session, parcel_id: str, req: FailHandoverRequest) -> dict:
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    
    validate_state_transition(parcel.status, "FAILED_ATTEMPT")

    prev_status = parcel.status
    parcel.status = "FAILED_ATTEMPT"
    parcel.failed_reason = req.reason
    parcel.updated_at = datetime.datetime.utcnow()

    log_parcel_event(
        db=db,
        parcel_id=parcel.id,
        batch_id=parcel.batch_id,
        prev_status=prev_status,
        new_status="FAILED_ATTEMPT",
        event_type="STATUS_CHANGE",
        actor_role="DELIVERY_PARTNER",
        actor_name=req.actor_name,
        reason=req.reason,
        details=req.notes or f"Handover failed. Reason: {req.reason}"
    )

    # Automatically log initial resolution pending state
    parcel.status = "RESOLUTION_PENDING"
    log_parcel_event(
        db=db,
        parcel_id=parcel.id,
        batch_id=parcel.batch_id,
        prev_status="FAILED_ATTEMPT",
        new_status="RESOLUTION_PENDING",
        event_type="STATUS_CHANGE",
        actor_role="SYSTEM",
        actor_name="Recovery Workflow Engine",
        reason=req.reason,
        details="Parcel added to Failed Delivery Recovery queue awaiting student or manager action."
    )

    db.commit()
    db.refresh(parcel)
    update_batch_counts(db, parcel.batch_id)
    return format_parcel_response(parcel)

def create_recovery_request(db: Session, parcel_id: str, req: RecoveryRequestCreate) -> dict:
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    rec = RecoveryRequest(
        parcel_id=parcel_id,
        requested_by=req.requested_by,
        action_type=req.action_type,
        preferred_pickup_location_id=req.preferred_pickup_location_id,
        preferred_time_slot=req.preferred_time_slot,
        notes=req.notes,
        status="APPROVED",
        created_at=datetime.datetime.utcnow()
    )
    db.add(rec)

    prev_status = parcel.status
    if req.action_type == "CAMPUS_PICKUP":
        parcel.status = "PICKUP_REQUESTED"
        parcel.pickup_location_id = req.preferred_pickup_location_id
    elif req.action_type == "SCHEDULE_REDELIVERY":
        parcel.status = "REDELIVERY_SCHEDULED"
        parcel.redelivery_time = datetime.datetime.utcnow() + datetime.timedelta(days=1)
    elif req.action_type == "ESCALATE_SEARCH":
        parcel.status = "ESCALATED"
    elif req.action_type == "REFER_REFUND":
        parcel.status = "FORMALLY_CLOSED"
        parcel.resolution_notes = "Referred for refund review per policy."
    
    parcel.updated_at = datetime.datetime.utcnow()

    log_parcel_event(
        db=db,
        parcel_id=parcel.id,
        batch_id=parcel.batch_id,
        prev_status=prev_status,
        new_status=parcel.status,
        event_type="RECOVERY_REQUEST",
        actor_role=req.requested_by,
        actor_name=f"{req.requested_by.title()} User",
        reason=req.action_type,
        details=f"Recovery choice: {req.action_type}. Slot/Notes: {req.preferred_time_slot or ''} {req.notes or ''}"
    )

    db.commit()
    db.refresh(parcel)
    update_batch_counts(db, parcel.batch_id)
    return format_parcel_response(parcel)
