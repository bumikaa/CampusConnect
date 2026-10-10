import React from 'react';
import { PackageCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-amazon-navy text-gray-400 py-6 border-t border-gray-800 text-xs mt-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-amazon-orange text-amazon-navy px-2.5 py-0.5 rounded font-bold text-xs">
            CampusConnect
          </div>
          <span className="text-gray-300 font-medium">Smarter Bulk Deliveries. Fewer Failed Handovers.</span>
        </div>

        <div className="text-gray-400 text-center md:text-right">
          <span>Campus Parcel Delivery & Resolution System</span>
        </div>
      </div>
    </footer>
  );
};
