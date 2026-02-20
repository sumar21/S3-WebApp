
import React from 'react';
import { Calendar, Briefcase, HelpCircle, History, CalendarOff, CalendarCheck, ArrowRight, RefreshCw, Loader2, MapPin, Clock, User as UserIcon, Stethoscope } from 'lucide-react';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';

interface HomeDashboardProps {
    firstName: string;
    totalAbsencesCount: number;
    pendingAbsencesCount: number;
    activeReplacementsCount: number;
    nextShift: any | null;
    isFetchingUserReplacements: boolean;
    isFetchingReplacements: boolean;
    errorUserReplacements?: boolean;
    errorReplacements?: boolean;
    onRetryUserReplacements?: () => void;
    onRetryReplacements?: () => void;
    availableReplacements: any[];
    homeTab: 'Hoy' | 'Mañana' | 'Todos';
    setHomeTab: (tab: 'Hoy' | 'Mañana' | 'Todos') => void;
    onNavigate: (screen: 'absences' | 'replacements') => void;
    onTakeReplacement: (item: any) => void;
    parseDate: (str: string) => Date;
    monthsList: string[];
    serviceName?: string;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
    firstName,
    totalAbsencesCount,
    pendingAbsencesCount,
    activeReplacementsCount,
    nextShift,
    isFetchingUserReplacements,
    isFetchingReplacements,
    errorUserReplacements,
    errorReplacements,
    onRetryUserReplacements,
    onRetryReplacements,
    availableReplacements,
    homeTab,
    setHomeTab,
    onNavigate,
    onTakeReplacement,
    parseDate,
    monthsList,
    serviceName = 'General'
}) => {
    return (
        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto flex flex-col gap-6 md:gap-8">
            <div className="mt-2 animate-in slide-in-from-bottom-2 duration-700">
                <h1 className="text-2xl md:text-3xl text-gray-900 font-bold tracking-tight flex items-center gap-2">
                    Hola, {firstName} <span className="animate-wave">👋</span>
                </h1>
                <p className="text-gray-500 text-sm md:text-base mt-1">Tu panel de control médico.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        {/* Ausencias Card */}
                        <button
                            onClick={() => onNavigate('absences')}
                            className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-start justify-between gap-3 md:gap-4 hover:border-red-200 transition-all active:scale-[0.98] group relative overflow-hidden min-h-[150px] md:min-h-[180px]"
                        >
                            <div className="w-full flex justify-between items-start">
                                <div className={`p-2.5 md:p-3 rounded-xl transition-colors ${pendingAbsencesCount > 0 ? 'bg-[#FFE4E6] text-[#E11D48]' : 'bg-gray-50 text-gray-400'}`}>
                                    <CalendarOff size={22} strokeWidth={2} className="md:w-7 md:h-7" />
                                </div>
                            </div>
                            <div className="text-left w-full">
                                <span className={`block font-bold text-2xl md:text-4xl mb-0.5 md:mb-1 ${totalAbsencesCount > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {totalAbsencesCount}
                                </span>
                                <span className="block font-medium text-gray-900 text-sm md:text-base">Ausencias</span>
                                <span className={`${pendingAbsencesCount > 0 ? 'text-red-500 font-bold' : 'text-gray-500'} text-[11px] md:text-sm`}>
                                    {pendingAbsencesCount} {pendingAbsencesCount === 1 ? 'pendiente' : 'pendientes'}
                                </span>
                            </div>
                        </button>

                        {/* Reemplazos Card */}
                        <button
                            onClick={() => onNavigate('replacements')}
                            className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-start justify-between gap-3 md:gap-4 hover:border-[#135D54] transition-all active:scale-[0.98] group min-h-[150px] md:min-h-[180px]"
                        >
                            <div className="w-full flex justify-between items-start">
                                <div className="bg-[#EAF4F4] p-2.5 md:p-3 rounded-xl text-[#135D54] group-hover:bg-[#D5EAEA] transition-colors">
                                    <History size={22} strokeWidth={2} className="md:w-7 md:h-7" />
                                </div>
                            </div>
                            <div className="text-left w-full">
                                <span className="block font-bold text-2xl md:text-4xl mb-0.5 md:mb-1 text-[#135D54]">{activeReplacementsCount}</span>
                                <span className="block font-medium text-gray-900 text-sm md:text-base">Reemplazos</span>
                                <span className="text-[11px] text-gray-500 md:text-sm">Guardias asignadas</span>
                            </div>
                        </button>
                    </div>

                    {/* Proximo Compromiso Card */}
                    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4 md:mb-6">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <CalendarCheck size={20} className="text-[#135D54]" /> Próximo Compromiso
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Tu agenda más inmediata.</p>
                            </div>
                            <button
                                onClick={() => onNavigate('replacements')}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 hover:text-gray-900 h-9 px-3 text-[#135D54] hover:bg-[#135D54]/10 gap-1"
                            >
                                <span className="hidden sm:inline">Ver todo</span> <ArrowRight size={16} />
                            </button>
                        </div>

                        {isFetchingUserReplacements ? (
                            <div className="flex items-center justify-center py-10 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-6 h-6 text-[#135D54] animate-spin" />
                                    <span className="text-xs text-gray-400 font-medium">Actualizando...</span>
                                </span>
                            </div>
                        ) : errorUserReplacements ? (
                            <div className="py-6">
                                <ErrorMessage
                                    message="No pudimos cargar tus compromisos."
                                    onRetry={onRetryUserReplacements || (() => { })}
                                    className="bg-transparent border-none p-0 scale-90"
                                />
                            </div>
                        ) : nextShift ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center bg-white border border-gray-200 rounded-lg w-full sm:w-16 h-auto sm:h-16 py-2 sm:py-0 px-4 sm:px-0 shadow-sm shrink-0">
                                    <div className="flex items-center gap-2 sm:block sm:text-center">
                                        <span className="text-xs text-gray-500 font-bold uppercase sm:block">
                                            {monthsList[parseDate(nextShift.Fechainicio_R).getMonth()]}
                                        </span>
                                        <span className="text-xl font-bold text-gray-900 sm:block">
                                            {nextShift.Fechainicio_R.split('/')[0]}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Horario</p>
                                        <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                            <Clock size={16} className="text-[#135D54]" /> {nextShift.Franja_R}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Ubicación</p>
                                        <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                            <MapPin size={16} className="text-[#135D54]" /> <span className="truncate max-w-[200px]">{nextShift.SectorA_R}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <span className="bg-green-100 text-green-700 border border-green-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        <Calendar size={12} className="text-green-600" /> Confirmado
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Calendar size={32} className="text-gray-300 mb-2" />
                                <p className="text-gray-500 font-medium text-sm">No tienes guardias próximas</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar for Available Replacements */}
                <div className="lg:col-span-1 h-full">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full min-h-[500px]">
                        <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
                            <div className="flex items-center gap-2.5">
                                <RefreshCw size={14} className="text-[#135D54]" />
                                <h3 className="font-bold text-gray-900 text-[15px]">Reemplazos disponibles</h3>
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-lg w-full">
                                {(['Hoy', 'Mañana', 'Todos'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setHomeTab(tab)}
                                        className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 text-center ${homeTab === tab
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-gray-50/30 p-4">
                            {isFetchingReplacements ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="w-6 h-6 border-4 border-[#135D54] border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-gray-500 text-xs">Buscando...</span>
                                </div>
                            ) : errorReplacements ? (
                                <div className="py-12 px-2">
                                    <ErrorMessage
                                        message="Error al buscar reemplazos."
                                        onRetry={onRetryReplacements || (() => { })}
                                        className="bg-transparent border-none p-0 scale-90"
                                    />
                                </div>
                            ) : availableReplacements.length > 0 ? (
                                <div className="space-y-4">
                                    {availableReplacements.map((item, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-[#135D54]/5 text-[#135D54] p-2 rounded-lg border border-[#135D54]/10">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{item.FechaInicio_AS}</p>
                                                        <p className="text-xs text-gray-400 font-medium">Inicia guardia</p>
                                                    </div>
                                                </div>
                                                <div className="bg-[#EAF4F4] text-[#135D54] px-2 py-1 rounded-md text-[10px] font-bold">
                                                    {item.Franja_AS}
                                                </div>
                                            </div>
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <UserIcon size={14} className="text-gray-400" />
                                                    <span className="font-semibold">{item.User_AS}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <Stethoscope size={14} className="text-gray-400" />
                                                    <span>{item.Sector_AS}</span>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => onTakeReplacement(item)}
                                                className="w-full h-9 text-xs font-bold rounded-lg shadow-none border-[#135D54]/10 bg-[#135D54] hover:bg-[#0e453e]"
                                            >
                                                Tomar reemplazo
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 py-12 px-6 flex flex-col items-center text-center justify-center">
                                    <div className="w-20 h-20 rounded-full border-[4px] border-[#135D54]/5 flex items-center justify-center mb-6">
                                        <HelpCircle size={32} className="text-gray-300" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">Sin reemplazos disponibles</h4>
                                    <p className="text-gray-400 text-xs leading-relaxed max-w-[180px] mx-auto">
                                        No hay ofertas para {homeTab.toLowerCase()} en {serviceName}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
