import os
import datetime
import pandas as pd
import hashlib
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import Campus, PickupLocation, DeliveryBatch, Parcel, ParcelEvent, RecoveryRequest, SystemSettings, User

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASE_DATASET_DIR = PROJECT_ROOT if os.path.exists(os.path.join(PROJECT_ROOT, "olist_orders_dataset.csv")) else r"C:\Users\BUMIKAA V\.gemini\antigravity\scratch\CampusConnect"
SHELVES = ["Bin 1A", "Bin 1B", "Bin 2A", "Bin 2C", "Shelf 3-Top", "Shelf 3-Bottom", "Overflow Rack A", "Locker Pod 4"]

def seed_database():
    """Initializes database schema and populates real order records from the Kaggle dataset CSV files."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Campuses
        campuses = [
            Campus(id=1, code="MAIN-CAMPUS", name="Central University Campus", address="100 University Ave, Building A", contact_email="logistics@centraluniv.edu"),
            Campus(id=2, code="NORTH-CAMPUS", name="North Tech Institute", address="450 Innovation Parkway", contact_email="deliveries@northtech.edu"),
            Campus(id=3, code="SOUTH-CAMPUS", name="South Health Sciences Campus", address="720 Medical Center Drive", contact_email="parcels@southhealth.edu")
        ]
        db.add_all(campuses)
        db.commit()

        # 2. Pickup Locations
        pickups = [
            PickupLocation(id=1, campus_id=1, name="Student Union Logistics Hub", building="Student Union", room_number="G-14", operating_hours="08:00 - 20:00"),
            PickupLocation(id=2, campus_id=1, name="Hostel A Automated Lockers", building="Hostel A Lobby", room_number="Locker Bay 1", operating_hours="24/7 Access"),
            PickupLocation(id=3, campus_id=2, name="North Quad Parcel Center", building="Engineering Hall", room_number="102", operating_hours="09:00 - 18:00"),
            PickupLocation(id=4, campus_id=3, name="Medical Library Delivery Desk", building="Health Library", room_number="Main Desk", operating_hours="08:00 - 19:00")
        ]
        db.add_all(pickups)
        db.commit()

        # 2.5 Seed Initial Authenticated Users
        users = [
            User(
                id=1,
                email="student@campus.edu",
                username="student",
                hashed_password=hashlib.sha256("student123".encode()).hexdigest(),
                full_name="Alex Student",
                role="STUDENT"
            ),
            User(
                id=2,
                email="driver@campus.edu",
                username="driver",
                hashed_password=hashlib.sha256("driver123".encode()).hexdigest(),
                full_name="John Delivery Partner",
                role="DELIVERY_PARTNER"
            ),
            User(
                id=3,
                email="operator@campus.edu",
                username="operator",
                hashed_password=hashlib.sha256("operator123".encode()).hexdigest(),
                full_name="Dr. Sarah Operator",
                role="OPERATIONS_MANAGER"
            )
        ]
        db.add_all(users)
        db.commit()

        # 3. Create Delivery Batches

        now = datetime.datetime.now()
        batches = [
            DeliveryBatch(
                id="BATCH-20261010-01",
                campus_id=1,
                driver_id="DRV-1042",
                driver_name="Alex Rivera",
                status="IN_PROGRESS",
                created_at=now
            ),
            DeliveryBatch(
                id="BATCH-20261010-02",
                campus_id=1,
                driver_id="DRV-1088",
                driver_name="Marcus Chen",
                status="IN_PROGRESS",
                created_at=now - datetime.timedelta(hours=4)
            ),
            DeliveryBatch(
                id="BATCH-20261010-03",
                campus_id=2,
                driver_id="DRV-1120",
                driver_name="Priya Sharma",
                status="IN_PROGRESS",
                created_at=now - datetime.timedelta(hours=8)
            )
        ]
        db.add_all(batches)
        db.commit()

        # 4. Check for Kaggle CSV files and seed real order records
        orders_path = os.path.join(BASE_DATASET_DIR, 'olist_orders_dataset.csv')
        customers_path = os.path.join(BASE_DATASET_DIR, 'olist_customers_dataset.csv')
        items_path = os.path.join(BASE_DATASET_DIR, 'olist_order_items_dataset.csv')
        products_path = os.path.join(BASE_DATASET_DIR, 'olist_products_dataset.csv')

        if os.path.exists(orders_path):
            orders_df = pd.read_csv(orders_path)
            customers_df = pd.read_csv(customers_path) if os.path.exists(customers_path) else None
            items_df = pd.read_csv(items_path) if os.path.exists(items_path) else None
            products_df = pd.read_csv(products_path) if os.path.exists(products_path) else None

            # Sample first 450 orders to populate active delivery batches
            sample_df = orders_df.head(450).copy()

            if customers_df is not None:
                sample_df = sample_df.merge(customers_df, on='customer_id', how='left')

            if items_df is not None:
                first_items = items_df.drop_duplicates(subset=['order_id'], keep='first')
                sample_df = sample_df.merge(first_items[['order_id', 'product_id']], on='order_id', how='left')

            if products_df is not None and 'product_id' in sample_df.columns:
                sample_df = sample_df.merge(products_df[['product_id', 'product_category_name']], on='product_id', how='left')

            batch_ids = ["BATCH-20261010-01", "BATCH-20261010-02", "BATCH-20261010-03"]

            for idx, row in sample_df.iterrows():
                order_id = str(row['order_id'])
                cust_id = str(row.get('customer_unique_id', row['customer_id']))
                city = str(row.get('customer_city', 'Campus District')).title()
                state = str(row.get('customer_state', 'Main Quad')).upper()
                cat = str(row.get('product_category_name', 'E-Commerce Goods')).replace('_', ' ').title()

                pcl_id = f"PCL-{order_id[:8].upper()}"
                trk_id = f"TRK-{order_id[:8].upper()}"
                ord_ref = f"ORD-{order_id[:12].upper()}"
                b_id = batch_ids[idx % len(batch_ids)]
                shelf = SHELVES[idx % len(SHELVES)]

                raw_status = str(row.get('order_status', 'delivered')).lower()
                if raw_status == 'delivered':
                    status = 'HANDED_OVER'
                    failed_reason = None
                elif raw_status in ['canceled']:
                    status = 'FAILED_ATTEMPT'
                    failed_reason = 'RECIPIENT_UNAVAILABLE'
                elif raw_status in ['unavailable']:
                    status = 'RESOLUTION_PENDING'
                    failed_reason = 'PARCEL_NOT_FOUND'
                else:
                    status = 'AWAITING_HANDOVER'
                    failed_reason = None

                # Date parsing
                created_dt = now
                if 'order_purchase_timestamp' in row and pd.notnull(row['order_purchase_timestamp']):
                    try:
                        created_dt = pd.to_datetime(row['order_purchase_timestamp']).to_pydatetime()
                    except Exception:
                        created_dt = now

                parcel = Parcel(
                    id=pcl_id,
                    tracking_id=trk_id,
                    order_ref=ord_ref,
                    batch_id=b_id,
                    campus_id=1 if b_id != "BATCH-20261010-03" else 2,
                    recipient_name=f"Customer {cust_id[:8].upper()}",
                    recipient_phone=f"+1-555-{(hash(order_id)%900)+100:03d}-{(hash(cust_id)%9000)+1000:04d}",
                    recipient_hostel=f"Campus District ({city}, {state})",
                    parcel_description=cat if cat != 'Nan' else 'General Logistics Goods',
                    shelf_location=shelf,
                    status=status,
                    failed_reason=failed_reason,
                    created_at=created_dt,
                    updated_at=now
                )
                db.add(parcel)

                # Log event
                evt = ParcelEvent(
                    parcel_id=pcl_id,
                    batch_id=b_id,
                    previous_status="NONE",
                    new_status=status,
                    event_type="BATCH_IMPORT",
                    actor_role="DELIVERY_PARTNER",
                    actor_name="Alex Rivera" if b_id == "BATCH-20261010-01" else "Marcus Chen",
                    timestamp=created_dt,
                    details=f"Order '{order_id}' mapped cleanly from Kaggle dataset ({cat})"
                )
                db.add(evt)

            db.commit()

            # Update batch metrics for each batch
            for b in batches:
                parcels_in_b = db.query(Parcel).filter(Parcel.batch_id == b.id).all()
                b.total_parcels = len(parcels_in_b)
                b.handed_over_count = sum(1 for p in parcels_in_b if p.status == "HANDED_OVER")
                b.failed_count = sum(1 for p in parcels_in_b if p.status in ["FAILED_ATTEMPT", "RESOLUTION_PENDING", "ESCALATED"])
                b.pending_count = sum(1 for p in parcels_in_b if p.status in ["BATCH_CREATED", "IDENTIFIED", "AWAITING_HANDOVER", "REDELIVERY_SCHEDULED", "PICKUP_REQUESTED"])
            
            db.commit()
            print(f"Successfully seeded database with {len(sample_df)} real Kaggle dataset orders!")
        else:
            print("No Kaggle dataset CSV found. Seeding base schema.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
