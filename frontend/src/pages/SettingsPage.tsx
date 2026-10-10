import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Campus, PickupLocation, UserRole } from '../types';
import { useApp } from '../context/AppContext';
import { Settings, RefreshCw, Building, MapPin, Shield, FileSpreadsheet, User, Bell, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { role, setRole, showToast, triggerRefresh } = useApp();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [pickups, setPickups] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // New pickup location form state
  const [newLocName, setNewLocName] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newHours, setNewHours] = useState('08:00 - 20:00');

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const cList = await api.getCampuses();
      const pList = await api.getPickupLocations();
      setCampuses(cList);
      setPickups(pList);
    } catch (err) {
      showToast('Failed to load settings configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddPickupLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newBuilding) return;
    try {
      await api.addPickupLocation({
        campus_id: 1,
        name: newLocName,
        building: newBuilding,
        room_number: newRoom || 'Main Hub',
        operating_hours: newHours,
        is_active: true,
      });
      showToast(`Added new campus pickup point '${newLocName}'!`, 'success');
      setNewLocName('');
      setNewBuilding('');
      setNewRoom('');
      fetchSettings();
    } catch (err) {
      showToast('Failed to add pickup location', 'error');
    }
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetDemoData();
      showToast('Demo data reset cleanly to initial seed state!', 'success');
      setResetConfirmOpen(false);
      triggerRefresh();
      fetchSettings();
    } catch (err) {
      showToast('Failed to reset demo data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-amazon-navy text-white p-6 rounded-xl border border-gray-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <Settings size={22} className="text-amazon-orange" />
            <span>Settings & System Configuration</span>
          </h1>
          <p className="text-xs text-gray-300 mt-1">
            Manage campus delivery locations, pickup lockers, CSV field maps, user roles, and demo dataset reset.
          </p>
        </div>

        <button
          onClick={() => setResetConfirmOpen(true)}
          className="bg-amazon-red hover:bg-red-800 text-white font-bold py-2.5 px-5 rounded-lg text-xs flex items-center space-x-2 transition-colors shadow-sm"
        >
          <RefreshCw size={16} />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Grid: Campus Locations & Pickup Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Approved Pickup Points */}
        <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm space-y-4">
          <h3 className="font-bold text-amazon-navy text-base border-b pb-2 flex items-center space-x-2">
            <MapPin size={18} className="text-amazon-orange" />
            <span>Approved Campus Pickup Locations</span>
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {pickups.map((p) => (
              <div key={p.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-amazon-navy">
                  <span>{p.name}</span>
                  <span className="text-[10px] bg-green-100 text-amazon-green px-2 py-0.5 rounded">Active Locker</span>
                </div>
                <p className="text-gray-600">{p.building} • Room {p.room_number}</p>
                <p className="text-gray-400 font-mono text-[10px]">Hours: {p.operating_hours}</p>
              </div>
            ))}
          </div>

          {/* Add Pickup Location Form */}
          <form onSubmit={handleAddPickupLocation} className="pt-2 border-t space-y-2 text-xs">
            <h4 className="font-bold text-gray-700">Add New Pickup Location:</h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Hub Name (e.g. Hostel C Locker)"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                className="p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Building Name"
                value={newBuilding}
                onChange={(e) => setNewBuilding(e.target.value)}
                className="p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Room / Bay (e.g. Bay 2)"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className="p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Hours (e.g. 24/7)"
                value={newHours}
                onChange={(e) => setNewHours(e.target.value)}
                className="p-2 border border-gray-300 rounded"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amazon-navy hover:bg-amazon-dark text-white font-bold py-2 rounded text-xs transition-colors"
            >
              Add Pickup Location
            </button>
          </form>
        </div>

        {/* CSV Field Mapping & Role Switcher */}
        <div className="space-y-6">
          {/* Role Switcher */}
          <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm space-y-3">
            <h3 className="font-bold text-amazon-navy text-base border-b pb-2 flex items-center space-x-2">
              <User size={18} className="text-amazon-orange" />
              <span>Demo Role Simulator</span>
            </h3>
            <p className="text-xs text-gray-600">Switch user role view to evaluate role-specific workflows:</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(['DELIVERY_PARTNER', 'OPERATIONS_MANAGER', 'STUDENT'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`py-2 px-2 rounded font-bold border transition-all ${
                    role === r
                      ? 'bg-amazon-orange text-amazon-navy border-amazon-orange shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* CSV Field Mapping Guide */}
          <div className="bg-white p-5 rounded-xl border border-amazon-border shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-amazon-navy text-base border-b pb-2 flex items-center space-x-2">
              <FileSpreadsheet size={18} className="text-amazon-orange" />
              <span>CSV Ingestion Field Standard</span>
            </h3>
            <div className="bg-amazon-light p-3 rounded-lg font-mono text-[11px] text-gray-800 space-y-1 border border-amazon-border">
              <p className="font-bold text-amazon-navy">Required CSV Column Headers:</p>
              <p className="text-amazon-orange font-bold">tracking_id, order_ref, recipient_name, recipient_phone, recipient_hostel, parcel_description, shelf_location</p>
            </div>
            <p className="text-gray-500">
              The ingestion engine validates duplicate tracking IDs, rejects missing fields, and assigns shelf bin locations automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-amazon-border">
            <h3 className="font-bold text-lg text-amazon-navy flex items-center space-x-2">
              <RefreshCw className="text-amazon-red" size={20} />
              <span>Confirm Demo Data Reset</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              This will reset the database to a clean initial seed state with 50 synthetic parcels, 4 batches, 3 campuses, and realistic event history.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                disabled={isResetting}
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                disabled={isResetting}
                onClick={handleResetDemo}
                className="px-4 py-2 bg-amazon-red text-white rounded text-sm font-bold hover:bg-red-800"
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
