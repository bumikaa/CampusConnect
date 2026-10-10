export type UserRole = 'STUDENT' | 'DELIVERY_PARTNER' | 'OPERATIONS_MANAGER';

export interface UserSession {
  id: number;
  email: string;
  username?: string;
  full_name: string;
  role: UserRole;
  token: string;
}

export type ParcelStatus = 

  | 'BATCH_CREATED'
  | 'IDENTIFIED'
  | 'AWAITING_HANDOVER'
  | 'HANDED_OVER'
  | 'FAILED_ATTEMPT'
  | 'RESOLUTION_PENDING'
  | 'REDELIVERY_SCHEDULED'
  | 'PICKUP_REQUESTED'
  | 'FORMALLY_CLOSED'
  | 'ESCALATED';

export type FailureReason = 
  | 'RECIPIENT_UNAVAILABLE'
  | 'PARCEL_NOT_FOUND'
  | 'DATA_MISMATCH'
  | 'STUDENT_REQUESTED_DELAY';

export interface Campus {
  id: number;
  code: string;
  name: string;
  address: string;
  contact_email: string;
}

export interface PickupLocation {
  id: number;
  campus_id: number;
  name: string;
  building: string;
  room_number: string;
  operating_hours: string;
  is_active: boolean;
}

export interface DeliveryBatch {
  id: string;
  campus_id: number;
  driver_id: string;
  driver_name: string;
  status: string;
  created_at: string;
  completed_at?: string;
  total_parcels: number;
  handed_over_count: number;
  failed_count: number;
  pending_count: number;
}

export interface ParcelEvent {
  id: number;
  parcel_id: string;
  batch_id?: string;
  previous_status: string;
  new_status: string;
  event_type: string;
  reason?: string;
  actor_role: string;
  actor_name: string;
  timestamp: string;
  details?: string;
}

export interface RecoveryRequest {
  id: number;
  parcel_id: string;
  requested_by: string;
  action_type: string;
  preferred_pickup_location_id?: number;
  preferred_time_slot?: string;
  notes?: string;
  status: string;
  created_at: string;
}

export interface Parcel {
  id: string;
  tracking_id: string;
  order_ref: string;
  batch_id: string;
  campus_id: number;
  recipient_name: string;
  recipient_name_masked: string;
  recipient_phone: string;
  recipient_phone_masked: string;
  recipient_hostel: string;
  parcel_description: string;
  shelf_location: string;
  status: ParcelStatus;
  failed_reason?: FailureReason;
  pickup_location_id?: number;
  redelivery_time?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  events: ParcelEvent[];
  recovery_requests: RecoveryRequest[];
}

export interface AnalyticsData {
  total_processed: number;
  success_count: number;
  failed_count: number;
  pending_count: number;
  escalated_count: number;
  success_rate_pct: number;
  failed_rate_pct: number;
  avg_lookup_seconds: number;
  avg_resolution_hours: number;
  repeat_delivery_attempts: number;
  unresolved_by_age: Record<string, number>;
  failure_reasons_distribution: Record<string, number>;
  batch_performance: {
    batch_id: string;
    driver_name: string;
    total_parcels: number;
    handed_over: number;
    failed: number;
    success_rate_pct: number;
  }[];
  dataset_loaded?: boolean;
  currency?: string;
  kaggle_summary?: {
    kaggle_total_orders: number;
    kaggle_unique_customers: number;
    kaggle_total_items: number;
    kaggle_total_products?: number;
    kaggle_total_sellers?: number;
    kaggle_gross_revenue_inr: number;
    kaggle_currency: string;
    kaggle_currency_symbol: string;
    kaggle_avg_delivery_days: number;
    kaggle_avg_dispatch_days?: number;
    kaggle_avg_transit_days?: number;
    kaggle_ontime_deliveries: number;
    kaggle_delayed_deliveries: number;
    kaggle_ontime_rate_pct: number;
    kaggle_order_status_counts: Record<string, number>;
    top_states?: {
      state: string;
      order_count: number;
      share_pct: number;
    }[];
    top_seller_states?: {
      state: string;
      seller_count: number;
      share_pct: number;
    }[];
    top_categories_inr: {
      category: string;
      sales_inr: number;
      item_count: number;
      avg_price_inr: number;
      avg_freight_inr: number;
    }[];
    payment_methods_inr: {
      payment_type: string;
      total_val_inr: number;
      tx_count: number;
      avg_val_inr: number;
      avg_installments: number;
    }[];
  };
}
