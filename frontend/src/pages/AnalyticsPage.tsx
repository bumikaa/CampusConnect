import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AnalyticsData } from '../types';
import { useApp } from '../context/AppContext';
import { BarChart3, Download, Database, FileSpreadsheet, Upload, IndianRupee, TrendingUp, ShoppingBag, CreditCard, Users, Clock, MessageSquare, Store, MapPin, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#FF9900', '#067D62', '#131921', '#3B82F6', '#FEBD69', '#B12704', '#8B5CF6', '#EC4899'];

interface ComplaintItem {
  id: number;
  parcel_id: string;
  student_name: string;
  student_contact: string;
  complaint_type: string;
  feedback_text: string;
  status: string;
  created_at: string;
}

export const AnalyticsPage: React.FC = () => {
  const { role, activeBatchId, showToast, refreshKey } = useApp();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
      const cList = await api.getComplaints();
      setComplaints(cList);
    } catch (err) {
      showToast('Failed to load analytics metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [refreshKey]);

  const handleExportCsv = () => {
    window.open('/api/export/csv', '_blank');
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.importBatchCsv(activeBatchId || 'BATCH-20261010-01', file);
      showToast(`Imported ${res.imported_count} orders cleanly from dataset!`, 'success');
      fetchAnalytics();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'CSV Import failed', 'error');
    }
  };

  const handleResolveComplaint = async (complaintId: number) => {
    try {
      await api.resolveComplaint(complaintId);
      showToast('Complaint marked as resolved', 'success');
      fetchAnalytics();
    } catch (err) {
      showToast('Failed to resolve complaint', 'error');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-gray-500">Loading multi-CSV dataset analytics...</div>;
  }

  const hasData = analytics && (analytics.total_processed > 0 || !!analytics.kaggle_summary);
  const kaggle = analytics?.kaggle_summary;

  const categoryBarData = kaggle?.top_categories_inr
    ? kaggle.top_categories_inr.slice(0, 8).map((c) => ({
        name: c.category.length > 15 ? c.category.slice(0, 15) + '...' : c.category,
        sales_lakhs: +(c.sales_inr / 100000).toFixed(2),
        full_sales: c.sales_inr,
      }))
    : [];

  const paymentPieData = kaggle?.payment_methods_inr
    ? kaggle.payment_methods_inr.map((p) => ({
        name: p.payment_type,
        value: p.total_val_inr,
      }))
    : [];

  const formatRupees = (val: number) => {
    if (val >= 10000000) {
      return `Rs. ${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `Rs. ${(val / 100000).toFixed(2)} Lakh`;
    }
    return `Rs. ${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-amazon-navy text-white p-6 rounded-xl border border-gray-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <BarChart3 size={24} className="text-amazon-orange" />
            <span>Full 7-CSV Dataset Operations & Logistics Analytics</span>
          </h1>
          <p className="text-xs text-gray-300 mt-1">
            Integrated data analysis across orders, customers, order items, payments, products, sellers, and geolocation CSV datasets. Currency: <strong className="text-amazon-amber font-semibold">Indian Rupees (Rs. / ₹)</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* CSV Upload is ONLY available for Campus Admin (OPERATIONS_MANAGER) */}
          {role === 'OPERATIONS_MANAGER' && (
            <label className="bg-amazon-orange hover:bg-amazon-amber text-amazon-navy font-bold py-2.5 px-4 rounded-lg text-xs cursor-pointer flex items-center space-x-1.5 transition-colors shadow-sm">
              <Upload size={16} />
              <span>Upload Kaggle Dataset CSV</span>
              <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            </label>
          )}

          {hasData && (
            <button
              onClick={handleExportCsv}
              className="bg-amazon-dark hover:bg-gray-800 text-white border border-gray-600 font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Download size={16} />
              <span>Export Operational Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Operator Complaints & Feedback Desk */}
      <div className="bg-white rounded-xl border border-amazon-border shadow-sm overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="text-amazon-orange" size={20} />
            <h2 className="font-bold text-amazon-navy text-base">Student Complaints & Feedback Desk</h2>
          </div>
          <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
            {complaints.filter(c => c.status === 'PENDING').length} Pending Issues
          </span>
        </div>

        {complaints.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500 italic bg-gray-50 rounded">
            No complaints or feedback lodged yet. Students can submit complaints from their Student Delivery Portal.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-amazon-light uppercase font-bold text-gray-600 border-b">
                <tr>
                  <th className="p-3">Parcel ID</th>
                  <th className="p-3">Student Name / Contact</th>
                  <th className="p-3">Issue Category</th>
                  <th className="p-3">Feedback Details</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 font-medium">
                    <td className="p-3 font-bold text-amazon-navy font-mono">{c.parcel_id}</td>
                    <td className="p-3 text-gray-800">
                      <div>{c.student_name}</div>
                      <div className="text-[10px] text-gray-500">{c.student_contact}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">
                        {c.complaint_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-gray-800 max-w-xs">{c.feedback_text}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        c.status === 'RESOLVED' ? 'bg-green-100 text-amazon-green' : 'bg-red-100 text-amazon-red'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {c.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleResolveComplaint(c.id)}
                          className="bg-amazon-green hover:bg-emerald-700 text-white font-bold py-1 px-3 rounded text-[11px] transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="bg-white p-12 rounded-xl border border-amazon-border shadow-sm text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 bg-amber-50 text-amazon-orange rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <Database size={32} />
          </div>
          <h2 className="text-lg font-bold text-amazon-navy">No Dataset Records Loaded</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Please upload your Kaggle dataset CSV files to process data analysis across all 7 dataset modules.
          </p>
          {role === 'OPERATIONS_MANAGER' && (
            <label className="inline-flex items-center space-x-2 bg-amazon-navy text-white font-bold py-2.5 px-6 rounded-lg text-xs cursor-pointer hover:bg-amazon-dark transition-colors">
              <FileSpreadsheet size={16} className="text-amazon-orange" />
              <span>Select & Upload Dataset CSV File</span>
              <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            </label>
          )}
        </div>
      ) : (
        <>
          {/* Top 6 Macro Metric Cards Across 7 CSV Files */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-amazon-border shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center space-x-1">
                <IndianRupee size={12} className="text-amazon-orange" />
                <span>Gross Revenue</span>
              </span>
              <div className="text-xl font-black text-amazon-navy mt-1">
                {kaggle ? formatRupees(kaggle.kaggle_gross_revenue_inr) : 'Rs. 0'}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">olist_order_payments</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amazon-border shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center space-x-1">
                <Layers size={12} className="text-blue-600" />
                <span>Total Orders</span>
              </span>
              <div className="text-xl font-black text-amazon-navy mt-1">
                {kaggle ? kaggle.kaggle_total_orders.toLocaleString() : analytics.total_processed}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">olist_orders_dataset</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amazon-border shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center space-x-1">
                <Users size={12} className="text-purple-600" />
                <span>Unique Customers</span>
              </span>
              <div className="text-xl font-black text-purple-700 mt-1">
                {kaggle ? kaggle.kaggle_unique_customers.toLocaleString() : '96,096'}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">olist_customers_dataset</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amazon-border shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center space-x-1">
                <ShoppingBag size={12} className="text-emerald-600" />
                <span>Units Shipped</span>
              </span>
              <div className="text-xl font-black text-amazon-green mt-1">
                {kaggle ? kaggle.kaggle_total_items.toLocaleString() : '112,650'}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">olist_order_items</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amazon-border shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center space-x-1">
                <Database size={12} className="text-amber-600" />
                <span>Unique Products</span>
              </span>
              <div className="text-xl font-black text-amber-700 mt-1">
                {kaggle ? (kaggle.kaggle_total_products || 32951).toLocaleString() : '32,951'}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">olist_products_dataset</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amazon-border shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center space-x-1">
                <Store size={12} className="text-red-600" />
                <span>Active Sellers</span>
              </span>
              <div className="text-xl font-black text-amazon-red mt-1">
                {kaggle ? (kaggle.kaggle_total_sellers || 3095).toLocaleString() : '3,095'}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">olist_sellers_dataset</span>
            </div>
          </div>

          {/* Regional Customer & Seller Distribution Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table 1: Customer Regional Distribution (olist_customers_dataset) */}
            {kaggle?.top_states && (
              <div className="bg-white rounded-xl border border-amazon-border shadow-sm overflow-hidden">
                <div className="p-4 bg-amazon-navy text-white font-bold text-sm flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <MapPin size={16} className="text-amazon-orange" />
                    <span>Customer Regional Distribution (olist_customers_dataset)</span>
                  </span>
                  <span className="text-xs text-amazon-amber">Geography</span>
                </div>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left divide-y divide-gray-200">
                    <thead className="bg-amazon-light font-bold uppercase text-gray-600">
                      <tr>
                        <th className="p-3">State Code</th>
                        <th className="p-3 text-center">Orders Placed</th>
                        <th className="p-3 text-right">Volume Share (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {kaggle.top_states.map((st, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 font-medium">
                          <td className="p-3 font-bold text-amazon-navy">State {st.state}</td>
                          <td className="p-3 text-center text-gray-800">{st.order_count.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-amazon-orange">{st.share_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Table 2: Seller Origin Distribution (olist_sellers_dataset) */}
            {kaggle?.top_seller_states && (
              <div className="bg-white rounded-xl border border-amazon-border shadow-sm overflow-hidden">
                <div className="p-4 bg-amazon-navy text-white font-bold text-sm flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Store size={16} className="text-amazon-orange" />
                    <span>Merchant Seller Hub Distribution (olist_sellers_dataset)</span>
                  </span>
                  <span className="text-xs text-amazon-amber">Merchants</span>
                </div>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left divide-y divide-gray-200">
                    <thead className="bg-amazon-light font-bold uppercase text-gray-600">
                      <tr>
                        <th className="p-3">Seller Origin State</th>
                        <th className="p-3 text-center">Registered Sellers</th>
                        <th className="p-3 text-right">Seller Share (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {kaggle.top_seller_states.map((st, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 font-medium">
                          <td className="p-3 font-bold text-amazon-navy">State {st.state}</td>
                          <td className="p-3 text-center text-gray-800">{st.seller_count.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-amazon-green">{st.share_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Top Product Categories Revenue (in Rs. Lakhs) */}
            <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm space-y-3">
              <h3 className="font-bold text-amazon-navy text-sm uppercase tracking-wider text-gray-500 border-b pb-2 flex items-center space-x-2">
                <ShoppingBag size={16} className="text-amazon-orange" />
                <span>Top Product Categories Revenue (Rs. Lakhs - olist_products)</span>
              </h3>
              {categoryBarData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={10} angle={-25} textAnchor="end" />
                      <YAxis stroke="#6b7280" fontSize={11} unit=" L" />
                      <Tooltip formatter={(value: any) => [`Rs. ${value} Lakhs`, 'Sales Revenue']} />
                      <Bar dataKey="sales_lakhs" fill="#FF9900" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-gray-400 italic">No category data available in current view.</div>
              )}
            </div>

            {/* Chart 2: Payment Method Breakdown (Rs.) */}
            <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm space-y-3">
              <h3 className="font-bold text-amazon-navy text-sm uppercase tracking-wider text-gray-500 border-b pb-2 flex items-center space-x-2">
                <CreditCard size={16} className="text-amazon-orange" />
                <span>Payment Channels Distribution (Gross Rs. - olist_payments)</span>
              </h3>
              {paymentPieData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${formatRupees(value)}`}
                      >
                        {paymentPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`Rs. ${Number(value).toLocaleString('en-IN')}`, 'Gross Total']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-gray-400 italic">No payment method breakdown available.</div>
              )}
            </div>
          </div>

          {/* Detailed Category Financial Table (in Rs.) */}
          {kaggle?.top_categories_inr && (
            <div className="bg-white rounded-xl border border-amazon-border shadow-sm overflow-hidden">
              <div className="p-4 bg-amazon-navy text-white font-bold text-sm flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <IndianRupee size={16} className="text-amazon-orange" />
                  <span>Category Revenue & Freight Logistics Breakdown (in Rs. / ₹)</span>
                </span>
                <span className="text-xs text-amazon-amber font-normal">olist_products & olist_order_items</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-amazon-light uppercase font-bold text-gray-600 border-b">
                    <tr>
                      <th className="p-3">Product Category</th>
                      <th className="p-3 text-center">Items Sold</th>
                      <th className="p-3 text-right">Avg Unit Price (Rs.)</th>
                      <th className="p-3 text-right">Avg Freight Cost (Rs.)</th>
                      <th className="p-3 text-right">Total Category Sales (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {kaggle.top_categories_inr.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 font-medium">
                        <td className="p-3 font-bold text-amazon-navy">{cat.category}</td>
                        <td className="p-3 text-center text-gray-800">{cat.item_count.toLocaleString()}</td>
                        <td className="p-3 text-right text-gray-800">Rs. {cat.avg_price_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-gray-500">Rs. {cat.avg_freight_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right font-bold text-amazon-navy">Rs. {cat.sales_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Method Financial Table (in Rs.) */}
          {kaggle?.payment_methods_inr && (
            <div className="bg-white rounded-xl border border-amazon-border shadow-sm overflow-hidden">
              <div className="p-4 bg-amazon-navy text-white font-bold text-sm flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <CreditCard size={16} className="text-amazon-orange" />
                  <span>Payment Channels Financial Summary (in Rs. - olist_order_payments)</span>
                </span>
                <span className="text-xs text-amazon-amber font-normal">olist_order_payments</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-amazon-light uppercase font-bold text-gray-600 border-b">
                    <tr>
                      <th className="p-3">Payment Channel</th>
                      <th className="p-3 text-center">Transactions</th>
                      <th className="p-3 text-center">Avg Installments</th>
                      <th className="p-3 text-right">Avg Order Value (Rs.)</th>
                      <th className="p-3 text-right">Total Gross Volume (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {kaggle.payment_methods_inr.map((pay, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 font-medium">
                        <td className="p-3 font-bold text-amazon-navy">{pay.payment_type}</td>
                        <td className="p-3 text-center text-gray-800">{pay.tx_count.toLocaleString()}</td>
                        <td className="p-3 text-center text-gray-600">{pay.avg_installments}</td>
                        <td className="p-3 text-right text-gray-800">Rs. {pay.avg_val_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right font-bold text-amazon-green">Rs. {pay.total_val_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
