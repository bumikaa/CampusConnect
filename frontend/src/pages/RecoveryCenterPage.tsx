import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Parcel, PickupLocation } from '../types';
import { useApp } from '../context/AppContext';
import { ShieldAlert, MapPin, Calendar, ArrowUpRight, CheckCircle2, RotateCcw, Building, Clock, Filter, AlertTriangle } from 'lucide-react';

export const RecoveryCenterPage: React.FC = () => {
  const { selectedCampusId, showToast, refreshKey } = useApp();
  const [queue, setQueue] = useState<Parcel[]>([]);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [actionType, setActionType] = useState<string>('CAMPUS_PICKUP');
  const [pickupLocId, setPickupLocId] = useState<number>(1);
  const [timeSlot, setTimeSlot] = useState<string>('Tomorrow 14:00 - 16:00');
  const [notes, setNotes] = useState<string>('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getRecoveryQueue(selectedCampusId);
      setQueue(data);
      const locs = await api.getPickupLocations();
      setPickupLocations(locs);
      if (locs.length > 0) setPickupLocId(locs[0].id);
    } catch (err) {
      showToast('Failed to fetch recovery queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [selectedCampusId, refreshKey]);

  const handleResolveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcel) return;
    try {
      await api.submitRecoveryAction(
        selectedParcel.id,
        actionType,
        'OPERATIONS_MANAGER',
        pickupLocId,
        timeSlot,
        notes || `Manager assigned resolution: ${actionType}`
      );
      showToast(`Recovery resolution submitted for Parcel ${selectedParcel.id}!`, 'success');
      setSelectedParcel(null);
      fetchQueue();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to submit recovery resolution', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-amazon-navy text-white p-6 rounded-xl border border-gray-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <ShieldAlert size={22} className="text-amazon-orange" />
            <span>Failed Delivery Recovery Center</span>
          </h1>
          <p className="text-xs text-gray-300 mt-1">
            Dedicated operational queue for unresolved handover failures, student pickup scheduling, and manager escalation.
          </p>
        </div>

        <div className="bg-amazon-dark border border-amazon-orange/40 px-4 py-2 rounded-lg text-xs flex items-center space-x-2">
          <Clock className="text-amazon-amber" size={16} />
          <span>Queue Size: <strong className="text-amazon-amber text-sm font-black">{queue.length}</strong> Unresolved Parcels</span>
        </div>
      </div>

      {/* Main Recovery Queue Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Unresolved Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm space-y-4">
            <h3 className="font-bold text-amazon-navy text-base border-b pb-2">Unresolved Parcel Queue</h3>

            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading recovery queue...</div>
            ) : queue.length === 0 ? (
              <div className="py-8 text-center text-sm text-green-700 font-bold bg-green-50 rounded-lg">
                🎉 All campus parcels successfully handed over or resolved!
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {queue.map((pcl) => (
                  <div
                    key={pcl.id}
                    onClick={() => setSelectedParcel(pcl)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedParcel?.id === pcl.id
                        ? 'bg-amazon-light border-amazon-orange shadow-md ring-2 ring-amazon-orange/20'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-amazon-navy text-sm">{pcl.id}</span>
                        <span className="text-xs font-mono bg-gray-100 border px-1.5 py-0.5 rounded text-gray-700">
                          {pcl.tracking_id}
                        </span>
                      </div>
                      <span className="text-xs bg-red-100 text-amazon-red font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                        {pcl.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <p><strong className="text-gray-900">Recipient:</strong> {pcl.recipient_name_masked}</p>
                        <p><strong className="text-gray-900">Hostel:</strong> {pcl.recipient_hostel}</p>
                      </div>
                      <div>
                        <p className="text-amazon-red font-bold">
                          Reason: {pcl.failed_reason ? pcl.failed_reason.replace('_', ' ') : 'Handover Failed'}
                        </p>
                        <p className="text-gray-500 text-[11px]">
                          Attempted: {new Date(pcl.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Authorized Recovery Action Panel */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm space-y-4">
            <h3 className="font-bold text-amazon-navy text-base border-b pb-2 flex items-center space-x-2">
              <RotateCcw size={18} className="text-amazon-orange" />
              <span>Approved Recovery Action</span>
            </h3>

            {selectedParcel ? (
              <form onSubmit={handleResolveAction} className="space-y-4 text-xs">
                <div className="bg-amazon-light p-3 rounded-lg border border-amazon-border">
                  <span className="font-bold text-amazon-navy text-sm block">{selectedParcel.id}</span>
                  <p className="text-gray-600">Tracking: {selectedParcel.tracking_id}</p>
                  <p className="text-amazon-red font-bold mt-1">Reason: {selectedParcel.failed_reason || 'UNAVAILABLE'}</p>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Select Approved Recovery Option:</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded font-medium focus:ring-2 focus:ring-amazon-orange text-xs"
                  >
                    <option value="CAMPUS_PICKUP">Hold for Student Campus Pickup Locker</option>
                    <option value="SCHEDULE_REDELIVERY">Schedule Next Morning Redelivery Attempt</option>
                    <option value="ESCALATE_SEARCH">Escalate for Physical Campus Search</option>
                    <option value="REFER_REFUND">Refer for Policy-Based Return / Refund</option>
                  </select>
                </div>

                {actionType === 'CAMPUS_PICKUP' && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Approved Campus Pickup Location:</label>
                    <select
                      value={pickupLocId}
                      onChange={(e) => setPickupLocId(Number(e.target.value))}
                      className="w-full p-2.5 border border-gray-300 rounded font-medium focus:ring-2 focus:ring-amazon-orange text-xs"
                    >
                      {pickupLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.building} - {loc.operating_hours})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {actionType === 'SCHEDULE_REDELIVERY' && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Preferred Time Slot:</label>
                    <input
                      type="text"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Manager Resolution Notes:</label>
                  <textarea
                    rows={3}
                    placeholder="Enter operational resolution notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amazon-orange hover:bg-amazon-amber text-amazon-navy font-bold py-2.5 rounded-lg transition-colors text-sm shadow-sm"
                >
                  Confirm & Execute Recovery Action
                </button>
              </form>
            ) : (
              <div className="py-12 text-center text-xs text-gray-400 italic">
                Select an unresolved parcel from the queue to execute an approved recovery option.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
