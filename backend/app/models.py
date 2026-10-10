import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Campus(Base):
    __tablename__ = "campuses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    address = Column(String)
    contact_email = Column(String)

    batches = relationship("DeliveryBatch", back_populates="campus")
    pickup_locations = relationship("PickupLocation", back_populates="campus")
    parcels = relationship("Parcel", back_populates="campus")

class PickupLocation(Base):
    __tablename__ = "pickup_locations"

    id = Column(Integer, primary_key=True, index=True)
    campus_id = Column(Integer, ForeignKey("campuses.id"))
    name = Column(String)
    building = Column(String)
    room_number = Column(String)
    operating_hours = Column(String)
    is_active = Column(Boolean, default=True)

    campus = relationship("Campus", back_populates="pickup_locations")
    parcels = relationship("Parcel", back_populates="pickup_location")

class DeliveryBatch(Base):
    __tablename__ = "delivery_batches"

    id = Column(String, primary_key=True, index=True) # e.g. BATCH-20261010-01
    campus_id = Column(Integer, ForeignKey("campuses.id"))
    driver_id = Column(String)
    driver_name = Column(String)
    status = Column(String, default="IN_PROGRESS") # CREATED, IN_PROGRESS, COMPLETED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_parcels = Column(Integer, default=0)
    handed_over_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    pending_count = Column(Integer, default=0)

    campus = relationship("Campus", back_populates="batches")
    parcels = relationship("Parcel", back_populates="batch")

class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(String, primary_key=True, index=True) # e.g. PCL-1001
    tracking_id = Column(String, unique=True, index=True) # e.g. TRK-9824-8192
    order_ref = Column(String, index=True) # e.g. ORD-77491-01
    batch_id = Column(String, ForeignKey("delivery_batches.id"))
    campus_id = Column(Integer, ForeignKey("campuses.id"))
    recipient_name = Column(String)
    recipient_phone = Column(String)
    recipient_hostel = Column(String)
    parcel_description = Column(String)
    shelf_location = Column(String, default="Unassigned")
    status = Column(String, default="AWAITING_HANDOVER", index=True) 
    failed_reason = Column(String, nullable=True) 
    pickup_location_id = Column(Integer, ForeignKey("pickup_locations.id"), nullable=True)
    redelivery_time = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    campus = relationship("Campus", back_populates="parcels")
    batch = relationship("DeliveryBatch", back_populates="parcels")
    pickup_location = relationship("PickupLocation", back_populates="parcels")
    events = relationship("ParcelEvent", back_populates="parcel", cascade="all, delete-orphan", order_by="ParcelEvent.timestamp.desc()")
    recovery_requests = relationship("RecoveryRequest", back_populates="parcel", cascade="all, delete-orphan", order_by="RecoveryRequest.created_at.desc()")

class ParcelEvent(Base):
    __tablename__ = "parcel_events"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(String, ForeignKey("parcels.id"))
    batch_id = Column(String, nullable=True)
    previous_status = Column(String)
    new_status = Column(String)
    event_type = Column(String) # STATUS_CHANGE, SCAN, RECOVERY_REQUEST, HANDOVER_SUCCESS, COMPLAINT_FILED
    reason = Column(String, nullable=True)
    actor_role = Column(String) # DELIVERY_PARTNER, OPERATIONS_MANAGER, STUDENT, SYSTEM
    actor_name = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(Text, nullable=True)

    parcel = relationship("Parcel", back_populates="events")

class RecoveryRequest(Base):
    __tablename__ = "recovery_requests"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(String, ForeignKey("parcels.id"))
    requested_by = Column(String) # STUDENT, OPERATIONS_MANAGER
    action_type = Column(String) # SCHEDULE_REDELIVERY, CAMPUS_PICKUP, ESCALATE_SEARCH, DATA_CORRECTION, REFER_REFUND
    preferred_pickup_location_id = Column(Integer, ForeignKey("pickup_locations.id"), nullable=True)
    preferred_time_slot = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="APPROVED") # PENDING_APPROVAL, APPROVED, COMPLETED, REJECTED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    parcel = relationship("Parcel", back_populates="recovery_requests")
    preferred_pickup_location = relationship("PickupLocation")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(String, ForeignKey("parcels.id"))
    student_name = Column(String)
    student_contact = Column(String)
    complaint_type = Column(String) # DELAYED_DELIVERY, DAMAGED_PARCEL, LOCKER_ISSUE, DRIVER_BEHAVIOR, OTHER
    feedback_text = Column(Text)
    status = Column(String, default="PENDING") # PENDING, UNDER_REVIEW, RESOLVED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    parcel = relationship("Parcel")

class SystemSettings(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(Text)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String) # STUDENT, DELIVERY_PARTNER, OPERATIONS_MANAGER
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

