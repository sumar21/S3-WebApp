
import React from 'react';

interface LoaderProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loader: React.FC<LoaderProps> = ({ 
  text = "Cargando datos...", 
  className = "",
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  const logoSizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Outer Ring Background */}
        <div className="absolute inset-0 border-4 border-[#135D54]/10 rounded-full"></div>
        
        {/* Spinning Outer Ring */}
        <div className="absolute inset-0 border-4 border-[#135D54] border-t-transparent rounded-full animate-spin"></div>
        
        {/* Inner Pulsing Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
           <div className={`${logoSizes[size]} bg-[#135D54] rounded-lg flex items-center justify-center shadow-lg shadow-[#135D54]/20 animate-pulse`}>
              <span className="text-white font-bold tracking-tighter">S3</span>
           </div>
        </div>
      </div>
      
      {text && (
        <div className="mt-6 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">{text}</p>
        </div>
      )}
    </div>
  );
};
