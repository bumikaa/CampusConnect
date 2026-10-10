import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center space-x-3 p-3.5 rounded-lg shadow-lg text-white font-medium text-sm transition-all duration-300 animate-slide-in ${
            toast.type === 'success'
              ? 'bg-amazon-green'
              : toast.type === 'error'
              ? 'bg-amazon-red'
              : 'bg-amazon-dark border border-amazon-orange text-amazon-amber'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 size={18} className="flex-shrink-0" />}
          {toast.type === 'error' && <AlertTriangle size={18} className="flex-shrink-0" />}
          {toast.type === 'info' && <Info size={18} className="flex-shrink-0" />}
          <span className="flex-1">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
