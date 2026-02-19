
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Loader2, CalendarOff, ChevronDown, CalendarDays, ArrowLeft, Menu, RotateCw, LogOut, History, AlertCircle, CheckCircle2, User, Stethoscope, Trash2, XCircle, Filter, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Loader } from './ui/Loader';
import { AuthUser } from '../types';

interface AbsencesViewProps {
  user: AuthUser;
  onBack?: () => void;
  onLogout?: () => void;
  onRefresh?: () => void;
}

type AbsencesTab = 'cargar' | 'historial';

const USER_ABSENCES_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/36130727a08047e2ad9740af44f3edbe/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iK0lOR8lNBO_-56qfkRbGGAXxAJpfZu9i-OqC6nrE4k';
const REPORT_ABSENCE_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3c464c8148ea4b9f93b52ddf029e0e14/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Gjb5-3rYrjwxYGhTe3ojv-6zLkoz2iH6CBJaj9KPVj4';
const CANCEL_ABSENCE_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/de1cdd9cc33c491ea6e251b22d11b3d1/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=TzVub5btVOZFNYU5hsf7bK6vrWew0u7lU7IqhP6FgrQ'; 
const APP_VERSION = '1.2.0';

export const AbsencesView: React.FC<AbsencesViewProps> = ({ user, onBack, onLogout, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<AbsencesTab>('cargar');
  const [userAbsences, setUserAbsences] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  
  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Cancel Modal State
  const [absenceToCancel, setAbsenceToCancel] = useState<any | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Helper to get today string YYYY-MM-DD
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: ''
  });
  
  const [form, setForm] = useState({
    dateFrom: '',
    timeRange: '20:00 - 08:00',
    reason: ''
  });

  // --- Utility Functions ---

  const parseDateFromAPI = (dateStr: string): Date => {
    // Expected format: DD/MM/YYYY
    if (!dateStr) return new Date(0);
    const [d, m, y] = dateStr.split('/').map(Number);
    return new Date(y, m - 1, d);
  };

  const isWeekend = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
    return day === 5 || day === 6 || day === 0;
  };

  // Logic: When dateFrom changes, update timeRange if it's a weekday
  useEffect(() => {
    if (form.dateFrom && !isWeekend(form.dateFrom)) {
      setForm(prev => ({ ...prev, timeRange: '20:00 - 08:00' }));
    }
  }, [form.dateFrom]);

  const fetchAbsences = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(USER_ABSENCES_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IDuser: String(user.id) }),
      });
      const result = await response.json();
      if (result && result.data && Array.isArray(result.data)) {
        setUserAbsences(result.data);
      } else {
        setUserAbsences([]);
      }
    } catch (error) {
      console.error("Error fetching absences:", error);
      setUserAbsences([]);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'historial') {
      fetchAbsences();
    }
  }, [activeTab]);

  // --- Filter Logic ---
  const filteredAbsences = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return userAbsences.filter(item => {
      const itemDate = parseDateFromAPI(item.FechaInicio_AS);
      
      // 1. Check if specific filters are active
      const hasDateFilter = filters.dateFrom || filters.dateTo;
      const hasStatusFilter = filters.status !== '';
      const isFilterActive = hasDateFilter || hasStatusFilter;

      // 2. Default View (No explicit filters): Show today onwards
      if (!isFilterActive) {
        return itemDate >= today;
      }

      // 3. Active Filters Logic
      let matches = true;

      // Status Filter
      if (hasStatusFilter) {
        // Case insensitive comparison just in case
        if (filters.status.toLowerCase() !== item.Status_AS.toLowerCase()) matches = false;
      }

      // Date Range Filter
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom + 'T00:00:00');
        if (itemDate < fromDate) matches = false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo + 'T00:00:00');
        if (itemDate > toDate) matches = false;
      }

      return matches;
    });
  }, [userAbsences, filters]);

  const clearFilters = () => {
    setFilters({ dateFrom: '', dateTo: '', status: '' });
  };

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.status !== '';

  const getStatusColor = (status: string) => {
    const normalizedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '';
    
    switch (normalizedStatus) {
      case 'Tomado':
      case 'Tomada':
        return 'bg-[#EAFBF0] text-[#10B981] border-[#D1FAE5]';
      case 'Pendiente':
        return 'bg-[#FFF7ED] text-[#F59E0B] border-[#FFEDD5]';
      case 'Vencida':
      case 'Vencido':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'Cancelado':
      case 'Cancelada':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleConfirmReport = async () => {
    setIsSubmitting(true);
    
    try {
      const now = new Date();
      const [year, month, day] = form.dateFrom.split('-');
      const formattedDateFrom = `${day}/${month}/${year}`;
      const mesAnoSelected = `${month}/${year}`;
      
      const startTime = form.timeRange.split(' - ')[0];
      const endTime = form.timeRange.split(' - ')[1];
      
      const mesActual = (now.getMonth() + 1).toString().padStart(2, '0');
      const anoActual = now.getFullYear();
      const diaActual = now.getDate().toString().padStart(2, '0');
      const horaActual = now.getHours().toString().padStart(2, '0');
      const minActual = now.getMinutes().toString().padStart(2, '0');
      const secActual = now.getSeconds().toString().padStart(2, '0');

      const uniqueIdSuffix = `${diaActual}${mesActual}${anoActual}${horaActual}${minActual}${secActual}`;
      const namePrefix = (user.name || 'USR').substring(0, 3).toUpperCase();
      const idUnico = `(AUS)-${namePrefix}-${uniqueIdSuffix}`;

      const payload = {
        FechaInicio_AS: formattedDateFrom,
        FechaFinal_AS: formattedDateFrom,
        HoraInicio_AS: startTime,
        HoraFinal_AS: startTime, // Following prompt request for start hour in both fields
        Motivo_AS: form.reason,
        Sector_AS: user.service || 'General',
        Usuario_AS: user.name,
        IDUserABM_AS: Number(user.id),
        Servicio_AS: user.service || 'General',
        MesAno_AS: `${mesActual}/${anoActual}`,
        Fecha_AS: `${diaActual}/${mesActual}/${anoActual}`,
        Hora_AS: `${horaActual}:${minActual}`,
        MesAnoInicio_AS: mesAnoSelected,
        MesAnoFinal_AS: mesAnoSelected,
        IDUnicoAusencia_AS: idUnico,
        Franja_AS: form.timeRange,
        FechaInicioC_AS: `${formattedDateFrom} ${startTime}`,
        CorreoAusencia_AS: user.email || '',
        VersionApp_AS: APP_VERSION
      };

      const response = await fetch(REPORT_ABSENCE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Wait 1.5s to ensure backend processing before showing success and allowing navigation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        // Clean form
        setForm({
            dateFrom: '',
            timeRange: '20:00 - 08:00',
            reason: ''
        });
        fetchAbsences();
      } else {
        alert("Error al reportar la ausencia. Intente nuevamente.");
      }
    } catch (error) {
      console.error("Error submitting absence:", error);
      alert("Error de conexión. Verifique su internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = (absence: any) => {
    setAbsenceToCancel(absence);
  };

  const confirmCancelAbsence = async () => {
    if (!absenceToCancel) return;
    setIsCancelling(true);

    try {
        const response = await fetch(CANCEL_ABSENCE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ID: Number(absenceToCancel.ID)
            }),
        });

        if (response.ok) {
            // Refrescar lista después de cancelar
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAbsenceToCancel(null);
            fetchAbsences(); 
        } else {
            alert("No se pudo cancelar la ausencia. Intente nuevamente.");
        }
    } catch (error) {
        console.error("Error cancelling absence:", error);
        alert("Error de conexión.");
    } finally {
        setIsCancelling(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    if (onBack) onBack();
  };

  const isFormValid = form.dateFrom && form.reason.trim().length > 0;

  // Global today for expired checks
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] overflow-hidden w-full font-sans">
      {/* Unified Top Navigation Bar */}
      <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20 w-full border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-4">
             <div className="bg-[#135D54]/10 rounded-xl p-2 animate-in fade-in zoom-in duration-500">
                <img src="https://placehold.co/24x24/135D54/ffffff?text=S3" alt="Logo" className="w-6 h-6 object-contain" />
             </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => { if(onRefresh) onRefresh(); else fetchAbsences(); }} 
                className="p-2 text-gray-400 hover:text-[#135D54] hover:bg-[#135D54]/10 rounded-full transition-colors active:scale-95"
                title="Actualizar datos"
            >
                <RotateCw size={20} className={isFetching ? "animate-spin" : ""} />
            </button>
            <button 
                onClick={() => setShowLogoutModal(true)} 
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors active:scale-95"
                title="Cerrar sesión"
            >
                <LogOut size={20} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="p-4 md:p-8 w-full max-w-5xl mx-auto flex flex-col min-h-full">
          
          {/* Page Header (Content Area) */}
          <div className="flex items-center gap-4 mb-6">
            {onBack && (
                <button onClick={onBack} className="text-[#135D54] hover:bg-gray-100 p-2 rounded-full transition-colors">
                  <ArrowLeft size={24} />
                </button>
            )}
            <div className="flex flex-col">
                 <h1 className="text-2xl font-bold text-gray-800">Mis ausencias</h1>
                 <p className="text-xs text-gray-400 font-medium uppercase tracking-wider hidden sm:block">Gestión de inasistencias</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="bg-white p-1 rounded-2xl flex mb-8 border border-gray-200 shadow-sm self-center w-full max-w-md">
            <button 
              onClick={() => setActiveTab('cargar')}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'cargar' 
                ? 'bg-[#135D54] text-white shadow-md' 
                : 'text-gray-400 hover:text-[#135D54]/70'
              }`}
            >
              <CalendarDays size={16} />
              Cargar ausencia
            </button>
            <button 
              onClick={() => setActiveTab('historial')}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'historial' 
                ? 'bg-[#135D54] text-white shadow-md' 
                : 'text-gray-400 hover:text-[#135D54]/70'
              }`}
            >
              <History size={16} />
              Tus ausencias
            </button>
          </div>

          {activeTab === 'cargar' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col flex-1 max-w-3xl mx-auto w-full">
              <div className="bg-white rounded-[24px] p-6 md:p-10 border border-gray-200 shadow-sm space-y-8 flex-1">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#135D54]">Reportar nueva inasistencia</h2>
                  <p className="text-sm text-gray-500">Selecciona el día de tu guardia para notificar la ausencia.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#135D54]/60 uppercase tracking-widest ml-1">Fecha desde</label>
                    <div className="relative group">
                      <input 
                        type="date" 
                        style={{ colorScheme: 'light' }}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl h-14 px-4 text-sm text-[#135D54] focus:outline-none focus:ring-2 focus:ring-[#135D54]/20 appearance-none transition-all group-hover:border-[#135D54]/40"
                        value={form.dateFrom}
                        onChange={(e) => setForm({...form, dateFrom: e.target.value})}
                      />
                      <Calendar className="absolute right-4 top-4 text-[#135D54]/40 pointer-events-none" size={20} />
                    </div>
                  </div>
                  <div className="space-y-2 opacity-60">
                    <label className="text-xs font-bold text-[#135D54]/60 uppercase tracking-widest ml-1">Fecha hasta</label>
                    <div className="relative group">
                      <input 
                        type="date" 
                        disabled
                        style={{ colorScheme: 'light' }}
                        className="w-full bg-gray-100 border border-gray-200 rounded-2xl h-14 px-4 text-sm text-[#135D54]/50 cursor-not-allowed appearance-none"
                        value={form.dateFrom} // Automatically mirrors dateFrom
                      />
                      <Calendar className="absolute right-4 top-4 text-[#135D54]/20 pointer-events-none" size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#135D54]/60 uppercase tracking-widest ml-1">Franja horaria</label>
                  <div className={`relative group ${!form.dateFrom || !isWeekend(form.dateFrom) ? 'opacity-60' : ''}`}>
                    <select 
                      disabled={!form.dateFrom || !isWeekend(form.dateFrom)}
                      className={`w-full bg-gray-50/50 border border-gray-200 rounded-2xl h-14 px-4 text-sm text-[#135D54] appearance-none focus:outline-none focus:ring-2 focus:ring-[#135D54]/20 transition-all ${!form.dateFrom || !isWeekend(form.dateFrom) ? 'cursor-not-allowed bg-gray-100' : 'group-hover:border-[#135D54]/40 cursor-pointer'}`}
                      value={form.timeRange}
                      onChange={(e) => setForm({...form, timeRange: e.target.value})}
                    >
                      <option value="20:00 - 08:00">20:00 - 08:00 (Noche)</option>
                      {isWeekend(form.dateFrom) && (
                        <option value="08:00 - 20:00">08:00 - 20:00 (Día)</option>
                      )}
                    </select>
                    <Clock className="absolute right-4 top-4 text-[#135D54]/40 pointer-events-none" size={20} />
                  </div>
                  {!isWeekend(form.dateFrom) && form.dateFrom && (
                    <p className="text-[10px] text-gray-400 mt-1 ml-1 flex items-center gap-1">
                      <AlertCircle size={10} /> La franja diurna solo está disponible los fines de semana.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#135D54]/60 uppercase tracking-widest ml-1">Motivo de la ausencia</label>
                  <textarea 
                    placeholder="Escribir"
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-4 text-sm text-[#135D54] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#135D54]/20 min-h-[160px] resize-none transition-all group-hover:border-[#135D54]/40"
                    value={form.reason}
                    onChange={(e) => setForm({...form, reason: e.target.value})}
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    disabled={!isFormValid}
                    className="w-full bg-[#135D54] hover:bg-[#0e453e] text-white font-bold h-14 rounded-2xl text-base shadow-lg shadow-[#135D54]/10 transition-all active:scale-[0.98] border-none disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400"
                    onClick={() => setShowConfirmModal(true)}
                  >
                    Confirmar y Reportar Ausencia
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 flex-1">
              {/* Header and Filter Controls */}
              <div className="flex flex-col gap-4 mb-2">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-800">Historial</h2>
                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{filteredAbsences.length}</span>
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
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Desde</label>
                                <input 
                                    type="date" 
                                    style={{ colorScheme: 'light' }}
                                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D54]/20 bg-white text-gray-900"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Hasta</label>
                                <input 
                                    type="date" 
                                    style={{ colorScheme: 'light' }}
                                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D54]/20 bg-white text-gray-900"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Estado</label>
                                <div className="relative">
                                    <select 
                                        className={`w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#135D54]/20 appearance-none bg-white ${filters.status === '' ? 'text-gray-500' : 'text-gray-900'}`}
                                        value={filters.status}
                                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                                    >
                                        <option value="">Seleccionar estado</option>
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Tomado">Tomado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            <button 
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className="h-10 px-4 rounded-xl text-xs font-bold border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              
              {isFetching ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                   <Loader size="sm" text="Cargando historial..." />
                </div>
              ) : filteredAbsences.length > 0 ? (
                <>
                    {/* Vista Desktop/Tablet (Tabla) */}
                    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Profesional / Sector</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Horario</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Fecha</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAbsences.map((item) => {
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
                                                    <span className="text-sm font-bold text-[#135D54]">{item.User_AS || user.name}</span>
                                                    <span className="text-xs text-gray-400">{item.Sector_AS || user.service}</span>
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
                                                        onClick={() => handleCancelClick(item)}
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

                    {/* Vista Móvil (Cards) */}
                    <div className="md:hidden grid grid-cols-1 gap-4">
                      {filteredAbsences.map((item) => {
                        const isExpired = item.Status_AS === 'Pendiente' && parseDateFromAPI(item.FechaInicio_AS) < today;
                        const displayStatus = isExpired ? 'Vencida' : item.Status_AS;

                        return (
                          <div key={item.ID} className={`bg-white p-5 rounded-[28px] border ${isExpired ? 'border-gray-100 grayscale-[0.3]' : 'border-gray-200'} shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col`}>
                            <div className="flex items-start justify-between mb-4">
                              <div className="space-y-1">
                                <div className={`text-[10px] font-bold px-3 py-1 rounded-full border w-fit ${getStatusColor(displayStatus)}`}>
                                  {displayStatus}
                                </div>
                                <h4 className={`text-[#135D54] font-bold text-base mt-2 ${isExpired ? 'opacity-70' : ''}`}>{item.User_AS || user.name}</h4>
                                <p className="text-gray-400 text-xs font-medium">{item.Sector_AS || user.service}</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                  <div className="bg-gray-50 p-2 rounded-xl text-gray-400 group-hover:text-[#135D54] transition-colors self-end">
                                      <Calendar size={18} />
                                  </div>
                                  {item.Status_AS === 'Pendiente' && !isExpired && (
                                      <button 
                                          className="bg-red-50 p-2 rounded-xl text-red-500 hover:bg-red-100 transition-colors self-end"
                                          onClick={() => handleCancelClick(item)}
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
          )}
        </div>
      </div>

      {/* Confirmation Report Modal */}
      <Modal 
        isOpen={showConfirmModal} 
        onClose={() => !isSubmitting && setShowConfirmModal(false)}
        title="Confirmar reporte"
        width="max-w-sm"
      >
        <div className="space-y-6 pt-2">
          <div className="bg-[#135D54]/5 p-4 rounded-2xl border border-[#135D54]/10">
            <p className="text-sm text-gray-600 leading-relaxed">
              ¿Estás seguro de que deseas reportar esta ausencia para el día <span className="font-bold text-[#135D54]">{form.dateFrom}</span> en el horario de <span className="font-bold text-[#135D54]">{form.timeRange}</span>?
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl h-12" 
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-[#135D54] hover:bg-[#0e453e] rounded-xl h-12"
              onClick={handleConfirmReport}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Continuar"
              )}
            </Button>
          </div>
        </div>
      </Modal>

       {/* Cancel Absence Modal */}
       <Modal 
        isOpen={!!absenceToCancel} 
        onClose={() => !isCancelling && setAbsenceToCancel(null)}
        title="Cancelar ausencia"
        width="max-w-sm"
      >
        <div className="space-y-6 pt-2">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3">
            <XCircle className="text-red-500 shrink-0" size={24} />
            <p className="text-sm text-gray-700 leading-relaxed">
              ¿Estás seguro de que deseas cancelar la ausencia reportada para el día <span className="font-bold">{absenceToCancel?.FechaInicio_AS}</span>?
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl h-12" 
              onClick={() => setAbsenceToCancel(null)}
              disabled={isCancelling}
            >
              Mantener
            </Button>
            <Button 
              className="flex-1 rounded-xl h-12 bg-red-500 hover:bg-red-600 border-none text-white shadow-sm"
              onClick={confirmCancelAbsence}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Sí, cancelar"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-[#EAFBF0] flex items-center justify-center mb-6 border border-green-100">
                    <CheckCircle2 size={40} className="text-[#10B981]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Ausencia Reportada!</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    Hemos notificado tu ausencia correctamente y se ha actualizado tu historial.
                </p>
                <Button 
                    className="w-full bg-[#135D54] hover:bg-[#0e453e] h-12 text-base shadow-lg" 
                    onClick={handleSuccessClose}
                >
                    Entendido
                </Button>
            </div>
        </div>
      )}

      {/* Logout Modal */}
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Cerrar sesión" width="max-w-[350px]">
         <div className="space-y-6">
           <p className="text-gray-500 text-sm">¿Estas seguro de que deseas cerrar sesión en este dispositivo?</p>
           <div className="flex gap-3">
             <Button variant="outline" className="flex-1 border-gray-200 text-gray-600" onClick={() => setShowLogoutModal(false)}>Cancelar</Button>
             <Button className="flex-1 bg-[#135D54] hover:bg-[#0e453e]" onClick={onLogout}>Confirmar</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};
