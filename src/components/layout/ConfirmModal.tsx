import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-graphite-900/40 backdrop-blur-sm" 
        onClick={onCancel}
      ></div>
      
      <div className="relative w-full max-w-sm glass-card p-6 rounded-3xl animate-in fade-in zoom-in-95 duration-200 shadow-2xl border border-white/40">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-graphite-400 hover:text-graphite-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-coral-DEFAULT/10 flex items-center justify-center mb-4">
            <AlertTriangle className="text-coral-DEFAULT" size={24} />
          </div>
          <h2 className="text-xl font-display font-bold text-graphite-100 mb-2">{title}</h2>
          <p className="text-sm text-graphite-400 font-medium">{message}</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-graphite-500 bg-black/5 hover:bg-black/10 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-coral-DEFAULT hover:bg-coral-DEFAULT/90 transition-colors shadow-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
