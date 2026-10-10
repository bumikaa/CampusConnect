from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import os, datetime
import pandas as pd

from app.database import get_db
from app.models import Parcel, DeliveryBatch, ParcelEvent
from app.schemas import HandoverRequest, FailHandoverRequest, StatusUpdateRequest, ParcelSchema
from app.crud import (
    format_parcel_response,
    confirm_handover,
    mark_failed_handover,
    validate_state_transition,
    log_parcel_event,
    update_batch_counts
)

router = APIRouter(prefix="/api/parcels", tags=["Parcels"])

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASE_DATASET_DIR = PROJECT_ROOT if os.path.exists(os.path.join(PROJECT_ROOT, "olist_orders_dataset.csv")) else r"C:\Users\BUMIKAA V\.gemini\antigravity\scratch\CampusConnect"
SHELVES = ["Bin 1A", "Bin 1B", "Bin 2A", "Bin 2C", "Shelf 3-Top", "Shelf 3-Bottom", "Overflow Rack A", "Locker Pod 4"]

@router.get("")
def search_parcels(
    query: Optional[str] = Query(None, description="Search by tracking ID, order ref, or recipient name"),
    batch_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    campus_id: Optional[int] = Query(None),
    limit: int = 100,
    db: Session = Depends(get_db)
):
    q = db.query(Parcel)

    if batch_id:
        q = q.filter(Parcel.batch_id == batch_id)
    if campus_id:
        q = q.filter(Parcel.campus_id == campus_id)
    if status_filter:
        if status_filter == "PENDING":
            q = q.filter(Parcel.status.in_(["BATCH_CREATED", "IDENTIFIED", "AWAITING_HANDOVER"]))
        elif status_filter == "FAILED":
            q = q.filter(Parcel.status.in_(["FAILED_ATTEMPT", "RESOLUTION_PENDING"]))
        elif status_filter == "RECOVERY":
            q = q.filter(Parcel.status.in_(["RESOLUTION_PENDING", "REDELIVERY_SCHEDULED", "PICKUP_REQUESTED", "ESCALATED"]))
        else:
            q = q.filter(Parcel.status == status_filter)

    if query and query.strip():
        term = f"%{query.strip()}%"
        q = q.filter(
            or_(
                Parcel.tracking_id.ilike(term),
                Parcel.order_ref.ilike(term),
                Parcel.recipient_name.ilike(term),
                Parcel.id.ilike(term)
            )
        )

    parcels = q.order_by(Parcel.updated_at.desc()).limit(limit).all()
    return [format_parcel_response(p) for p in parcels]

