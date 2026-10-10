import os, glob
import pandas as pd
import numpy as np

base_path = os.path.dirname(os.path.abspath(__file__))

# Load datasets
orders_df = pd.read_csv(os.path.join(base_path, 'olist_orders_dataset.csv'))
customers_df = pd.read_csv(os.path.join(base_path, 'olist_customers_dataset.csv'))
items_df = pd.read_csv(os.path.join(base_path, 'olist_order_items_dataset.csv'))
payments_df = pd.read_csv(os.path.join(base_path, 'olist_order_payments_dataset.csv'))
products_df = pd.read_csv(os.path.join(base_path, 'olist_products_dataset.csv'))
sellers_df = pd.read_csv(os.path.join(base_path, 'olist_sellers_dataset.csv'))

print('=== 1. OVERALL METRICS ===')
print(f'Total Orders: {len(orders_df):,}')
print(f'Total Unique Customers: {customers_df["customer_unique_id"].nunique():,}')
print(f'Total Order Items: {len(items_df):,}')
print(f'Total Revenue (Payments): ${payments_df["payment_value"].sum():,.2f}')
print(f'Total Unique Products: {products_df["product_id"].nunique():,}')
print(f'Total Active Sellers: {sellers_df["seller_id"].nunique():,}')

print('\n=== 2. ORDER STATUS BREAKDOWN ===')
status_counts = orders_df['order_status'].value_counts()
status_pct = orders_df['order_status'].value_counts(normalize=True) * 100
for status in status_counts.index:
    print(f' - {status.upper()}: {status_counts[status]:,} ({status_pct[status]:.2f}%)')

# Date conversions for delivery analysis
for col in ['order_purchase_timestamp', 'order_approved_at', 'order_delivered_carrier_date', 'order_delivered_customer_date', 'order_estimated_delivery_date']:
    orders_df[col] = pd.to_datetime(orders_df[col])

delivered_df = orders_df[orders_df['order_status'] == 'delivered'].copy()
delivered_df['delivery_days'] = (delivered_df['order_delivered_customer_date'] - delivered_df['order_purchase_timestamp']).dt.total_seconds() / 86400
delivered_df['is_delayed'] = delivered_df['order_delivered_customer_date'] > delivered_df['order_estimated_delivery_date']
delivered_df['delay_days'] = (delivered_df['order_delivered_customer_date'] - delivered_df['order_estimated_delivery_date']).dt.total_seconds() / 86400

print('\n=== 3. DELIVERY PERFORMANCE & DELAYS ===')
print(f'Average Actual Delivery Time: {delivered_df["delivery_days"].mean():.2f} days (Median: {delivered_df["delivery_days"].median():.2f} days)')
print(f'Total Delivered Orders: {len(delivered_df):,}')
delayed_count = int(delivered_df['is_delayed'].sum())
delayed_pct = (delayed_count / len(delivered_df)) * 100
ontime_count = len(delivered_df) - delayed_count
ontime_pct = (ontime_count / len(delivered_df)) * 100
print(f'On-Time Deliveries: {ontime_count:,} ({ontime_pct:.2f}%)')
print(f'Delayed Deliveries: {delayed_count:,} ({delayed_pct:.2f}%)')
print(f'Average Delay Duration for Delayed Orders: {delivered_df[delivered_df["is_delayed"]]["delay_days"].mean():.2f} days')

print('\n=== 4. TOP 10 PRODUCT CATEGORIES BY REVENUE & VOLUME ===')
merged_items = items_df.merge(products_df, on='product_id', how='left')
cat_stats = merged_items.groupby('product_category_name').agg(
    order_item_count=('order_item_id', 'count'),
    total_sales=('price', 'sum'),
    avg_price=('price', 'mean'),
    avg_freight=('freight_value', 'mean')
).reset_index().sort_values(by='total_sales', ascending=False)

for idx, row in cat_stats.head(10).iterrows():
    cat = row['product_category_name']
    print(f" - {cat}: Sales = ${row['total_sales']:,.2f} | Items = {row['order_item_count']:,} | Avg Price = ${row['avg_price']:.2f} | Avg Freight = ${row['avg_freight']:.2f}")

print('\n=== 5. TOP 10 CUSTOMER STATES BY ORDER VOLUME ===')
merged_orders_cust = orders_df.merge(customers_df, on='customer_id', how='left')
state_stats = merged_orders_cust.groupby('customer_state').agg(
    order_count=('order_id', 'count')
).reset_index().sort_values(by='order_count', ascending=False)
for idx, row in state_stats.head(10).iterrows():
    st = row['customer_state']
    pct = (row['order_count'] / len(orders_df)) * 100
    print(f" State {st}: {row['order_count']:,} orders ({pct:.2f}%)")

print('\n=== 6. PAYMENT METHOD BREAKDOWN ===')
pay_stats = payments_df.groupby('payment_type').agg(
    tx_count=('payment_sequential', 'count'),
    total_value=('payment_value', 'sum'),
    avg_value=('payment_value', 'mean'),
    avg_installments=('payment_installments', 'mean')
).reset_index().sort_values(by='total_value', ascending=False)
for idx, row in pay_stats.iterrows():
    pt = row['payment_type']
    print(f" - {pt.upper()}: Total = ${row['total_value']:,.2f} | Tx Count = {row['tx_count']:,} | Avg Tx = ${row['avg_value']:.2f} | Avg Installments = {row['avg_installments']:.1f}")

print('\n=== 7. DELIVERY TIMELINE & DISPATCH METRICS ===')
delivered_df['dispatch_days'] = (delivered_df['order_delivered_carrier_date'] - delivered_df['order_approved_at']).dt.total_seconds() / 86400
delivered_df['transit_days'] = (delivered_df['order_delivered_customer_date'] - delivered_df['order_delivered_carrier_date']).dt.total_seconds() / 86400
print(f'Average Order Dispatch Time (Approval to Carrier): {delivered_df["dispatch_days"].mean():.2f} days')
print(f'Average Transit Time (Carrier to Customer): {delivered_df["transit_days"].mean():.2f} days')
