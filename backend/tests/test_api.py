import pytest
from fastapi.testclient import TestClient
import io
from app.main import app
from app.seed import seed_database
from app.database import SessionLocal
from app.models import Parcel, ParcelEvent, DeliveryBatch, RecoveryRequest
import datetime

client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    seed_database()
    # Populate a test parcel dynamically for API workflow testing
    db = SessionLocal()
    try:
        now = datetime.datetime.now()
        test_pcl = Parcel(
            id="PCL-TEST-001",
            tracking_id="TRK-TEST-999",
            batch_id="BATCH-20261010-01",
            recipient_name="Taylor Swift",
            recipient_phone="555-0192",
            recipient_hostel="Hostel A - Room 302",
            status="AWAITING_HANDOVER",
            created_at=now,
            updated_at=now
        )
        db.add(test_pcl)
        # Update batch total
        batch = db.query(DeliveryBatch).filter(DeliveryBatch.id == "BATCH-20261010-01").first()
        if batch:
            batch.total_parcels = 1
            batch.pending_count = 1
        db.commit()
    finally:
        db.close()
    yield

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_list_batches():
    response = client.get("/api/batches")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert "id" in data[0]

def test_search_parcel_by_tracking():
    response = client.get("/api/parcels/TRK-TEST-999")
    assert response.status_code == 200
    data = response.json()
    assert data["tracking_id"] == "TRK-TEST-999"
    assert "recipient_name_masked" in data

def test_confirm_handover_and_duplicate_prevention():
    # Fetch an awaiting handover parcel
    res = client.get("/api/parcels?status_filter=AWAITING_HANDOVER")
    parcels = res.json()
    assert len(parcels) > 0
    pcl_id = parcels[0]["id"]

    # 1. Confirm Handover
    h_res = client.post(f"/api/parcels/{pcl_id}/handover", json={"actor_name": "Test Driver", "notes": "Handed over"})
    assert h_res.status_code == 200
    assert h_res.json()["status"] == "HANDED_OVER"

    # 2. Try Duplicate Handover -> Expect 400 error
    h_res_dup = client.post(f"/api/parcels/{pcl_id}/handover", json={"actor_name": "Test Driver"})
    assert h_res_dup.status_code == 400
    assert "Duplicate handover blocked" in h_res_dup.json()["detail"]

def test_fail_handover_workflow():
    res = client.get("/api/parcels?status_filter=AWAITING_HANDOVER")
    parcels = res.json()
    pcl_id = parcels[0]["id"]

    fail_res = client.post(f"/api/parcels/{pcl_id}/fail", json={
        "reason": "RECIPIENT_UNAVAILABLE",
        "actor_name": "Test Driver",
        "notes": "Student in class"
    })
    assert fail_res.status_code == 200
    data = fail_res.json()
    assert data["status"] == "RESOLUTION_PENDING"
    assert data["failed_reason"] == "RECIPIENT_UNAVAILABLE"

def test_recovery_request_campus_pickup():
    # First set status to RESOLUTION_PENDING so it appears in recovery queue
    res = client.get("/api/parcels?status_filter=AWAITING_HANDOVER")
    parcels = res.json()
    pcl_id = parcels[0]["id"]

    client.post(f"/api/parcels/{pcl_id}/fail", json={
        "reason": "RECIPIENT_UNAVAILABLE",
        "actor_name": "Test Driver"
    })

    q_res = client.get("/api/recovery/queue")
    queue = q_res.json()
    assert len(queue) > 0

    rec_res = client.post(f"/api/recovery/parcels/{pcl_id}/action", json={
        "action_type": "CAMPUS_PICKUP",
        "requested_by": "STUDENT",
        "preferred_pickup_location_id": 1,
        "preferred_time_slot": "15:00 - 17:00",
        "notes": "Will pick up after lecture"
    })
    assert rec_res.status_code == 200
    assert rec_res.json()["status"] == "PICKUP_REQUESTED"

def test_analytics_endpoint():
    res = client.get("/api/analytics")
    assert res.status_code == 200
    data = res.json()
    assert "total_processed" in data
    assert "success_rate_pct" in data
    assert "failure_reasons_distribution" in data

def test_export_csv():
    res = client.get("/api/export/csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "Parcel ID,Tracking ID" in res.text

def test_auth_login_all_roles():
    # 1. Student login success
    s_res = client.post("/api/auth/login", json={
        "email_or_username": "student@campus.edu",
        "password": "student123",
        "role": "STUDENT"
    })
    assert s_res.status_code == 200
    assert s_res.json()["role"] == "STUDENT"
    assert "token" in s_res.json()

    # 2. Driver login success
    d_res = client.post("/api/auth/login", json={
        "email_or_username": "driver@campus.edu",
        "password": "driver123",
        "role": "DELIVERY_PARTNER"
    })
    assert d_res.status_code == 200
    assert d_res.json()["role"] == "DELIVERY_PARTNER"

    # 3. Operator login success
    o_res = client.post("/api/auth/login", json={
        "email_or_username": "operator@campus.edu",
        "password": "operator123",
        "role": "OPERATIONS_MANAGER"
    })
    assert o_res.status_code == 200
    assert o_res.json()["role"] == "OPERATIONS_MANAGER"

    # 4. Role mismatch rejection
    m_res = client.post("/api/auth/login", json={
        "email_or_username": "student@campus.edu",
        "password": "student123",
        "role": "OPERATIONS_MANAGER"
    })
    assert m_res.status_code == 403
    assert "Role mismatch" in m_res.json()["detail"]

    # 5. Bad password rejection
    b_res = client.post("/api/auth/login", json={
        "email_or_username": "student@campus.edu",
        "password": "wrongpassword",
        "role": "STUDENT"
    })
    assert b_res.status_code in [401, 403]


