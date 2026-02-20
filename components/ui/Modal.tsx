import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
  zIndex?: number;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, width = 'max-w-lg', zIndex = 50 }) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4`} style={{ zIndex }} onClick={onClose}>
      <div
        className={`relative w-full ${width} border bg-white p-4 sm:p-6 shadow-lg duration-200 rounded-lg sm:rounded-lg max-h-[90vh] flex flex-col`}
        style={{ zIndex: zIndex + 1, animation: 'comboboxFadeIn 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-1.5 text-center sm:text-left shrink-0">
          {title && (
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold leading-none tracking-tight text-[#135D54]">{title}</h3>
              <button
                onClick={onClose}
                className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#135D54] focus:ring-offset-2 disabled:pointer-events-none"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          )}
        </div>
        <div className="mt-3 overflow-y-auto flex-1 -mx-2 px-2">
          {children}
        </div>
      </div>
    </div>
  );
};