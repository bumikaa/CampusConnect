import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Parcel } from '../types';
import { useApp } from '../context/AppContext';
import { ParcelDetailModal } from '../components/ParcelDetailModal';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { Search, Upload, Camera, Check, CornerDownLeft } from 'lucide-react';

export const BulkProcessingPage: React.FC = () => {
  const { role, activeBatchId, showToast, refreshKey } = useApp();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const data = await api.searchParcels({ batch_id: activeBatchId });
      setParcels(data);
    } catch (err) {
      showToast('Failed to fetch batch parcels', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, [activeBatchId, refreshKey]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInstantLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const term = searchQuery.trim().toLowerCase();
    const match = parcels.find(
      (p) =>
        p.tracking_id.toLowerCase() === term ||
        p.order_ref.toLowerCase() === term ||
        p.id.toLowerCase() === term ||
        p.recipient_name.toLowerCase().includes(term)
    );

    if (match) {
      setSelectedParcel(match);
      showToast(`Instant match found: ${match.id}`, 'success');
    } else {
      showToast(`No parcel found matching '${searchQuery}' in batch ${activeBatchId}`, 'error');
    }
  };

  const handleAdminCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.importBatchCsv(activeBatchId, file);
      showToast(`Imported ${res.imported_count} orders cleanly from dataset!`, 'success');
      fetchParcels();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'CSV Import failed', 'error');
    }
  };

  const handleQuickHandover = async (parcel: Parcel, e: React.MouseEvent) => {
    e.stopPropagation();
    if (parcel.status === 'HANDED_OVER') {
      showToast('Parcel is already handed over!', 'error');
      return;
    }
    try {
      await api.confirmHandover(parcel.id, 'Delivery Person', 'Quick table handover action confirmed.');
      showToast(`Handover confirmed for ${parcel.id}!`, 'success');
      fetchParcels();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed handover', 'error');
    }
  };

  const filteredParcels = parcels.filter((p) => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PENDING' && !['BATCH_CREATED', 'IDENTIFIED', 'AWAITING_HANDOVER'].includes(p.status)) return false;
      if (statusFilter === 'HANDED_OVER' && p.status !== 'HANDED_OVER') return false;
      if (statusFilter === 'FAILED' && !['FAILED_ATTEMPT', 'RESOLUTION_PENDING'].includes(p.status)) return false;
      if (statusFilter === 'RECOVERY' && !['RESOLUTION_PENDING', 'REDELIVERY_SCHEDULED', 'PICKUP_REQUESTED', 'ESCALATED'].includes(p.status)) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.tracking_id.toLowerCase().includes(q) ||
        p.order_ref.toLowerCase().includes(q) ||
        p.recipient_name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-amazon-navy text-white p-6 rounded-xl border border-gray-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <span>High-Speed Bulk Parcel Search</span>
            <span className="text-xs bg-amazon-orange text-amazon-navy px-2 py-0.5 rounded font-bold">
              Barcode Search
            </span>
          </h1>
          <p className="text-xs text-gray-300 mt-1">
            Active Batch: <span className="font-mono text-amazon-amber font-bold">{activeBatchId}</span> • Scan barcode or enter tracking ID
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {role === 'OPERATIONS_MANAGER' && (
            <label className="bg-amazon-orange hover:bg-amazon-amber text-amazon-navy font-bold py-2 px-4 rounded-lg text-xs cursor-pointer flex items-center space-x-1.5 transition-colors shadow-sm">
              <Upload size={16} />
              <span>Ingest Dataset CSV</span>
              <input type="file" accept=".csv" onChange={handleAdminCsvUpload} className="hidden" />
            </label>
          )}

          <button
            onClick={() => setIsScannerOpen(true)}
            className="bg-amazon-dark hover:bg-gray-800 text-amazon-amber border border-amazon-orange/40 font-bold py-2 px-4 rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
          >
            <Camera size={16} />
            <span>Camera Scanner</span>
          </button>
        </div>
      </div>

      {/* Barcode Search Bar */}
      <form onSubmit={handleInstantLookup} className="bg-white p-4 rounded-xl border-2 border-amazon-orange shadow-md space-y-2">
        <div className="flex items-center space-x-3">
          <Search className="text-amazon-orange" size={24} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Scan barcode or type exact tracking ID, order reference, or recipient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-base sm:text-lg font-mono font-bold text-amazon-navy focus:outline-none placeholder-gray-400"
          />
          <button
            type="submit"
            className="bg-amazon-navy hover:bg-amazon-dark text-white font-bold px-5 py-2.5 rounded-lg text-xs flex items-center space-x-1 transition-colors"
          >
            <span>Lookup</span>
            <CornerDownLeft size={14} className="text-amazon-amber" />
          </button>
        </div>
      </form>

      {/* Filter Tabs & Parcel Table */}
      <div className="bg-white rounded-xl border border-amazon-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-amazon-light">
          <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
            {['ALL', 'PENDING', 'HANDED_OVER', 'FAILED', 'RECOVERY'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  statusFilter === tab
                    ? 'bg-amazon-navy text-white font-bold'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-500 font-bold">
            Showing {filteredParcels.length} of {parcels.length} Parcels
          </span>
        </div>

        {/* Parcel Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-amazon-navy text-white uppercase font-bold text-[11px] tracking-wider border-b">
              <tr>
                <th className="p-3.5">Parcel ID</th>
                <th className="p-3.5">Tracking ID / Order Ref</th>
                <th className="p-3.5">Masked Recipient</th>
                <th className="p-3.5">Hostel & Shelf Bin</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">Loading batch parcels...</td>
                </tr>
              ) : filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No parcel records found. Upload dataset CSV via Campus Admin.</td>
                </tr>
              ) : (
                filteredParcels.map((pcl) => (
                  <tr
                    key={pcl.id}
                    onClick={() => setSelectedParcel(pcl)}
                    className="hover:bg-amazon-light transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 font-bold text-amazon-navy">{pcl.id}</td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-gray-900 block">{pcl.tracking_id}</span>
                      <span className="text-[10px] text-gray-400">{pcl.order_ref}</span>
                    </td>
                    <td className="p-3.5 font-semibold text-gray-800">{pcl.recipient_name_masked}</td>
                    <td className="p-3.5">
                      <span className="block text-gray-700 font-medium">{pcl.recipient_hostel}</span>
                      <span className="inline-block bg-amazon-orange/10 text-amazon-orange border border-amazon-orange/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        📍 {pcl.shelf_location}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        pcl.status === 'HANDED_OVER'
                          ? 'bg-green-100 text-amazon-green'
                          : pcl.status === 'AWAITING_HANDOVER'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-red-100 text-amazon-red'
                      }`}>
                        {pcl.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {pcl.status !== 'HANDED_OVER' ? (
                        <button
                          onClick={(e) => handleQuickHandover(pcl, e)}
                          className="bg-amazon-green hover:bg-emerald-700 text-white font-bold py-1 px-3 rounded text-[11px] transition-colors shadow-sm"
                        >
                          Handover
                        </button>
                      ) : (
                        <span className="text-amazon-green font-bold text-[11px] flex items-center justify-end space-x-1">
                          <Check size={14} />
                          <span>Handed Over</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parcel Detail Modal Drawer */}
      <ParcelDetailModal
        parcel={selectedParcel}
        onClose={() => setSelectedParcel(null)}
        onUpdate={fetchParcels}
      />

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(id) => {
          setSearchQuery(id);
          const match = parcels.find((p) => p.tracking_id === id);
          if (match) setSelectedParcel(match);
        }}
        sampleTrackingIds={parcels.map((p) => p.tracking_id)}
      />
    </div>
  );
};
