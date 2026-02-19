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
    <div className={`fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0`} style={{ zIndex }}>
      <div 
        className={`relative grid w-full ${width} gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg md:w-full animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]`}
        style={{ zIndex: zIndex + 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          {title && (
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold leading-none tracking-tight text-[#135D54]">{title}</h3>
                <button 
                    onClick={onClose} 
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#135D54] focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            </div>
          )}
        </div>
        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  );
};