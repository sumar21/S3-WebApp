
import React from 'react';
import { History, CalendarOff, Clock, Calendar, Trash2, Filter, X } from 'lucide-react';
import { DatePicker } from '../ui/DatePicker';
import { Combobox } from '../ui/Combobox';

interface AbsenceHistoryProps {
    absences: any[];
    isFetching: boolean;
    filters: {
        dateFrom: string;
        dateTo: string;
        status: string;
    };
    setFilters: React.Dispatch<React.SetStateAction<{
        dateFrom: string;
        dateTo: string;
        status: string;
    }>>;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    onCancel: (absence: any) => void;
    getStatusColor: (status: string) => string;
    parseDateFromAPI: (dateStr: string) => Date;
    today: Date;
}

export const AbsenceHistory: React.FC<AbsenceHistoryProps> = ({
    absences,
    isFetching,
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    onCancel,
    getStatusColor,
    parseDateFromAPI,
    today
}) => {
    const handleFilterChange = (name: string, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ dateFrom: '', dateTo: '', status: '' });
    };

    const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.status !== '';

    const statusOptions = [
        { value: 'Pendiente', label: 'Pendiente' },
        { value: 'Tomado', label: 'Tomado' },
        { value: 'Cancelado', label: 'Cancelado' }
    ];

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="w-8 h-8 border-4 border-[#135D54] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 text-sm">Cargando historial...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 flex-1">
            {/* Header and Filter Controls */}
            <div className="flex flex-col gap-4 mb-2">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-800">Historial</h2>
                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{absences.length}</span>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${showFilters || hasActiveFilters ? 'bg-[#135D54] text-white border-[#135D54]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Filter size={14} />
                        Filtros
                        {hasActiveFilters && (
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 ml-1"></div>
                        )}
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm animate-in slide-in-from-top-2 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                            <DatePicker
                                label="Desde"
                                value={filters.dateFrom}
                                onChange={(val) => handleFilterChange('dateFrom', val)}
                            />
                            <DatePicker
                                label="Hasta"
                                value={filters.dateTo}
                                onChange={(val) => handleFilterChange('dateTo', val)}
                            />
                            <Combobox
                                label="Estado"
                                options={statusOptions}
                                value={filters.status}
                                onChange={(val) => handleFilterChange('status', val)}
                                placeholder="Todos"
                                searchable={false}
                            />
                            <button
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className="h-10 px-4 rounded-md text-xs font-bold border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <X size={14} /> Limpiar
                            </button>
                        </div>
                    </div>
                )}

                {!hasActiveFilters && !showFilters && (
                    <div className="bg-[#135D54]/5 border border-[#135D54]/10 p-3 rounded-xl flex items-start gap-3">
                        <div className="bg-white p-1 rounded-full text-[#135D54]">
                            <History size={14} />
                        </div>
                        <div className="text-xs text-[#135D54]">
                            <span className="font-bold block mb-0.5">Vista simplificada</span>
                            Mostrando ausencias desde hoy en adelante. Usa los filtros para ver el historial completo.
                        </div>
                    </div>
                )}
            </div>

            {absences.length > 0 ? (
                <>
                    {/* Desktop/Tablet (Table) */}
                    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Servicio</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Horario</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Fecha</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {absences.map((item) => {
                                    const isExpired = item.Status_AS === 'Pendiente' && parseDateFromAPI(item.FechaInicio_AS) < today;
                                    const displayStatus = isExpired ? 'Vencida' : item.Status_AS;

                                    return (
                                        <tr key={item.ID} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border w-fit inline-block ${getStatusColor(displayStatus)}`}>
                                                    {displayStatus}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#135D54]">{item.Servicio_AS}</span>
                                                    <span className="text-xs text-gray-400">{item.Sector_AS}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                                                    <Clock size={14} className="text-gray-400" />
                                                    {item.Franja_AS}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5 text-sm text-gray-900 font-bold">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    {item.FechaInicio_AS}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {item.Status_AS === 'Pendiente' && !isExpired && (
                                                    <button
                                                        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer group"
                                                        onClick={() => onCancel(item)}
                                                        title="Cancelar ausencia"
                                                    >
                                                        <Trash2 size={18} className="transition-transform group-hover:scale-110" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile (Cards) */}
                    <div className="md:hidden grid grid-cols-1 gap-4">
                        {absences.map((item) => {
                            const isExpired = item.Status_AS === 'Pendiente' && parseDateFromAPI(item.FechaInicio_AS) < today;
                            const displayStatus = isExpired ? 'Vencida' : item.Status_AS;

                            return (
                                <div key={item.ID} className={`bg-white p-5 rounded-[28px] border ${isExpired ? 'border-gray-100 grayscale-[0.3]' : 'border-gray-200'} shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="space-y-1">
                                            <div className={`text-[10px] font-bold px-3 py-1 rounded-full border w-fit ${getStatusColor(displayStatus)}`}>
                                                {displayStatus}
                                            </div>
                                            <h4 className={`text-[#135D54] font-bold text-base mt-2 ${isExpired ? 'opacity-70' : ''}`}>{item.Servicio_AS}</h4>
                                            <p className="text-gray-400 text-xs font-medium">{item.Sector_AS}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="bg-gray-50 p-2 rounded-xl text-gray-400 group-hover:text-[#135D54] transition-colors self-end">
                                                <Calendar size={18} />
                                            </div>
                                            {item.Status_AS === 'Pendiente' && !isExpired && (
                                                <button
                                                    className="bg-red-50 p-2 rounded-xl text-red-500 hover:bg-red-100 transition-colors self-end"
                                                    onClick={() => onCancel(item)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Clock size={14} className="opacity-50" />
                                            <span className="text-[11px] font-bold">{item.Franja_AS}</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-lg">
                                            {item.FechaInicio_AS}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <CalendarOff size={40} className="text-gray-200" />
                    </div>
                    <h4 className="text-gray-800 font-bold text-lg">No hay registros</h4>
                    <p className="text-gray-400 text-sm max-w-[240px] mt-2">
                        {hasActiveFilters
                            ? "No se encontraron ausencias con los filtros aplicados."
                            : "No tienes ausencias registradas próximamente."}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="mt-4 text-[#135D54] text-xs font-bold hover:underline"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