@router.get("/{parcel_id_or_tracking}")
def get_parcel(parcel_id_or_tracking: str, db: Session = Depends(get_db)):
    clean_search = parcel_id_or_tracking.strip().lower()
    
    # 1. Search in DB first
    parcel = db.query(Parcel).filter(
        or_(
            Parcel.id.ilike(clean_search),
            Parcel.tracking_id.ilike(clean_search),
            Parcel.order_ref.ilike(clean_search)
        )
    ).first()

    if parcel:
        return format_parcel_response(parcel)

    # 2. On-demand lookup against 99,441 Kaggle dataset orders if not yet in active DB batch
    orders_path = os.path.join(BASE_DATASET_DIR, 'olist_orders_dataset.csv')
    if os.path.exists(orders_path):
        try:
            orders_df = pd.read_csv(orders_path)
            # Remove TRK- or ORD- prefixes if student searched with prefix
            raw_target = clean_search.replace("trk-", "").replace("ord-", "").replace("pcl-", "")
            
            matching_rows = orders_df[orders_df['order_id'].str.lower().str.contains(raw_target, na=False)]
            if len(matching_rows) > 0:
                row = matching_rows.iloc[0]
                order_id = str(row['order_id'])
                
                # Fetch customer & item details
                customers_path = os.path.join(BASE_DATASET_DIR, 'olist_customers_dataset.csv')
                items_path = os.path.join(BASE_DATASET_DIR, 'olist_order_items_dataset.csv')
                products_path = os.path.join(BASE_DATASET_DIR, 'olist_products_dataset.csv')
                
                city = "Campus District"
                state = "Main Quad"
                cust_unique = order_id[:8]
                cat = "E-Commerce Goods"
                
                if os.path.exists(customers_path):
                    cust_df = pd.read_csv(customers_path)
                    match_cust = cust_df[cust_df['customer_id'] == row['customer_id']]
                    if len(match_cust) > 0:
                        c_row = match_cust.iloc[0]
                        city = str(c_row.get('customer_city', city)).title()
                        state = str(c_row.get('customer_state', state)).upper()
                        cust_unique = str(c_row.get('customer_unique_id', cust_unique))
                
                if os.path.exists(items_path):
                    items_df = pd.read_csv(items_path)
                    match_item = items_df[items_df['order_id'] == order_id]
                    if len(match_item) > 0 and os.path.exists(products_path):
                        p_id = match_item.iloc[0]['product_id']
                        prod_df = pd.read_csv(products_path)
                        match_p = prod_df[prod_df['product_id'] == p_id]
                        if len(match_p) > 0 and pd.notnull(match_p.iloc[0].get('product_category_name')):
                            cat = str(match_p.iloc[0]['product_category_name']).replace('_', ' ').title()

                pcl_id = f"PCL-{order_id[:8].upper()}"
                trk_id = f"TRK-{order_id[:8].upper()}"
                ord_ref = f"ORD-{order_id[:12].upper()}"
                now = datetime.datetime.now()

                raw_status = str(row.get('order_status', 'delivered')).lower()
                if raw_status == 'delivered':
                    status_str = 'HANDED_OVER'
                    failed_reason = None
                elif raw_status in ['canceled']:
                    status_str = 'FAILED_ATTEMPT'
                    failed_reason = 'RECIPIENT_UNAVAILABLE'
                elif raw_status in ['unavailable']:
                    status_str = 'RESOLUTION_PENDING'
                    failed_reason = 'PARCEL_NOT_FOUND'
                else:
                    status_str = 'AWAITING_HANDOVER'
                    failed_reason = None

                new_parcel = Parcel(
                    id=pcl_id,
                    tracking_id=trk_id,
                    order_ref=ord_ref,
                    batch_id="BATCH-20261010-01",
                    campus_id=1,
                    recipient_name=f"Customer {cust_unique[:8].upper()}",
                    recipient_phone=f"+1-555-{(hash(order_id)%900)+100:03d}-{(hash(cust_unique)%9000)+1000:04d}",
                    recipient_hostel=f"Campus District ({city}, {state})",
                    parcel_description=cat,
                    shelf_location=SHELVES[hash(order_id) % len(SHELVES)],
                    status=status_str,
                    failed_reason=failed_reason,
                    created_at=now,
                    updated_at=now
                )
                db.add(new_parcel)
                
                log_parcel_event(
                    db=db,
                    parcel_id=pcl_id,
                    batch_id="BATCH-20261010-01",
                    prev_status="NONE",
                    new_status=status_str,
                    event_type="ON_DEMAND_LOOKUP",
                    actor_role="STUDENT",
                    actor_name="Student Portal",
                    details=f"On-demand lookup mapped order '{order_id}' from Kaggle dataset"
                )
                
                db.commit()
                db.refresh(new_parcel)
                update_batch_counts(db, "BATCH-20261010-01")
                return format_parcel_response(new_parcel)
        except Exception as e:
            print(f"On-demand Kaggle lookup error: {e}")

    raise HTTPException(
        status_code=404,
        detail=f"No parcel found matching tracking ID, order ref, or parcel ID '{parcel_id_or_tracking}'."
    )

@router.post("/{parcel_id}/handover")
def api_confirm_handover(parcel_id: str, req: HandoverRequest, db: Session = Depends(get_db)):
    return confirm_handover(db, parcel_id, req)

@router.post("/{parcel_id}/fail")
def api_mark_failed(parcel_id: str, req: FailHandoverRequest, db: Session = Depends(get_db)):
    return mark_failed_handover(db, parcel_id, req)

@router.patch("/{parcel_id}/status")
def update_parcel_status(parcel_id: str, req: StatusUpdateRequest, db: Session = Depends(get_db)):
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    validate_state_transition(parcel.status, req.new_status)

    prev_status = parcel.status
    parcel.status = req.new_status
    if req.reason:
        parcel.failed_reason = req.reason
    if req.notes:
        parcel.resolution_notes = req.notes

    log_parcel_event(
        db=db,
        parcel_id=parcel.id,
        batch_id=parcel.batch_id,
        prev_status=prev_status,
        new_status=req.new_status,
        event_type="STATUS_CHANGE",
        actor_role=req.actor_role,
        actor_name=req.actor_name,
        reason=req.reason,
        details=req.notes or f"Status updated to {req.new_status}"
    )

    db.commit()
    db.refresh(parcel)
    update_batch_counts(db, parcel.batch_id)
    return format_parcel_response(parcel)
