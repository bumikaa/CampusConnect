import React, { useState } from 'react';
import { api } from '../api/client';
import { Parcel, PickupLocation } from '../types';
import { useApp } from '../context/AppContext';
import { Package, AlertTriangle, Sparkles, MessageSquare, CheckCircle } from 'lucide-react';

export const StudentPortalPage: React.FC = () => {
  const { showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);

  const [recoveryChoice, setRecoveryChoice] = useState<'CAMPUS_PICKUP' | 'SCHEDULE_REDELIVERY'>('CAMPUS_PICKUP');
  const [selectedLocationId, setSelectedLocationId] = useState<number>(1);
  const [timeSlot, setTimeSlot] = useState('Tomorrow 14:00 - 16:00');
  const [notes, setNotes] = useState('');

  // Complaint state
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintType, setComplaintType] = useState('DELAYED_DELIVERY');
  const [studentContact, setStudentContact] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await api.getParcel(searchQuery.trim());
      setParcel(data);
      const locs = await api.getPickupLocations();
      setPickupLocations(locs);
      if (locs.length > 0) setSelectedLocationId(locs[0].id);
    } catch (err: any) {
      setParcel(null);
      showToast(err.response?.data?.detail || 'No matching delivery record found for tracking ID', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcel) return;
    try {
      const updated = await api.submitRecoveryAction(
        parcel.id,
        recoveryChoice,
        'STUDENT',
        selectedLocationId,
        timeSlot,
        notes || 'Student submitted resolution preference'
      );
      setParcel(updated);
      showToast('Your delivery resolution preference has been recorded successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to submit request', 'error');
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcel || !feedbackText.trim()) return;
    setSubmittingComplaint(true);
    try {
      await api.submitComplaint({
        parcel_id: parcel.id,
        student_name: parcel.recipient_name_masked || 'Student',
        student_contact: studentContact || 'Student Contact',
        complaint_type: complaintType,
        feedback_text: feedbackText,
      });
      showToast('Your complaint/feedback has been registered and sent to Campus Operator!', 'success');
      setShowComplaintForm(false);
      setFeedbackText('');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to file complaint', 'error');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* User / Student Header */}
      <div className="bg-amazon-navy text-white p-6 rounded-xl border border-gray-800 shadow-md space-y-2">
        <div className="flex items-center space-x-2">
          <Package size={24} className="text-amazon-orange" />
          <h1 className="text-xl font-bold">User / Student Delivery Portal</h1>
        </div>
        <p className="text-xs text-gray-300">
          Track your campus parcel order, view status updates, and file complaints or feedback directly to Campus Operations.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl border border-amazon-border shadow-sm space-y-3">
        <label className="block text-xs font-bold text-amazon-navy uppercase tracking-wider">
          Enter Order Reference or Tracking ID:
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="e.g. TRK-E481-9001 or ORD-E481F51C"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg text-sm font-mono font-bold text-amazon-navy focus:ring-2 focus:ring-amazon-orange"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-amazon-orange hover:bg-amazon-amber text-amazon-navy font-bold py-3 px-6 rounded-lg text-sm transition-colors shadow-sm"
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </div>
      </form>

      {/* Parcel Status Card */}
      {parcel ? (
        <div className="bg-white p-6 rounded-xl border border-amazon-border shadow-sm space-y-6">
          {/* Top Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div>
              <span className="text-xs text-gray-500 font-bold uppercase block">Parcel Identifier</span>
              <h2 className="text-lg font-bold text-amazon-navy font-mono">{parcel.id} ({parcel.tracking_id})</h2>
              <p className="text-xs text-gray-600">Order Ref: {parcel.order_ref}</p>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                parcel.status === 'HANDED_OVER'
                  ? 'bg-green-100 text-amazon-green border-green-300'
                  : parcel.status === 'AWAITING_HANDOVER'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-red-100 text-amazon-red border-red-300'
              }`}>
                {parcel.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-1">
              <span className="font-bold text-gray-500 uppercase block text-[10px]">Recipient Info</span>
              <p className="font-bold text-amazon-navy text-sm">{parcel.recipient_name_masked}</p>
              <p className="text-gray-600">Hostel: {parcel.recipient_hostel}</p>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-1">
              <span className="font-bold text-gray-500 uppercase block text-[10px]">Parcel Contents</span>
              <p className="font-medium text-gray-900">{parcel.parcel_description}</p>
              <p className="text-amazon-orange font-bold">Assigned Bin: {parcel.shelf_location}</p>
            </div>
          </div>

          {/* Raise Complaint / Feedback Button */}
          <div className="flex items-center justify-between bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs">
            <div>
              <h4 className="font-bold text-amazon-navy text-sm flex items-center space-x-1.5">
                <MessageSquare size={16} className="text-amazon-orange" />
                <span>Issue with your parcel delivery?</span>
              </h4>
              <p className="text-gray-600 mt-0.5">Submit feedback or lodge a complaint directly to the Campus Operations Operator.</p>
            </div>
            <button
              onClick={() => setShowComplaintForm(!showComplaintForm)}
              className="bg-amazon-navy text-white font-bold py-2 px-4 rounded-lg hover:bg-amazon-dark transition-colors shadow-sm shrink-0"
            >
              {showComplaintForm ? 'Close Complaint Form' : 'Raise Complaint / Feedback'}
            </button>
          </div>

          {/* Complaint / Feedback Form */}
          {showComplaintForm && (
            <form onSubmit={handleSubmitComplaint} className="bg-white p-5 rounded-xl border-2 border-amazon-orange space-y-4 text-xs">
              <h3 className="font-bold text-amazon-navy text-sm border-b pb-2 flex items-center space-x-2">
                <AlertTriangle size={16} className="text-amazon-orange" />
                <span>Lodge Complaint / Provide Delivery Feedback</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Issue Category:</label>
                  <select
                    value={complaintType}
                    onChange={(e) => setComplaintType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="DELAYED_DELIVERY">Delayed Delivery / Missed SLA</option>
                    <option value="DAMAGED_PARCEL">Damaged Parcel / Packaging</option>
                    <option value="LOCKER_ISSUE">Automated Locker Access Problem</option>
                    <option value="DRIVER_BEHAVIOR">Delivery Personnel Feedback</option>
                    <option value="OTHER">Other Query / Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Phone / Email:</label>
                  <input
                    type="text"
                    placeholder="e.g. +91-9876543210"
                    value={studentContact}
                    onChange={(e) => setStudentContact(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Detailed Description of Complaint / Feedback:</label>
                <textarea
                  rows={3}
                  placeholder="Describe what happened (e.g. parcel was left in wrong hostel lobby, locker pin didn't open...)"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submittingComplaint}
                className="w-full bg-amazon-orange hover:bg-amazon-amber text-amazon-navy font-bold py-2.5 rounded-lg text-xs transition-colors shadow-md"
              >
                {submittingComplaint ? 'Submitting...' : 'Submit Complaint to Operator'}
              </button>
            </form>
          )}

          {/* Failure Explanation if failed attempt */}
          {['FAILED_ATTEMPT', 'RESOLUTION_PENDING', 'REDELIVERY_SCHEDULED', 'PICKUP_REQUESTED', 'ESCALATED'].includes(parcel.status) && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-xs space-y-2">
              <h4 className="font-bold text-amazon-red flex items-center space-x-1 text-sm">
                <AlertTriangle size={16} />
                <span>Delivery Handover Status Explanation</span>
              </h4>
              <p className="text-gray-800">
                The delivery partner attempted handover, but logged failure reason:{' '}
                <strong className="text-amazon-red">{parcel.failed_reason ? parcel.failed_reason.replace('_', ' ') : 'Recipient Unavailable'}</strong>.
              </p>
              <p className="text-gray-600">
                You can select an authorized resolution option below to receive your parcel without delay.
              </p>
            </div>
          )}

          {/* Authorized Resolution Options Form */}
          {parcel.status !== 'HANDED_OVER' && (
            <form onSubmit={handleRequestRecovery} className="bg-amazon-light p-5 rounded-xl border border-amazon-border space-y-4">
              <h3 className="font-bold text-amazon-navy text-sm flex items-center space-x-1.5">
                <Sparkles size={16} className="text-amazon-orange" />
                <span>Select Your Preferred Delivery Resolution Option:</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-2 ${
                  recoveryChoice === 'CAMPUS_PICKUP'
                    ? 'bg-white border-amazon-orange shadow-sm ring-2 ring-amazon-orange/20'
                    : 'bg-gray-50 border-gray-200 hover:bg-white'
                }`}>
                  <input
                    type="radio"
                    name="recoveryChoice"
                    checked={recoveryChoice === 'CAMPUS_PICKUP'}
                    onChange={() => setRecoveryChoice('CAMPUS_PICKUP')}
                    className="mt-0.5 accent-amazon-orange"
                  />
                  <div>
                    <span className="font-bold text-amazon-navy text-xs block">Hold at Campus Pickup Locker</span>
                    <span className="text-[11px] text-gray-500">Pick up anytime from an authorized campus hub locker bay.</span>
                  </div>
                </label>

                <label className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-2 ${
                  recoveryChoice === 'SCHEDULE_REDELIVERY'
                    ? 'bg-white border-amazon-orange shadow-sm ring-2 ring-amazon-orange/20'
                    : 'bg-gray-50 border-gray-200 hover:bg-white'
                }`}>
                  <input
                    type="radio"
                    name="recoveryChoice"
                    checked={recoveryChoice === 'SCHEDULE_REDELIVERY'}
                    onChange={() => setRecoveryChoice('SCHEDULE_REDELIVERY')}
                    className="mt-0.5 accent-amazon-orange"
                  />
                  <div>
                    <span className="font-bold text-amazon-navy text-xs block">Schedule Hostel Redelivery</span>
                    <span className="text-[11px] text-gray-500">Schedule redelivery during your next free hostel slot.</span>
                  </div>
                </label>
              </div>

              {recoveryChoice === 'CAMPUS_PICKUP' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Select Campus Pickup Locker Point:</label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amazon-orange bg-white"
                  >
                    {pickupLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.building} - {loc.operating_hours})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {recoveryChoice === 'SCHEDULE_REDELIVERY' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preferred Time Window:</label>
                  <input
                    type="text"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Special Delivery Note for Driver:</label>
                <input
                  type="text"
                  placeholder="e.g. Leave with Hostel Reception if absent..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amazon-orange hover:bg-amazon-amber text-amazon-navy font-bold py-3 rounded-lg text-sm shadow-md transition-colors"
              >
                Submit Resolution Preference
              </button>
            </form>
          )}

          {/* Timeline Updates */}
          <div className="space-y-3">
            <h4 className="font-bold text-amazon-navy text-xs uppercase tracking-wider text-gray-500 border-b pb-1">
              Status Event History
            </h4>
            <div className="space-y-2">
              {parcel.events && parcel.events.map((evt) => (
                <div key={evt.id} className="bg-gray-50 p-2.5 rounded border border-gray-200 text-xs flex justify-between">
                  <div>
                    <span className="font-bold text-amazon-navy">{evt.event_type.replace('_', ' ')}</span>
                    <p className="text-gray-600">{evt.details || evt.reason || 'Status updated'}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-amazon-border shadow-sm text-center py-12 text-xs text-gray-500">
          Enter your tracking ID or order reference above to check delivery status and schedule locker pickup.
        </div>
      )}
    </div>
  );
};
