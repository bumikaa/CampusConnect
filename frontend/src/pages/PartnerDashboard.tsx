import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DeliveryBatch, Parcel } from '../types';
import { useApp } from '../context/AppContext';
import { ParcelDetailModal } from '../components/ParcelDetailModal';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { Package, CheckCircle2, Clock, AlertTriangle, Plus, Upload, Camera, Search, ArrowRight, Activity, Truck } from 'lucide-react';

export const PartnerDashboard: React.FC = () => {
  const { role, activeBatchId, setActiveBatchId, selectedCampusId, showToast, refreshKey } = useApp();
  const [batch, setBatch] = useState<DeliveryBatch | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [allBatches, setAllBatches] = useState<DeliveryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  const [driverName, setDriverName] = useState('Alex Rivera');
  const [driverId, setDriverId] = useState('DRV-1042');

  const fetchData = async () => {
    setLoading(true);
    try {
      const batchesList = await api.getBatches();
      setAllBatches(batchesList);

      if (batchesList.length > 0) {
        const curBatchId = activeBatchId || batchesList[0].id;
        const res = await api.getBatchDetail(curBatchId);
        setBatch(res.batch);
        setParcels(res.parcels);
      }
    } catch (err) {
      showToast('Failed to load delivery batch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBatchId, refreshKey]);

  const handleStartBatch = async () => {
    try {
      const newBatch = await api.createBatch(selectedCampusId, driverId, driverName);
      showToast(`Created new delivery batch ${newBatch.id}`, 'success');
      setActiveBatchId(newBatch.id);
      setShowNewBatchModal(false);
      fetchData();
    } catch (err) {
      showToast('Failed to create delivery batch', 'error');
    }
  };

  const handleAdminCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.importBatchCsv(activeBatchId || 'BATCH-20261010-01', file);
      showToast(`Imported ${res.imported_count} orders cleanly from dataset!`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'CSV Import failed', 'error');
    }
  };

  const filteredParcels = parcels.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.tracking_id.toLowerCase().includes(q) ||
      p.order_ref.toLowerCase().includes(q) ||
      p.recipient_name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const pendingParcels = parcels.filter((p) =>
    ['BATCH_CREATED', 'IDENTIFIED', 'AWAITING_HANDOVER'].includes(p.status)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-amazon-border shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-50 text-amazon-orange rounded-lg flex items-center justify-center border border-amber-200">
            <Truck size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-amazon-navy flex items-center space-x-2">
              <span>{role === 'OPERATIONS_MANAGER' ? 'Campus Admin Batch Control' : 'Delivery Person Dashboard'}</span>
              <span className="text-xs bg-amazon-orange text-amazon-navy px-2.5 py-0.5 rounded font-bold uppercase">
                {batch?.id || 'Active Batch'}
              </span>
            </h1>
            <p className="text-xs text-gray-500">
              Assigned Driver: <span className="font-semibold text-gray-800">{batch?.driver_name || 'Alex Rivera'}</span> ({batch?.driver_id || 'DRV-1042'})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Upload is ONLY visible to Campus Admin (OPERATIONS_MANAGER) */}
          {role === 'OPERATIONS_MANAGER' && (
            <label className="bg-amazon-orange hover:bg-amazon-amber text-amazon-navy font-bold py-2 px-3.5 rounded-lg text-xs cursor-pointer flex items-center space-x-1.5 transition-colors shadow-sm">
              <Upload size={16} />
              <span>Ingest Dataset CSV</span>
              <input type="file" accept=".csv" onChange={handleAdminCsvUpload} className="hidden" />
            </label>
          )}

          {role === 'OPERATIONS_MANAGER' && (
            <button
              onClick={() => setShowNewBatchModal(true)}
              className="bg-amazon-navy hover:bg-amazon-dark text-white font-bold py-2 px-3.5 rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus size={16} className="text-amazon-orange" />
              <span>Start New Batch</span>
            </button>
          )}

          <button
            onClick={() => setIsScannerOpen(true)}
            className="bg-amazon-dark hover:bg-gray-800 text-amazon-amber border border-amazon-orange/40 font-bold py-2 px-3.5 rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
          >
            <Camera size={16} />
            <span>Scan Barcode</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Assigned Batch Parcels</span>
            <div className="text-2xl font-black text-amazon-navy mt-1">{batch?.total_parcels || 0}</div>
          </div>
          <div className="w-12 h-12 bg-amazon-light text-amazon-navy rounded-lg flex items-center justify-center border border-amazon-navy/20">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Handed Over</span>
            <div className="text-2xl font-black text-amazon-green mt-1">{batch?.handed_over_count || 0}</div>
          </div>
          <div className="w-12 h-12 bg-green-50 text-amazon-green rounded-lg flex items-center justify-center border border-green-200">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Pending Handover</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{batch?.pending_count || 0}</div>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-200">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Failed / Escalated</span>
            <div className="text-2xl font-black text-amazon-red mt-1">{batch?.failed_count || 0}</div>
          </div>
          <div className="w-12 h-12 bg-red-50 text-amazon-red rounded-lg flex items-center justify-center border border-red-200">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-amazon-border shadow-sm flex items-center space-x-3">
        <Search className="text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search assigned deliveries by tracking ID, order reference, or recipient name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border-none focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-medium"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-gray-400 hover:text-gray-600 font-bold">
            Clear
          </button>
        )}
      </div>

      {/* Main Grid: Pending Parcels Queue + Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Parcels Section (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="text-amazon-orange" size={20} />
                <h3 className="font-bold text-amazon-navy text-base">Assigned Handover Queue</h3>
              </div>
              <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                {pendingParcels.length} Parcels Pending
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading batch parcels...</div>
            ) : filteredParcels.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">No dataset records loaded. Upload your dataset CSV via Campus Admin to populate queue.</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filteredParcels.slice(0, 15).map((pcl) => (
                  <div
                    key={pcl.id}
                    onClick={() => setSelectedParcel(pcl)}
                    className="p-3.5 bg-gray-50 hover:bg-amazon-light rounded-lg border border-gray-200 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-amazon-navy text-sm">{pcl.id}</span>
                        <span className="text-xs font-mono bg-white border border-gray-300 px-1.5 py-0.5 rounded text-gray-700">
                          {pcl.tracking_id}
                        </span>
                        <span className="text-xs text-amazon-orange font-bold bg-amazon-orange/10 px-2 py-0.5 rounded">
                          📍 {pcl.shelf_location}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Recipient: <span className="font-semibold text-gray-900">{pcl.recipient_name_masked}</span> • {pcl.recipient_hostel}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-amazon-navy group-hover:text-amazon-orange flex items-center space-x-1">
                        <span>Inspect & Handover</span>
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Recent Activity Feed & Batches Switcher */}
        <div className="space-y-6">
          {/* Batch Selector */}
          <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm space-y-3">
            <h3 className="font-bold text-amazon-navy text-xs uppercase tracking-wider text-gray-500">
              Delivery Batches
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {allBatches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBatchId(b.id)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                    b.id === activeBatchId
                      ? 'bg-amazon-navy text-white font-bold border-amazon-navy'
                      : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div>
                    <span className="font-bold">{b.id}</span>
                    <p className="text-[10px] text-gray-400">{b.driver_name} • {b.total_parcels} Parcels</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    b.status === 'COMPLETED' ? 'bg-green-100 text-amazon-green' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {b.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Activity size={18} className="text-amazon-orange" />
              <h3 className="font-bold text-amazon-navy text-sm">Delivery Activity Log</h3>
            </div>
            <div className="space-y-3 text-xs">
              {parcels.flatMap((p) => p.events).slice(0, 8).map((evt, idx) => (
                <div key={idx} className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1">
                  <div className="flex justify-between font-semibold text-amazon-navy">
                    <span>{evt.event_type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px]">{evt.details || 'Delivery activity logged'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Parcel Detail Modal */}
      <ParcelDetailModal
        parcel={selectedParcel}
        onClose={() => setSelectedParcel(null)}
        onUpdate={fetchData}
      />

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(id) => {
          setSearchQuery(id);
          showToast(`Scanned tracking ID: ${id}`, 'success');
        }}
        sampleTrackingIds={parcels.map((p) => p.tracking_id)}
      />

      {/* Create New Batch Modal */}
      {showNewBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-amazon-border">
            <h3 className="font-bold text-lg text-amazon-navy">Start New Delivery Batch</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Driver Name:</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amazon-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Driver ID:</label>
                <input
                  type="text"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amazon-orange"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowNewBatchModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleStartBatch}
                className="px-4 py-2 bg-amazon-orange text-amazon-navy rounded text-sm font-bold hover:bg-amazon-amber"
              >
                Initialize Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
