import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorMessageProps {
    message: string;
    onRetry: () => void;
    className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry, className = "" }) => {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center bg-red-50/50 rounded-2xl border border-red-100 animate-in fade-in zoom-in duration-300 ${className}`}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 border border-red-200">
                <AlertCircle size={24} className="text-red-500" />
            </div>
            <h3 className="text-gray-900 font-bold mb-2">¡Oops! Algo salió mal</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-[250px] mx-auto leading-relaxed">
                {message}
            </p>
            <Button
                onClick={onRetry}
                variant="outline"
                className="gap-2 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95"
            >
                <RotateCw size={16} />
                Reintentar
            </Button>
        </div>
    );
};
