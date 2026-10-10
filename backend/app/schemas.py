from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- Campus & Pickup Location ---
class CampusBase(BaseModel):
    code: str
    name: str
    address: str
    contact_email: str

class CampusSchema(CampusBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class PickupLocationBase(BaseModel):
    campus_id: int
    name: str
    building: str
    room_number: str
    operating_hours: str
    is_active: bool = True

class PickupLocationSchema(PickupLocationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Delivery Batch ---
class DeliveryBatchCreate(BaseModel):
    campus_id: int
    driver_id: str
    driver_name: str

class DeliveryBatchSchema(BaseModel):
    id: str
    campus_id: int
    driver_id: str
    driver_name: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    total_parcels: int
    handed_over_count: int
    failed_count: int
    pending_count: int

    model_config = ConfigDict(from_attributes=True)

# --- Parcel Event ---
class ParcelEventSchema(BaseModel):
    id: int
    parcel_id: str
    batch_id: Optional[str] = None
    previous_status: str
    new_status: str
    event_type: str
    reason: Optional[str] = None
    actor_role: str
    actor_name: str
    timestamp: datetime
    details: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Recovery Request ---
class RecoveryRequestCreate(BaseModel):
    action_type: str # SCHEDULE_REDELIVERY, CAMPUS_PICKUP, ESCALATE_SEARCH, DATA_CORRECTION, REFER_REFUND
    requested_by: str = "STUDENT" # STUDENT or OPERATIONS_MANAGER
    preferred_pickup_location_id: Optional[int] = None
    preferred_time_slot: Optional[str] = None
    notes: Optional[str] = None

class RecoveryRequestSchema(BaseModel):
    id: int
    parcel_id: str
    requested_by: str
    action_type: str
    preferred_pickup_location_id: Optional[int] = None
    preferred_time_slot: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Parcel ---
class ParcelCreate(BaseModel):
    tracking_id: str
    order_ref: str
    recipient_name: str
    recipient_phone: str
    recipient_hostel: str
    parcel_description: str
    shelf_location: Optional[str] = "Unassigned"
    batch_id: str
    campus_id: int

class HandoverRequest(BaseModel):
    actor_name: str = "Delivery Partner"
    notes: Optional[str] = None

class FailHandoverRequest(BaseModel):
    reason: str # RECIPIENT_UNAVAILABLE, PARCEL_NOT_FOUND, DATA_MISMATCH, STUDENT_REQUESTED_DELAY
    actor_name: str = "Delivery Partner"
    notes: Optional[str] = None

class StatusUpdateRequest(BaseModel):
    new_status: str
    reason: Optional[str] = None
    actor_role: str = "DELIVERY_PARTNER"
    actor_name: str = "Delivery Partner"
    notes: Optional[str] = None

class ParcelSchema(BaseModel):
    id: str
    tracking_id: str
    order_ref: str
    batch_id: str
    campus_id: int
    recipient_name: str
    recipient_name_masked: str
    recipient_phone: str
    recipient_phone_masked: str
    recipient_hostel: str
    parcel_description: str
    shelf_location: str
    status: str
    failed_reason: Optional[str] = None
    pickup_location_id: Optional[int] = None
    redelivery_time: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    events: List[ParcelEventSchema] = []
    recovery_requests: List[RecoveryRequestSchema] = []

    model_config = ConfigDict(from_attributes=True)

# --- Complaint ---
class ComplaintCreate(BaseModel):
    parcel_id: str
    student_name: str
    student_contact: str
    complaint_type: str # DELAYED_DELIVERY, DAMAGED_PARCEL, LOCKER_ISSUE, DRIVER_BEHAVIOR, OTHER
    feedback_text: str

class ComplaintSchema(BaseModel):
    id: int
    parcel_id: str
    student_name: str
    student_contact: str
    complaint_type: str
    feedback_text: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Analytics Response ---
class AnalyticsSummary(BaseModel):
    total_processed: int
    success_count: int
    failed_count: int
    pending_count: int
    escalated_count: int
    success_rate_pct: float
    failed_rate_pct: float
    avg_lookup_seconds: float
    avg_resolution_hours: float
    repeat_delivery_attempts: int
    unresolved_by_age: dict
    failure_reasons_distribution: dict
    batch_performance: List[dict]
