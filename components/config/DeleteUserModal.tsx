import React from 'react';
import { Loader2 } from 'lucide-react';
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
        <Modal isOpen={!!user} onClose={onClose} title="Eliminar usuario" width="max-w-sm">
            <div className="space-y-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-4">
                    <p>¿Estás seguro de que deseas eliminar a <strong>{user?.surname}, {user?.name}</strong>?</p>
                    <p className="mt-1 font-medium">Esta acción no se puede deshacer.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button variant="danger" className="flex-1" onClick={onConfirm} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : "Eliminar definitivamente"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
