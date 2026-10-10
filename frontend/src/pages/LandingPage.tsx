import React from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch, ShieldCheck, BarChart3, ArrowRight, Truck, Search, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LandingPage: React.FC = () => {
  const { setRole } = useApp();

  return (
    <div className="space-y-10 pb-8">
      {/* Hero Section */}
      <section className="bg-amazon-navy text-white py-14 px-4 sm:px-6 lg:px-8 border-b-4 border-amazon-orange rounded-b-2xl shadow-xl">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <img
              src="/CampusConnect/logo.jpg"
              alt="CampusConnect Logo"
              className="w-24 h-24 object-contain rounded-2xl border-2 border-amazon-orange/40 bg-amazon-navy p-1 shadow-lg"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Every Parcel Accounted For. <br />
            <span className="text-amazon-orange">Every Handover Simplified.</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
            CampusConnect provides high-speed bulk parcel identification, barcode scanner lookup, student delivery tracking, and authorized handover recovery.
          </p>
        </div>
      </section>

      {/* Role Selection Portal Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-amazon-navy">Select Your Access Portal</h2>
          <p className="text-xs text-gray-600">Choose your operational role to open the specialized interface.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User / Student Card */}
          <div className="bg-white p-6 rounded-xl border border-amazon-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amazon-orange rounded-lg flex items-center justify-center border border-amber-200">
                <Search size={24} />
              </div>
              <h3 className="font-bold text-lg text-amazon-navy">User / Student Portal</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Track your incoming campus parcels by order reference or tracking ID. View real-time delivery status and select authorized campus pickup lockers or redelivery windows.
              </p>
            </div>
            <Link
              to="/student"
              onClick={() => setRole('STUDENT')}
              className="bg-amazon-orange hover:bg-amazon-amber text-amazon-navy font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
            >
              <span>Track My Parcel</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Delivery Person Card */}
          <div className="bg-white p-6 rounded-xl border border-amazon-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-amazon-navy rounded-lg flex items-center justify-center border border-blue-200">
                <Truck size={24} />
              </div>
              <h3 className="font-bold text-lg text-amazon-navy">Delivery Person Interface</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Search bulk assigned parcels by tracking ID, order ID, or recipient name. View assigned delivery queues, shelf bin locations, 1-click handovers, and log failure reasons.
              </p>
            </div>
            <Link
              to="/partner"
              onClick={() => setRole('DELIVERY_PARTNER')}
              className="bg-amazon-navy hover:bg-amazon-dark text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
            >
              <span>Open Delivery Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Campus Admin Card */}
          <div className="bg-white p-6 rounded-xl border border-amazon-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-green-50 text-amazon-green rounded-lg flex items-center justify-center border border-green-200">
                <Shield size={24} />
              </div>
              <h3 className="font-bold text-lg text-amazon-navy">Campus Admin Dashboard</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Ingest order datasets, monitor campus batch performance, manage unresolved recovery queues, analyze dataset statistics, and configure campus pickup lockers.
              </p>
            </div>
            <Link
              to="/analytics"
              onClick={() => setRole('OPERATIONS_MANAGER')}
              className="bg-amazon-dark hover:bg-gray-800 text-amazon-amber border border-amazon-orange/40 font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Campus Admin Analytics</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
