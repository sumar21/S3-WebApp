import React from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface CVViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    cvPdfUrl: string | null;
}

export const CVViewerModal: React.FC<CVViewerModalProps> = ({ isOpen, onClose, cvPdfUrl }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Visualizador de CV" width="max-w-5xl" zIndex={60}>
            <div className="flex flex-col gap-4">
                <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200 h-[70vh]">
                    {cvPdfUrl ? (
                        <iframe
                            src={cvPdfUrl}
                            className="w-full h-full border-none"
                            title="Visor PDF"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            No hay documento para mostrar
                        </div>
                    )}
                </div>
                <div className="flex justify-end">
                    <Button onClick={onClose}>Cerrar Ventana</Button>
                </div>
            </div>
        </Modal>
    );
};
