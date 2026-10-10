import csv
import io
import datetime
import uuid
import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import DeliveryBatch, Parcel, ParcelEvent, Campus
from app.schemas import DeliveryBatchSchema, DeliveryBatchCreate
from app.crud import update_batch_counts, format_parcel_response, log_parcel_event

router = APIRouter(prefix="/api/batches", tags=["Delivery Batches"])

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASE_DATASET_DIR = PROJECT_ROOT if os.path.exists(os.path.join(PROJECT_ROOT, "olist_orders_dataset.csv")) else r"C:\Users\BUMIKAA V\.gemini\antigravity\scratch\CampusConnect"
SHELVES = ["Bin 1A", "Bin 1B", "Bin 2A", "Bin 2C", "Shelf 3-Top", "Shelf 3-Bottom", "Overflow Rack A", "Locker Pod 4"]

@router.get("", response_model=List[DeliveryBatchSchema])
def list_batches(db: Session = Depends(get_db)):
    batches = db.query(DeliveryBatch).order_by(DeliveryBatch.created_at.desc()).all()
    for b in batches:
        update_batch_counts(db, b.id)
    return db.query(DeliveryBatch).order_by(DeliveryBatch.created_at.desc()).all()

@router.post("", response_model=DeliveryBatchSchema)
def create_batch(req: DeliveryBatchCreate, db: Session = Depends(get_db)):
    campus = db.query(Campus).filter(Campus.id == req.campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    
    today_str = datetime.datetime.now().strftime("%Y%m%d")
    count_today = db.query(DeliveryBatch).filter(DeliveryBatch.id.like(f"BATCH-{today_str}%")).count()
    batch_id = f"BATCH-{today_str}-{(count_today + 1):02d}"

    batch = DeliveryBatch(
        id=batch_id,
        campus_id=req.campus_id,
        driver_id=req.driver_id,
        driver_name=req.driver_name,
        status="IN_PROGRESS",
        created_at=datetime.datetime.now()
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch

@router.get("/{batch_id}")
def get_batch_detail(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(DeliveryBatch).filter(DeliveryBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    update_batch_counts(db, batch_id)
    parcels = db.query(Parcel).filter(Parcel.batch_id == batch_id).all()
    return {
        "batch": DeliveryBatchSchema.model_validate(batch),
        "parcels": [format_parcel_response(p) for p in parcels]
    }

@router.post("/{batch_id}/import-csv")
async def import_batch_csv(
    batch_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    batch = db.query(DeliveryBatch).filter(DeliveryBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

    # 1. Multi-encoding fallback detection
    text = None
    for enc in ["utf-8-sig", "utf-8", "latin-1", "cp1252", "iso-8859-1"]:
        try:
            text = content.decode(enc)
            break
        except UnicodeDecodeError:
            continue

    if text is None:
        raise HTTPException(status_code=400, detail="Could not decode CSV file. Please upload a UTF-8 or Latin-1 encoded CSV file.")

    # 2. Delimiter detection
    first_line = text.splitlines()[0] if text.splitlines() else ""
    delimiter = ","
    if ";" in first_line and first_line.count(";") > first_line.count(","):
        delimiter = ";"
    elif "\t" in first_line and first_line.count("\t") > first_line.count(","):
        delimiter = "\t"
    elif "|" in first_line and first_line.count("|") > first_line.count(","):
        delimiter = "|"

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    headers = [h.strip().lower() for h in (reader.fieldnames or []) if h]

    is_kaggle_orders = any(k in headers for k in ["order_id", "olist_order_id"])
    is_kaggle_items = "order_item_id" in headers or "product_id" in headers
    is_standard_format = any(k in headers for k in ["tracking_id", "parcel_id"])

    if not is_kaggle_orders and not is_kaggle_items and not is_standard_format:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unrecognized CSV columns ({', '.join(headers[:5])}). Expected columns like 'order_id', 'customer_id', 'tracking_id', or 'recipient_name'."
        )

    imported_count = 0
    duplicate_count = 0
    errors = []

    # Pre-load customers mapping if present in BASE_DATASET_DIR for rich context mapping
    cust_map = {}
    c_path = os.path.join(BASE_DATASET_DIR, 'olist_customers_dataset.csv')
    if os.path.exists(c_path):
        try:
            c_df = pd.read_csv(c_path)
            for _, r in c_df.iterrows():
                cust_map[str(r['customer_id'])] = (str(r.get('customer_city', 'Campus District')).title(), str(r.get('customer_state', 'Main Quad')).upper(), str(r.get('customer_unique_id', r['customer_id'])))
        except Exception:
            pass

    now = datetime.datetime.now()

    for row_idx, row in enumerate(reader, start=2):
        if not row:
            continue
        row_clean = {k.strip().lower(): v.strip() for k, v in row.items() if k and v is not None}

        if is_kaggle_orders or is_kaggle_items:
            order_id = row_clean.get("order_id") or row_clean.get("olist_order_id")
            if not order_id:
                errors.append(f"Row {row_idx}: Missing 'order_id'.")
                continue

            customer_id = row_clean.get("customer_id") or row_clean.get("customer_unique_id")
            city = row_clean.get("customer_city") or row_clean.get("city")
            state = row_clean.get("customer_state") or row_clean.get("state")
            category = row_clean.get("product_category_name") or row_clean.get("category")

            if customer_id and customer_id in cust_map:
                mapped_city, mapped_state, cust_uniq = cust_map[customer_id]
                city = city or mapped_city
                state = state or mapped_state
            else:
                city = city or "Campus District"
                state = state or "Main Quad"

            category = category or "E-Commerce Goods"

            trk_id = f"TRK-{order_id[:8].upper()}"
            ord_ref = f"ORD-{order_id[:12].upper()}"
            name = f"Customer {(customer_id or order_id)[:8].upper()}"
            phone = f"+1-555-{(hash(order_id)%900)+100:03d}-{(hash(order_id)%9000)+1000:04d}"
            hostel = f"Campus Hostel ({city.title()}, {state.upper()})"
            desc = category.replace("_", " ").title()
            shelf = SHELVES[row_idx % len(SHELVES)]

            raw_status = row_clean.get("order_status", "delivered").lower()
            if raw_status == 'delivered':
                status_val = 'HANDED_OVER'
                failed_reason = None
            elif raw_status in ['canceled']:
                status_val = 'FAILED_ATTEMPT'
                failed_reason = 'RECIPIENT_UNAVAILABLE'
            elif raw_status in ['unavailable']:
                status_val = 'RESOLUTION_PENDING'
                failed_reason = 'PARCEL_NOT_FOUND'
            else:
                status_val = 'AWAITING_HANDOVER'
                failed_reason = None
        else:
            trk_id = row_clean.get("tracking_id") or f"TRK-{uuid.uuid4().hex[:8].upper()}"
            ord_ref = row_clean.get("order_ref") or f"ORD-{uuid.uuid4().hex[:6].upper()}"
            name = row_clean.get("recipient_name")
            phone = row_clean.get("recipient_phone") or "+1-555-000-0000"
            hostel = row_clean.get("recipient_hostel") or "Campus Reception"
            desc = row_clean.get("parcel_description") or "Standard Package"
            shelf = row_clean.get("shelf_location") or SHELVES[row_idx % len(SHELVES)]
            status_val = row_clean.get("status") or "AWAITING_HANDOVER"
            failed_reason = row_clean.get("failed_reason")

            if not name:
                errors.append(f"Row {row_idx}: Missing required recipient_name.")
                continue

        existing = db.query(Parcel).filter(Parcel.tracking_id == trk_id).first()
        if existing:
            duplicate_count += 1
            continue

        pcl_id = f"PCL-{uuid.uuid4().hex[:8].upper()}"

        parcel = Parcel(
            id=pcl_id,
            tracking_id=trk_id,
            order_ref=ord_ref,
            batch_id=batch_id,
            campus_id=batch.campus_id,
            recipient_name=name,
            recipient_phone=phone,
            recipient_hostel=hostel,
            parcel_description=desc,
            shelf_location=shelf,
            status=status_val,
            failed_reason=failed_reason,
            created_at=now,
            updated_at=now
        )
        db.add(parcel)

        log_parcel_event(
            db=db,
            parcel_id=pcl_id,
            batch_id=batch_id,
            prev_status="NONE",
            new_status=status_val,
            event_type="BATCH_IMPORT",
            actor_role="DELIVERY_PARTNER",
            actor_name=batch.driver_name,
            details=f"Imported via CSV ('{file.filename}')"
        )
        imported_count += 1

    db.commit()
    update_batch_counts(db, batch_id)

    return {
        "batch_id": batch_id,
        "imported_count": imported_count,
        "duplicate_count": duplicate_count,
        "error_count": len(errors),
        "errors": errors[:10]
    }
