import React, { useState } from 'react';
import { Parcel, FailureReason } from '../types';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { X, CheckCircle, AlertOctagon, UserX, SearchX, FileWarning, ArrowUpRight, History, Package, MapPin, Phone, Building } from 'lucide-react';

interface Props {
  parcel: Parcel | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const ParcelDetailModal: React.FC<Props> = ({ parcel, onClose, onUpdate }) => {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [showFailReasonForm, setShowFailReasonForm] = useState(false);
  const [failReason, setFailReason] = useState<FailureReason>('RECIPIENT_UNAVAILABLE');
  const [notes, setNotes] = useState('');

  if (!parcel) return null;

  const handleHandover = async () => {
    if (parcel.status === 'HANDED_OVER') {
      showToast('Parcel is already handed over.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.confirmHandover(parcel.id, 'Delivery Partner', notes || 'Handover verified and signed.');
      showToast(`Handover confirmed for Parcel ${parcel.id}!`, 'success');
      onUpdate();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to confirm handover', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkFailed = async () => {
    setLoading(true);
    try {
      await api.markFailed(parcel.id, failReason, 'Delivery Partner', notes || `Marked failed: ${failReason}`);
      showToast(`Parcel marked failed: ${failReason.replace('_', ' ')}. Moved to Recovery Queue.`, 'info');
      onUpdate();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    setLoading(true);
    try {
      await api.updateParcelStatus(parcel.id, 'ESCALATED', 'PARCEL_NOT_FOUND', 'DELIVERY_PARTNER', 'Delivery Partner', 'Escalated for investigation.');
      showToast(`Parcel ${parcel.id} escalated to Operations Manager.`, 'info');
      onUpdate();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to escalate parcel', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HANDED_OVER':
        return <span className="bg-green-100 text-amazon-green px-2.5 py-1 rounded-full text-xs font-bold border border-green-300">HANDED OVER</span>;
      case 'AWAITING_HANDOVER':
        return <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-300">AWAITING HANDOVER</span>;
      case 'FAILED_ATTEMPT':
      case 'RESOLUTION_PENDING':
        return <span className="bg-red-100 text-amazon-red px-2.5 py-1 rounded-full text-xs font-bold border border-red-300">RESOLUTION PENDING</span>;
      case 'PICKUP_REQUESTED':
        return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-300">PICKUP REQUESTED</span>;
      case 'REDELIVERY_SCHEDULED':
        return <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-300">REDELIVERY SCHEDULED</span>;
      case 'ESCALATED':
        return <span className="bg-red-200 text-red-900 px-2.5 py-1 rounded-full text-xs font-bold border border-red-400">ESCALATED</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-bold border border-gray-300">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-amazon-border my-8">
        {/* Header */}
        <div className="bg-amazon-navy text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="text-amazon-orange" size={24} />
            <div>
              <h3 className="font-bold text-lg flex items-center space-x-2">
                <span>{parcel.id}</span>
                <span className="text-xs font-normal text-amazon-amber bg-amazon-dark border border-gray-700 px-2 py-0.5 rounded font-mono">
                  {parcel.tracking_id}
                </span>
              </h3>
              <p className="text-xs text-gray-400">Order Ref: {parcel.order_ref}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status & Shelf Highlight Bar */}
          <div className="bg-amazon-light p-4 rounded-lg border border-amazon-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Current Parcel Lifecycle Status</span>
              <div>{getStatusBadge(parcel.status)}</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Assigned Campus Shelf Location</span>
              <span className="text-sm font-bold text-amazon-navy bg-white border border-amazon-orange/50 px-3 py-1 rounded-md inline-block shadow-sm">
                📍 {parcel.shelf_location}
              </span>
            </div>
          </div>

          {/* Masked Recipient & Delivery Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
              <h4 className="font-bold text-amazon-navy border-b pb-1 text-xs uppercase tracking-wider text-gray-500 flex items-center space-x-1">
                <Building size={14} />
                <span>Recipient Details (Privacy Safeguarded)</span>
              </h4>
              <p className="font-bold text-gray-900 text-base">{parcel.recipient_name_masked}</p>
              <p className="text-gray-600 flex items-center space-x-1 text-xs">
                <Phone size={12} className="text-gray-400" />
                <span>Phone: {parcel.recipient_phone_masked}</span>
              </p>
              <p className="text-gray-600 flex items-center space-x-1 text-xs">
                <MapPin size={12} className="text-gray-400" />
                <span>Hostel/Dorm: {parcel.recipient_hostel}</span>
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
              <h4 className="font-bold text-amazon-navy border-b pb-1 text-xs uppercase tracking-wider text-gray-500 flex items-center space-x-1">
                <Package size={14} />
                <span>Parcel Package Metadata</span>
              </h4>
              <p className="text-gray-900 font-medium text-xs">{parcel.parcel_description}</p>
              <p className="text-xs text-gray-500">Batch ID: <span className="font-mono">{parcel.batch_id}</span></p>
              {parcel.failed_reason && (
                <div className="bg-red-50 text-amazon-red p-2 rounded text-xs border border-red-200 font-medium">
                  Recorded Failure Reason: {parcel.failed_reason.replace('_', ' ')}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Actions for Delivery Partner */}
          {parcel.status !== 'HANDED_OVER' && parcel.status !== 'FORMALLY_CLOSED' && (
            <div className="bg-amazon-light p-4 rounded-lg border border-amazon-border space-y-3">
              <h4 className="font-bold text-amazon-navy text-sm">Select Delivery Partner Action:</h4>

              {!showFailReasonForm ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    disabled={loading}
                    onClick={handleHandover}
                    className="w-full bg-amazon-green hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors shadow-sm"
                  >
                    <CheckCircle size={18} />
                    <span>Confirm Successful Handover</span>
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => setShowFailReasonForm(true)}
                    className="w-full bg-amazon-red hover:bg-red-800 text-white font-bold py-2.5 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors shadow-sm"
                  >
                    <AlertOctagon size={18} />
                    <span>Mark Unsuccessful Handover</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-md border border-amazon-red/40 space-y-3">
                  <h5 className="font-bold text-xs text-amazon-red uppercase">Specify Unsuccessful Handover Reason:</h5>
                  <select
                    value={failReason}
                    onChange={(e) => setFailReason(e.target.value as FailureReason)}
                    className="w-full p-2 border border-gray-300 rounded text-sm font-medium focus:ring-2 focus:ring-amazon-orange"
                  >
                    <option value="RECIPIENT_UNAVAILABLE">Recipient Unavailable (Class/Hostel Absence)</option>
                    <option value="PARCEL_NOT_FOUND">Parcel Not Found / Shelf Location Error</option>
                    <option value="DATA_MISMATCH">Wrong Parcel / Data Mismatch</option>
                    <option value="STUDENT_REQUESTED_DELAY">Student Requested Postponement</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Optional delivery partner note..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-amazon-orange"
                  />

                  <div className="flex space-x-2">
                    <button
                      disabled={loading}
                      onClick={handleMarkFailed}
                      className="flex-1 bg-amazon-red text-white font-bold py-2 rounded text-sm hover:bg-red-800"
                    >
                      Confirm Failure & Enrol in Recovery
                    </button>
                    <button
                      onClick={() => setShowFailReasonForm(false)}
                      className="px-4 bg-gray-200 text-gray-700 font-semibold py-2 rounded text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  disabled={loading}
                  onClick={handleEscalate}
                  className="text-xs text-amazon-red hover:underline flex items-center space-x-1 font-semibold"
                >
                  <ArrowUpRight size={14} />
                  <span>Escalate Parcel to Campus Operations Manager</span>
                </button>
              </div>
            </div>
          )}

          {/* Audit Event Timeline */}
          <div className="space-y-3">
            <h4 className="font-bold text-amazon-navy text-xs uppercase tracking-wider text-gray-500 flex items-center space-x-1 border-b pb-1">
              <History size={14} />
              <span>Verifiable Audit Event Timeline</span>
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {parcel.events && parcel.events.length > 0 ? (
                parcel.events.map((evt) => (
                  <div key={evt.id} className="bg-gray-50 p-2.5 rounded border border-gray-200 text-xs flex justify-between items-start">
                    <div>
                      <span className="font-bold text-gray-800">{evt.event_type.replace('_', ' ')}</span>
                      <span className="text-gray-400 mx-1">•</span>
                      <span className="text-amazon-dark font-medium">{evt.actor_name} ({evt.actor_role})</span>
                      <p className="text-gray-600 mt-0.5">{evt.details || evt.reason || 'Status updated'}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No events recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
