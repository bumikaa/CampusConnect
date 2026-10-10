import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Parcel

router = APIRouter(prefix="/api/export", tags=["Export Reports"])

@router.get("/csv")
def export_parcels_csv(db: Session = Depends(get_db)):
    parcels = db.query(Parcel).order_by(Parcel.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Parcel ID",
        "Tracking ID",
        "Order Reference",
        "Batch ID",
        "Campus ID",
        "Recipient Name",
        "Recipient Hostel",
        "Parcel Description",
        "Shelf Location",
        "Status",
        "Failure Reason",
        "Created At",
        "Updated At"
    ])

    for p in parcels:
        writer.writerow([
            p.id,
            p.tracking_id,
            p.order_ref,
            p.batch_id,
            p.campus_id,
            p.recipient_name,
            p.recipient_hostel,
            p.parcel_description,
            p.shelf_location,
            p.status,
            p.failed_reason or "",
            p.created_at.isoformat() if p.created_at else "",
            p.updated_at.isoformat() if p.updated_at else ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=amazon_campus_connect_operational_report.csv"}
    )
