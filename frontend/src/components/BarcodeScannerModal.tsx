import React, { useState } from 'react';
import { Camera, X, Check, Barcode, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScan: (trackingId: string) => void;
  sampleTrackingIds: string[];
}

export const BarcodeScannerModal: React.FC<Props> = ({ isOpen, onClose, onScan, sampleTrackingIds }) => {
  const [scannedId, setScannedId] = useState('');

  if (!isOpen) return null;

  const handleSimulateScan = (id: string) => {
    setScannedId(id);
    setTimeout(() => {
      onScan(id);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-amazon-border">
        {/* Header */}
        <div className="bg-amazon-navy text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="text-amazon-orange" size={20} />
            <h3 className="font-bold text-base">Barcode & OCR Scanner</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder simulation */}
        <div className="p-5 space-y-4">
          <div className="relative bg-gray-900 rounded-lg h-48 flex flex-col items-center justify-center overflow-hidden border-2 border-dashed border-amazon-orange">
            <div className="absolute inset-0 bg-gradient-to-b from-amazon-orange/10 via-transparent to-amazon-orange/10 animate-pulse pointer-events-none" />
            <Barcode size={64} className="text-amazon-amber mb-2 opacity-80" />
            <p className="text-xs text-gray-300 font-mono">Position barcode within viewfinder</p>
            <div className="absolute bottom-2 left-2 text-[10px] text-amazon-orange bg-black/60 px-2 py-0.5 rounded font-mono flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              <span>CAMERA ACTIVE (1080p 60fps)</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Sparkles size={14} className="text-amazon-orange" />
              <span>Tap Sample Barcode to Scan:</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {sampleTrackingIds.slice(0, 6).map((id) => (
                <button
                  key={id}
                  onClick={() => handleSimulateScan(id)}
                  className={`px-3 py-2 text-xs font-mono rounded border text-left transition-all flex items-center justify-between ${
                    scannedId === id
                      ? 'bg-amazon-orange text-amazon-navy font-bold border-amazon-orange'
                      : 'bg-gray-50 border-gray-200 text-gray-800 hover:border-amazon-orange hover:bg-amazon-light'
                  }`}
                >
                  <span className="truncate">{id}</span>
                  {scannedId === id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-md transition-colors"
            >
              Cancel Scanner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
