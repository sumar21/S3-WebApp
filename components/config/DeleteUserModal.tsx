import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { User } from '../../types';

interface DeleteUserModalProps {
    user: User | null;
    onConfirm: () => void;
    onClose: () => void;
    loading: boolean;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, onConfirm, onClose, loading }) => {
    return (
        <Modal isOpen={!!user} onClose={onClose} title="Eliminar usuario" width="max-w-md">
            <div className="flex flex-col gap-6 py-2">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                    <div className="p-2 rounded-lg bg-white text-red-600 shadow-sm shrink-0">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-red-900 mb-1">¿Deseas eliminar a este usuario?</p>
                        <p className="text-sm text-red-700/80 leading-relaxed">
                            Estás por eliminar permanentemente a <span className="font-bold text-red-900">{user?.surname}, {user?.name}</span>. Esta acción no se puede deshacer.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 h-12 rounded-xl text-gray-500 font-medium"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 font-bold shadow-lg shadow-red-200"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" />
                        ) : (
                            "Eliminar definitivamente"
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
