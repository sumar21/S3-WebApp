import React from 'react';
import { X, Clock, Stethoscope, MapPin, Calendar as CalendarIcon, User } from 'lucide-react';
import { Button } from '../ui/Button';

interface AbsenceEvent {
    ID: number;
    User_AS: string;
    Sector_AS: string;
    FechaInicio_AS: string;
    Franja_AS: string;
    Status_AS: 'Tomado' | 'Pendiente' | 'Cancelado';
    Motivo_AS: string;
    CorreoAusenceia_AS?: string;
    UserReemplazo_AS?: string;
    IDUnicoAusencia_AS?: string;
}

interface EventDetails {
    id: string;
    day: number;
    type: string;
    startTime: string;
    endTime: string;
    doctorName?: string;
    clinicName: string;
    clinicAddress: string;
    status: 'taken' | 'pending' | 'cancelled' | 'expired';
    originalData: AbsenceEvent;
}

interface EventDetailsModalProps {
    event: EventDetails | null;
    onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose }) => {
    if (!event) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className={`h-24 relative overflow-hidden ${event.status === 'taken' ? 'bg-[#135D54]' :
                    event.status === 'pending' ? 'bg-yellow-400' :
                        event.status === 'expired' ? 'bg-gray-400' : 'bg-red-500'
                    }`}>
                    <div className="absolute inset-0 bg-white/10 opacity-30"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 text-white rounded-full p-1.5 transition-colors"><X size={20} /></button>
                    <div className="absolute bottom-4 left-6 text-white">
                        <div className="flex items-center gap-2 mb-1 opacity-90 text-[10px] font-bold uppercase"><CalendarIcon size={12} /> {event.originalData.FechaInicio_AS}</div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {event.status === 'taken' ? 'Turno Confirmado' :
                                event.status === 'pending' ? 'Turno Pendiente' :
                                    event.status === 'expired' ? 'Turno Vencido' : 'Turno Cancelado'}
                        </h2>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600"><Clock size={20} /></div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Horario</p>
                                <p className="text-sm text-gray-900 font-semibold">{event.startTime} - {event.endTime}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Estado</p>
                                <p className="text-sm text-gray-900 font-semibold">{event.status === 'expired' ? 'Vencida' : event.originalData.Status_AS}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600"><Stethoscope size={20} /></div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#135D54]/10 text-[#135D54] flex items-center justify-center font-bold">{event.doctorName?.charAt(0)}</div>
                            <div>
                                <h4 className="font-bold text-gray-900">{event.doctorName}</h4>
                                <p className="text-xs text-gray-500">Profesional Ausente</p>
                            </div>
                        </div>
                    </div>

                    {(() => {
                        const replacer = event.originalData.UserReemplazo_AS || (event.originalData as any).UsuarioReemplazo_AS || (event.originalData as any).UserReemplazo_R || (event.originalData as any).UsuarioReemplazo_R;
                        if (event.status === 'taken' && replacer) {
                            return (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-indigo-900">{replacer}</h4>
                                            <p className="text-xs text-indigo-500 font-medium">Médico que tomó el reemplazo</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Motivo / Notas</p>
                        <p className="text-xs text-gray-700 leading-relaxed italic">"{event.originalData.Motivo_AS || 'Sin observaciones'}"</p>
                    </div>

                    <div className="mb-6 flex items-start gap-3"><MapPin size={20} className="text-gray-400 mt-1" /><div><h4 className="font-bold text-gray-900 text-sm">{event.clinicName}</h4><p className="text-xs text-gray-500">Área Hospitalaria</p></div></div>
                    <div className="flex pt-2 gap-2"><Button variant="outline" className="flex-1 h-12 text-base font-semibold border-gray-200" onClick={onClose}>Cerrar</Button></div>
                </div>
            </div>
        </div>
    );
};
