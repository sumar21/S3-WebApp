
import React from 'react';
import { Calendar, Clock, MapPin, User as UserIcon, Trash2, AlertCircle, History } from 'lucide-react';
import { ErrorMessage } from '../ui/ErrorMessage';

interface ReplacementsListProps {
    replacements: any[];
    isFetching: boolean;
    error?: boolean;
    onRetry?: () => void;
    onCancel: (item: any) => void;
    checkCanCancel: (dateStr: string, franjaStr: string) => boolean;
}

export const ReplacementsList: React.FC<ReplacementsListProps> = ({
    replacements,
    isFetching,
    error,
    onRetry,
    onCancel,
    checkCanCancel
}) => {
    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#135D54] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 text-sm mt-4">Cargando reemplazos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm">
                <ErrorMessage
                    message="No pudimos cargar la lista de tus reemplazos."
                    onRetry={onRetry || (() => { })}
                />
            </div>
        );
    }

    if (replacements.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <History size={48} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No tienes reemplazos registrados aún.</p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop/Tablet Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Horario</th>
                            <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lugar / Servicio</th>
                            <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reemplazando a</th>
                            <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {replacements.map((item) => {
                            const canCancel = checkCanCancel(item.Fechainicio_R, item.Franja_R);
                            return (
                                <tr key={item.ID} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <span className="text-[10px] font-bold text-[#135D54] bg-[#135D54]/5 px-3 py-1 rounded-full uppercase tracking-wider border border-[#135D54]/10">
                                            {item.Status_R}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                            <Calendar size={16} className="text-gray-400" />
                                            {item.Fechainicio_R}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock size={16} className="text-gray-400" />
                                            {item.Franja_R}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin size={16} className="text-gray-400" />
                                            {item.SectorA_R}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <UserIcon size={16} className="text-gray-400" />
                                            <span className="font-bold text-[#135D54]">{item.UsuarioAusente_R}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <button
                                            disabled={!canCancel}
                                            onClick={() => onCancel(item)}
                                            className={`p-2 rounded-full transition-colors ${canCancel ? 'text-red-500 hover:bg-red-50' : 'text-gray-300 cursor-not-allowed'}`}
                                            title={canCancel ? "Cancelar reemplazo" : "No se puede cancelar (faltan menos de 72h)"}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {replacements.map((item) => {
                    const canCancel = checkCanCancel(item.Fechainicio_R, item.Franja_R);
                    return (
                        <div key={item.ID} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold text-[#135D54] bg-[#135D54]/5 px-3 py-1 rounded-full uppercase tracking-wider">{item.Status_R}</span>
                                <button
                                    disabled={!canCancel}
                                    onClick={() => onCancel(item)}
                                    className={`p-2 rounded-xl transition-colors ${canCancel ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-300'}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg mb-1">{item.Fechainicio_R}</h4>
                            <div className="space-y-2 mt-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2"><Clock size={16} /> {item.Franja_R}</div>
                                <div className="flex items-center gap-2"><MapPin size={16} /> {item.SectorA_R}</div>
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-50"><UserIcon size={16} /> Reemplazando a: <span className="font-bold text-[#135D54]">{item.UsuarioAusente_R}</span></div>
                            </div>
                            {!canCancel && <p className="text-[10px] text-gray-400 mt-3 italic flex items-center gap-1"><AlertCircle size={10} /> No disponible (menos de 72h)</p>}
                        </div>
                    );
                })}
            </div>
        </>
    );
};
