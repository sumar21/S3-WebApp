
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Search, Eye, Clock, MapPin, User, Stethoscope, Calendar as CalendarIcon, X, Loader2, RotateCw, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Loader } from './ui/Loader';

const CALENDAR_DATA_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a0fc56ef0ddf40d8bc096823e4e95b57/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=xpDba1_sC5XVnpmYbEBZ_tSOxzLaj2tAJk2G94zEFYM';
const AVAILABILITY_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/95f0fec7dd2147ccadf09efd108ea9b7/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=UCFcUulxgtcS_-jdRzV7Ji5Cjtpr_yXuYDL_W4a6k5A';

interface AbsenceEvent {
  ID: number;
  User_AS: string;
  Sector_AS: string;
  FechaInicio_AS: string;
  Franja_AS: string;
  Status_AS: 'Tomado' | 'Pendiente' | 'Cancelado';
  Motivo_AS: string;
  CorreoAusenceia_AS?: string;
}

interface AvailabilityUser {
  ID: number;
  Nombre_US: string;
  Apellido_US: string;
  ConcatName_US: string;
  TipoM_US: string;
  Correo_US: string;
  Servicio_US: string;
  Status_US: string;
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

export const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<AbsenceEvent[]>([]);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingAvailability, setIsFetchingAvailability] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  
  const now = new Date();
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const [currentMonth, setCurrentMonth] = useState(months[now.getMonth()]);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  
  // State for Modals
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [selectedDayForList, setSelectedDayForList] = useState<number | null>(null);

  const startYear = 2024;
  const years = Array.from({ length: 5 }, (_, i) => startYear + i);

  // Derived state for counters
  const stats = useMemo(() => {
    return {
      pending: events.filter(e => e.Status_AS === 'Pendiente').length,
      taken: events.filter(e => e.Status_AS === 'Tomado').length,
      cancelled: events.filter(e => e.Status_AS === 'Cancelado').length
    };
  }, [events]);

  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    const monthIdx = months.indexOf(currentMonth) + 1;
    const mesInicio = `${monthIdx.toString().padStart(2, '0')}/${currentYear}`;

    try {
      const response = await fetch(CALENDAR_DATA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Mesinicio: mesInicio }),
      });
      const result = await response.json();
      if (result && result.data && Array.isArray(result.data)) {
        setEvents(result.data);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, currentYear]);

  const fetchAvailability = async () => {
    setIsFetchingAvailability(true);
    setShowAvailability(true);
    try {
      const response = await fetch(AVAILABILITY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (result && result.data && Array.isArray(result.data)) {
        setAvailabilityData(result.data);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setIsFetchingAvailability(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const monthIndex = months.indexOf(currentMonth);
  const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
  const startDayOfWeek = new Date(currentYear, monthIndex, 1).getDay();
  const emptySlots = Array.from({ length: startDayOfWeek });
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Calculate rows for grid optimization
  const totalSlots = startDayOfWeek + daysInMonth;
  const numRows = Math.ceil(totalSlots / 7);

  const parseDateFromAPI = (dateStr: string): Date => {
    if (!dateStr) return new Date(0);
    const [d, m, y] = dateStr.split('/').map(Number);
    return new Date(y, m - 1, d);
  };

  const getDayEvents = (day: number): EventDetails[] => {
    const dayStr = day.toString().padStart(2, '0');
    const monthStr = (monthIndex + 1).toString().padStart(2, '0');
    const targetDate = `${dayStr}/${monthStr}/${currentYear}`;
    const today = new Date();
    today.setHours(0,0,0,0);

    return events
      .filter(e => e.FechaInicio_AS === targetDate)
      .map(e => {
        let status: 'taken' | 'pending' | 'cancelled' | 'expired' = 'pending';
        const itemDate = parseDateFromAPI(e.FechaInicio_AS);

        if (e.Status_AS === 'Tomado') status = 'taken';
        else if (e.Status_AS === 'Cancelado') status = 'cancelled';
        else if (e.Status_AS === 'Pendiente' && itemDate < today) status = 'expired';

        const times = e.Franja_AS.split(' - ');

        return {
          id: String(e.ID),
          day,
          type: 'Guardia', 
          startTime: times[0] || '--:--',
          endTime: times[1] || '--:--',
          doctorName: e.User_AS,
          clinicName: e.Sector_AS,
          clinicAddress: 'Ubicación registrada',
          status,
          originalData: e
        };
      });
  };

  const getDayName = (day: number) => {
    const date = new Date(currentYear, monthIndex, day);
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  };

  const countAbsencesForDoctor = (doctorName: string) => {
    return events.filter(e => e.User_AS === doctorName).length;
  };

  const filteredAvailability = useMemo(() => {
    if (!doctorSearch) return availabilityData;
    const searchLower = doctorSearch.toLowerCase();
    return availabilityData.filter(d => 
      d.ConcatName_US.toLowerCase().includes(searchLower) ||
      d.Correo_US.toLowerCase().includes(searchLower)
    );
  }, [availabilityData, doctorSearch]);

  const getStatusStyles = (status: string) => {
    switch(status) {
        case 'taken': return {
            bg: 'bg-[#135D54]/10',
            border: 'border-[#135D54]',
            text: 'text-[#135D54]',
            indicator: 'bg-[#135D54]',
            label: 'Tomado'
        };
        case 'pending': return {
            bg: 'bg-yellow-50',
            border: 'border-yellow-400',
            text: 'text-yellow-700',
            indicator: 'bg-yellow-400',
            label: 'Pendiente'
        };
        case 'cancelled': return {
            bg: 'bg-red-50',
            border: 'border-red-400',
            text: 'text-red-700',
            indicator: 'bg-red-400',
            label: 'Cancelado'
        };
        case 'expired': return {
            bg: 'bg-gray-100',
            border: 'border-gray-300',
            text: 'text-gray-500',
            indicator: 'bg-gray-300',
            label: 'Vencida'
        };
        default: return { bg: '', border: '', text: '', indicator: '', label: '' };
    }
  };

  const renderEventCard = (event: EventDetails, isCompact: boolean = false) => {
    const styles = getStatusStyles(event.status);
    return (
       <button 
          key={event.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvent(event);
            setSelectedDayForList(null); 
          }}
          className={`
            w-full text-left
            ${styles.bg} border-l-[3px] ${styles.border} 
            ${isCompact ? 'p-1.5' : 'p-3'} rounded-r-md 
            transition-all duration-200 
            hover:scale-[1.01] hover:shadow-sm cursor-pointer
            group relative
          `}
       >
          <div className="flex items-center gap-1.5 mb-1">
              <div className={`h-1.5 w-1.5 rounded-full ${styles.indicator}`}></div>
              <span className={`text-[9px] font-bold ${styles.text} uppercase tracking-wider`}>{styles.label}</span>
              {!isCompact && <ChevronRight size={14} className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </div>
          
          <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-gray-700">
                  <Clock size={10} className="shrink-0 text-gray-400" />
                  <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-semibold ${event.status === 'expired' ? 'text-gray-400' : ''}`}>{event.startTime} - {event.endTime}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                  <User size={10} className="shrink-0 text-gray-400" />
                  <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} truncate font-medium ${event.status === 'expired' ? 'text-gray-400' : ''}`}>{event.doctorName}</span>
              </div>
              {!isCompact && (
                  <div className="flex items-center gap-1 text-gray-500 pt-1 border-t border-black/5 mt-1">
                      <Stethoscope size={10} className="shrink-0 text-gray-400" />
                      <span className="text-[10px] uppercase font-bold tracking-tight">{event.clinicName}</span>
                  </div>
              )}
          </div>
       </button>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] p-2 md:p-6 w-full font-sans overflow-hidden">
      
      {/* --- DESKTOP HEADER --- */}
      <div className="hidden md:flex flex-row items-center justify-between gap-4 mb-6 shrink-0">
         <div className="flex items-baseline gap-3">
             <h1 className="text-4xl font-bold tracking-tight text-gray-900 capitalize">{currentMonth}</h1>
             <span className="text-4xl text-gray-300 font-light">{currentYear}</span>
         </div>
         <div className="flex items-center gap-4">
             <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0"></div>
                  <span className="text-xs font-medium text-gray-600">Pendientes ({stats.pending})</span>
                </div>
                <div className="w-px h-4 bg-gray-200 shrink-0"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#135D54] shrink-0"></div>
                  <span className="text-xs font-medium text-gray-600">Tomados ({stats.taken})</span>
                </div>
                <div className="w-px h-4 bg-gray-200 shrink-0"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0"></div>
                  <span className="text-xs font-medium text-gray-600">Cancelados ({stats.cancelled})</span>
                </div>
             </div>
             <div className="flex items-center gap-2">
                 <Button onClick={fetchAvailability} className="gap-2 bg-[#135D54] hover:bg-[#0e453e] text-white shadow-sm h-11 px-6 rounded-lg text-sm font-medium">
                    <Eye size={18} /> Ver disponibilidad
                 </Button>
                 <div className="relative">
                    <button 
                      onClick={() => setIsMonthOpen(!isMonthOpen)}
                      className="h-11 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg flex items-center gap-3 hover:bg-gray-50 transition-all text-sm font-medium min-w-[140px] justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                          <CalendarIcon size={18} className="text-gray-400"/>
                          <span>{currentMonth}</span>
                      </div>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMonthOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsMonthOpen(false)}></div>
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden py-1 max-h-[300px] overflow-y-auto">
                          {months.map((month) => (
                            <button
                              key={month}
                              onClick={() => { setCurrentMonth(month); setIsMonthOpen(false); }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${currentMonth === month ? 'text-[#135D54] font-semibold bg-[#135D54]/5' : 'text-gray-600'}`}
                            >
                              {month}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                 </div>
                 <div className="relative">
                    <button 
                      onClick={() => setIsYearOpen(!isYearOpen)}
                      className="h-11 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-all text-sm font-medium min-w-[100px] justify-between shadow-sm"
                    >
                      {currentYear} 
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isYearOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsYearOpen(false)}></div>
                        <div className="absolute top-full right-0 mt-2 w-28 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                          {years.map((year) => (
                            <button
                              key={year}
                              onClick={() => { setCurrentYear(year); setIsYearOpen(false); }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${currentYear === year ? 'text-[#135D54] font-semibold bg-[#135D54]/5' : 'text-gray-600'}`}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                 </div>
                 <button 
                    className="h-11 w-11 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:text-[#135D54] hover:border-[#135D54] hover:bg-gray-50 transition-all" 
                    onClick={() => fetchCalendarData()}
                    title="Actualizar"
                 >
                    <RotateCw size={20} className={isLoading ? 'animate-spin' : ''} />
                 </button>
             </div>
         </div>
      </div>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden flex flex-col gap-4 mb-4 shrink-0">
          <div className="flex items-center justify-between">
             <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 capitalize">{currentMonth}</h1>
                <span className="text-xl text-gray-400 font-light">{currentYear}</span>
             </div>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 flex items-center justify-center" onClick={() => fetchCalendarData()}>
                    <RotateCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </Button>
             </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 overflow-x-auto no-scrollbar">
             <div className="flex items-center gap-1.5 px-1 whitespace-nowrap">
                <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0"></div>
                <span className="text-[10px] font-medium text-gray-600">Pend. ({stats.pending})</span>
             </div>
             <div className="w-px h-3 bg-gray-200 shrink-0"></div>
             <div className="flex items-center gap-1.5 px-1 whitespace-nowrap">
                <div className="w-2 h-2 rounded-full bg-[#135D54] shrink-0"></div>
                <span className="text-[10px] font-medium text-gray-600">Tom. ({stats.taken})</span>
             </div>
             <div className="w-px h-3 bg-gray-200 shrink-0"></div>
             <div className="flex items-center gap-1.5 px-1 whitespace-nowrap">
                <div className="w-2 h-2 rounded-full bg-red-400 shrink-0"></div>
                <span className="text-[10px] font-medium text-gray-600">Canc. ({stats.cancelled})</span>
             </div>
          </div>
          <div className="flex flex-col gap-2 relative">
              <Button onClick={fetchAvailability} className="gap-2 rounded-lg h-10 text-sm shadow-sm bg-[#135D54] w-full" variant="primary">
                 <Eye size={18} /> Ver disponibilidad
              </Button>
              <button 
                onClick={() => setIsMonthOpen(!isMonthOpen)}
                className="h-10 px-3 bg-white border border-gray-200 text-gray-700 rounded-lg flex items-center justify-between gap-2 text-sm font-medium shadow-sm w-full"
              >
                <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-gray-400" />
                    <span>{currentMonth}</span>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {isMonthOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[200px] overflow-y-auto">
                    {months.map((month) => (
                      <button
                        key={month}
                        onClick={() => { setCurrentMonth(month); setIsMonthOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm border-b border-gray-50 last:border-0"
                      >
                        {month}
                      </button>
                    ))}
                  </div>
              )}
          </div>
      </div>

      <div className="flex-1 bg-white md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 relative rounded-xl">
        {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center">
                <Loader text="Actualizando calendario..." />
            </div>
        )}
        <div className="md:hidden flex-1 overflow-y-auto bg-[#F8F9FB] p-3 space-y-3">
            {daysArray.map((day) => {
                const dayEvents = getDayEvents(day);
                const dayName = getDayName(day);
                const isToday = now.getDate() === day && now.getMonth() === monthIndex && now.getFullYear() === currentYear;
                return (
                  <div key={day} className={`flex flex-col rounded-xl border ${dayEvents.length > 0 ? 'bg-white border-gray-200 shadow-sm' : 'bg-transparent border-transparent'}`}>
                     {dayEvents.length > 0 ? (
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xl font-bold ${isToday ? 'text-[#135D54]' : 'text-gray-800'}`}>{day}</span>
                                    <span className="text-xs uppercase font-bold text-gray-400 tracking-wide">{dayName}</span>
                                    {isToday && <span className="bg-[#135D54] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">HOY</span>}
                                </div>
                                <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{dayEvents.length} eventos</span>
                            </div>
                            <div className="space-y-3">
                                {dayEvents.map(event => renderEventCard(event, false))}
                            </div>
                        </div>
                     ) : (
                        <div className="px-4 py-3 flex items-center gap-4 opacity-50">
                             <div className="flex items-center gap-3 min-w-[60px]">
                                <span className="text-sm font-semibold text-gray-500">{day}</span>
                                <span className="text-[10px] uppercase font-bold text-gray-400">{dayName.substring(0,3)}</span>
                             </div>
                             <div className="h-px bg-gray-200 flex-1"></div>
                        </div>
                     )}
                  </div>
                );
            })}
        </div>
        <div className="hidden md:flex flex-col flex-1 h-full min-h-0">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50 shrink-0">
                {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(day => (
                    <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 flex-1 bg-gray-200 gap-px border-l border-gray-200 min-h-0 overflow-y-auto" style={{ gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))` }}>
                {emptySlots.map((_, index) => <div key={`empty-${index}`} className="bg-white/50 p-2 h-full w-full"></div>)}
                {daysArray.map((day) => {
                    const dayEvents = getDayEvents(day);
                    const isToday = now.getDate() === day && now.getMonth() === monthIndex && now.getFullYear() === currentYear;
                    const hasMultiple = dayEvents.length > 1;
                    return (
                    <div key={day} className={`bg-white p-2 relative group flex flex-col h-full w-full min-h-0 transition-colors ${dayEvents.length > 0 ? 'hover:bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                        <div className="flex justify-between items-center mb-1 ml-1 shrink-0">
                            <span className={`text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center ${isToday ? 'bg-[#135D54] text-white shadow-sm' : 'text-gray-500'}`}>{day.toString().padStart(2, '0')}</span>
                            {hasMultiple && (
                                <button onClick={(e) => { e.stopPropagation(); setSelectedDayForList(day); }} className="bg-[#135D54]/10 border border-[#135D54]/20 text-[#135D54] text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center hover:bg-[#135D54]/20 transition-colors cursor-pointer">{dayEvents.length} Coberturas</button>
                            )}
                        </div>
                        <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar min-h-0">
                            {dayEvents.slice(0, 3).map((event) => renderEventCard(event, true))}
                            {dayEvents.length > 3 && (
                                <button onClick={() => setSelectedDayForList(day)} className="w-full text-center text-[10px] font-bold text-gray-400 hover:text-[#135D54] hover:bg-gray-100 py-1 rounded-md transition-colors">+{dayEvents.length - 3} más</button>
                            )}
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* MODAL 1: List for specific day */}
      <Modal isOpen={selectedDayForList !== null} onClose={() => setSelectedDayForList(null)} title={`Coberturas del día ${selectedDayForList} de ${currentMonth}`} width="max-w-5xl">
        {(() => {
           const dayEventsList = selectedDayForList !== null ? getDayEvents(selectedDayForList) : [];
           const dayStats = {
               pending: dayEventsList.filter(e => e.status === 'pending').length,
               taken: dayEventsList.filter(e => e.status === 'taken').length,
               cancelled: dayEventsList.filter(e => e.status === 'cancelled').length,
               expired: dayEventsList.filter(e => e.status === 'expired').length
           };
           return (
            <>
                <div className="p-1 max-h-[60vh] overflow-y-auto">
                    {dayEventsList.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Estado</th>
                                        <th className="px-4 py-3 font-semibold">Horario</th>
                                        <th className="px-4 py-3 font-semibold">Médico</th>
                                        <th className="px-4 py-3 font-semibold">Lugar / Servicio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {dayEventsList.map((event) => {
                                        const styles = getStatusStyles(event.status);
                                        return (
                                            <tr key={event.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => { setSelectedEvent(event); setSelectedDayForList(null); }}>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${styles.bg} ${styles.text} ${styles.border}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${styles.indicator}`}></div>
                                                        {styles.label}
                                                     </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-gray-600 font-mono text-xs bg-gray-50 w-fit px-2 py-1 rounded">
                                                        <Clock size={12} className="text-gray-400" />
                                                        {event.startTime} - {event.endTime}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">{event.doctorName}</div>
                                                </td>
                                                 <td className="px-4 py-3 text-gray-600">
                                                    <div className="flex items-center gap-1.5"><Stethoscope size={14} className="text-gray-400" />{event.clinicName}</div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </div>
                <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                     <Button variant="outline" onClick={() => setSelectedDayForList(null)}>Cerrar ventana</Button>
                </div>
            </>
           );
        })()}
      </Modal>

      {/* MODAL 2: Availability */}
      <Modal isOpen={showAvailability} onClose={() => setShowAvailability(false)} title="Médicos Disponibles" width="max-w-4xl">
        <div className="space-y-4">
           <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 gap-3">
             <div className="flex gap-4 items-center w-full sm:w-auto font-semibold text-gray-800">{currentMonth} / {currentYear}</div>
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <Input className="pl-9 h-10" placeholder="Buscar por nombre..." value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)} />
             </div>
           </div>
           <div className="h-[400px] overflow-y-auto rounded-md border border-gray-100 relative bg-white">
             {isFetchingAvailability && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px]"><Loader2 className="w-10 h-10 text-[#135D54] animate-spin" /><p className="text-xs font-semibold text-gray-500">Actualizando lista...</p></div>}
             <table className="w-full">
               <thead className="bg-gray-50 text-left sticky top-0 z-10">
                 <tr>
                   <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Tipo</th>
                   <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Nombre y Apellido</th>
                   <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Correo</th>
                   <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right bg-gray-50">Turnos</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filteredAvailability.map((doctor) => (
                  <tr key={doctor.ID} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${doctor.TipoM_US === 'Fijo' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{doctor.TipoM_US === 'Fijo' ? 'HC FIJO' : 'SUPLENTE'}</span></td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{doctor.ConcatName_US}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{doctor.Correo_US}</td>
                      <td className="py-3 px-4 text-right"><div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${countAbsencesForDoctor(doctor.ConcatName_US) > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>{countAbsencesForDoctor(doctor.ConcatName_US)}</div></td>
                  </tr>
                 ))}
               </tbody>
             </table>
           </div>
           <div className="flex justify-end pt-4 border-t border-gray-100"><Button variant="outline" onClick={() => setShowAvailability(false)} className="h-12 text-base font-semibold border-gray-200">Cerrar ventana</Button></div>
        </div>
      </Modal>

      {/* MODAL 3: Detailed Event View */}
      {selectedEvent && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className={`h-24 relative overflow-hidden ${
                    selectedEvent.status === 'taken' ? 'bg-[#135D54]' : 
                    selectedEvent.status === 'pending' ? 'bg-yellow-400' : 
                    selectedEvent.status === 'expired' ? 'bg-gray-400' : 'bg-red-500'
                }`}>
                    <div className="absolute inset-0 bg-white/10 opacity-30"></div>
                    <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 text-white rounded-full p-1.5 transition-colors"><X size={20} /></button>
                    <div className="absolute bottom-4 left-6 text-white">
                         <div className="flex items-center gap-2 mb-1 opacity-90 text-[10px] font-bold uppercase"><CalendarIcon size={12} /> {selectedEvent.originalData.FechaInicio_AS}</div>
                         <h2 className="text-2xl font-bold tracking-tight">
                            {selectedEvent.status === 'taken' ? 'Turno Confirmado' : 
                             selectedEvent.status === 'pending' ? 'Turno Pendiente' : 
                             selectedEvent.status === 'expired' ? 'Turno Vencido' : 'Turno Cancelado'}
                         </h2>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600"><Clock size={20} /></div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Horario</p>
                                <p className="text-sm text-gray-900 font-semibold">{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                             <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Estado</p>
                                <p className="text-sm text-gray-900 font-semibold">{selectedEvent.status === 'expired' ? 'Vencida' : selectedEvent.originalData.Status_AS}</p>
                            </div>
                             <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600"><Stethoscope size={20} /></div>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#135D54]/10 text-[#135D54] flex items-center justify-center font-bold">{selectedEvent.doctorName?.charAt(0)}</div>
                            <div><h4 className="font-bold text-gray-900">{selectedEvent.doctorName}</h4><p className="text-xs text-gray-500">Profesional Asignado</p></div>
                        </div>
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Motivo / Notas</p><p className="text-xs text-gray-700 leading-relaxed italic">"{selectedEvent.originalData.Motivo_AS || 'Sin observaciones'}"</p></div>
                    </div>
                    <div className="mb-6 flex items-start gap-3"><MapPin size={20} className="text-gray-400 mt-1" /><div><h4 className="font-bold text-gray-900 text-sm">{selectedEvent.clinicName}</h4><p className="text-xs text-gray-500">Área Hospitalaria</p></div></div>
                    <div className="flex pt-2 gap-2"><Button variant="outline" className="flex-1 h-12 text-base font-semibold border-gray-200" onClick={() => setSelectedEvent(null)}>Cerrar</Button></div>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};
