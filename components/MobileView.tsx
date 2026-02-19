
import React, { useState, useEffect } from 'react';
import { Calendar, Briefcase, HelpCircle, ChevronLeft, ChevronRight, Clock, CheckCircle2, RotateCw, LogOut, X, CalendarCheck, MoreVertical, Trash2, AlertTriangle, ArrowLeft, CalendarOff, History, RefreshCw, LifeBuoy, MapPin, ArrowRight, Loader2, User as UserIcon, Stethoscope, AlertCircle, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Loader } from './ui/Loader';
import { AuthUser } from '../types';
import { AbsencesView } from './AbsencesView';

interface MobileViewProps {
  user: AuthUser;
  onLogout: () => void;
}

type HomeTab = 'Hoy' | 'Mañana' | 'Todos';
type Screen = 'home' | 'absences' | 'replacements';

const REPLACEMENT_ENDPOINTS: Record<HomeTab, string> = {
  'Hoy': 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/78f7fd04b1cc43309044e0d13fa1e622/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-luarhiEctZ3Av0LHBqO0cqorwpDCDZ6-IYsIoX5CAI',
  'Mañana': 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/8dfa2eae829c4b0ebf9d3d7182d5dd0b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=yw1-b9L_DT2K1idRNBd3y_jMJ_LdGhScC_2ezHH7218',
  'Todos': 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/bd8c7fcb6d1b4eb28e8148cbf09333cf/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=oEB1M6u8ZU2m_R0MI5OAnxx0SGySpz-rOG833Y-HLfY'
};

const TAKE_REPLACEMENT_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ae10c74be1b04ab284dbd05a116d5b83/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ULI0m7hpeerVv61xBQQdaZxTkOMlKtX_zDzEIrAZlic';
const USER_REPLACEMENTS_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/14da4131c76e47cd9d3fc415ec5d5acc/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p7DfTX_Y9vYDEbTqSS3f71BV03IlTFMFljF4k59Lk-Y';
const USER_ABSENCES_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/36130727a08047e2ad9740af44f3edbe/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iK0lOR8lNBO_-56qfkRbGGAXxAJpfZu9i-OqC6nrE4k';
const CANCEL_REPLACEMENT_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5bc519f69a8e45d1aa88f923e17c47e6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=sI04TB25C-oTh1LOWhAJexRyfDz9opBLz62ASIFJgLs';
const APP_VERSION = '1.2.0';

export const MobileView: React.FC<MobileViewProps> = ({ user, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Home States
  const [homeTab, setHomeTab] = useState<HomeTab>('Hoy');
  const [availableReplacements, setAvailableReplacements] = useState<any[]>([]);
  const [userReplacements, setUserReplacements] = useState<any[]>([]);
  const [userAbsences, setUserAbsences] = useState<any[]>([]);
  
  const [isFetchingReplacements, setIsFetchingReplacements] = useState(false);
  const [isFetchingUserReplacements, setIsFetchingUserReplacements] = useState(false);
  const [isFetchingUserAbsences, setIsFetchingUserAbsences] = useState(false);

  // Take Replacement State
  const [replacementToConfirm, setReplacementToConfirm] = useState<any | null>(null);
  const [successTakeModal, setSuccessTakeModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Cancel Replacement State
  const [replacementToCancel, setReplacementToCancel] = useState<any | null>(null);
  const [isCancellingReplacement, setIsCancellingReplacement] = useState(false);

  const monthsList = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

  // --- Utility Functions ---
  const parseDate = (str: string) => {
    if (!str) return new Date(0);
    const [d, m, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d);
  };

  const checkCanCancelReplacement = (dateStr: string, franjaStr: string) => {
    const now = new Date();
    const eventDate = parseDate(dateStr);
    
    // Extraer hora de inicio (ej: "20:00")
    const startTimeStr = franjaStr.split(' - ')[0];
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    eventDate.setHours(hours, minutes, 0, 0);

    const diffMs = eventDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours >= 72;
  };

  const fetchAvailableReplacements = async (tab: HomeTab) => {
    setIsFetchingReplacements(true);
    setAvailableReplacements([]); 
    try {
      const endpoint = REPLACEMENT_ENDPOINTS[tab];
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Servicio_AS: user.service || 'General',
          IDuser: String(user.id)
        }),
      });

      const result = await response.json();
      if (result && result.data && Array.isArray(result.data)) {
        setAvailableReplacements(result.data);
      } else {
        setAvailableReplacements([]);
      }
    } catch (error) {
      console.error(`Error fetching available replacements for ${tab}:`, error);
      setAvailableReplacements([]);
    } finally {
      setIsFetchingReplacements(false);
    }
  };

  const fetchUserReplacements = async () => {
    setIsFetchingUserReplacements(true);
    try {
      const response = await fetch(USER_REPLACEMENTS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IDuser: String(user.id) }),
      });
      const result = await response.json();
      if (result && result.data && Array.isArray(result.data)) {
        setUserReplacements(result.data);
      } else {
        setUserReplacements([]);
      }
    } catch (error) {
      console.error("Error fetching user replacements:", error);
      setUserReplacements([]);
    } finally {
      setIsFetchingUserReplacements(false);
    }
  };

  const fetchUserAbsences = async () => {
    setIsFetchingUserAbsences(true);
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
        console.error("Error fetching user absences:", error);
        setUserAbsences([]);
    } finally {
        setIsFetchingUserAbsences(false);
    }
  };

  // Independent effects for data loading
  useEffect(() => {
    if (currentScreen === 'home') {
      fetchUserReplacements(); // Próximo Compromiso uses this
      fetchUserAbsences();
    }
  }, [currentScreen]);

  useEffect(() => {
    if (currentScreen === 'home') {
      fetchAvailableReplacements(homeTab); // Tabs section uses this
    }
  }, [currentScreen, homeTab]);

  const handleRefresh = () => {
    fetchAvailableReplacements(homeTab);
    fetchUserReplacements();
    fetchUserAbsences();
  };

  const handleTakeReplacementRequest = (item: any) => {
    setReplacementToConfirm(item);
  };

  const confirmTakeReplacement = async () => {
    if (!replacementToConfirm) return;
    
    setLoadingAction(true);
    try {
        const now = new Date();
        const dia = now.getDate().toString().padStart(2, '0');
        const mes = (now.getMonth() + 1).toString().padStart(2, '0');
        const ano = now.getFullYear();
        const hora = now.getHours().toString().padStart(2, '0');
        const min = now.getMinutes().toString().padStart(2, '0');

        const times = replacementToConfirm.Franja_AS.split(' - ');

        const payload = {
            IDUserReemplazo_R: String(user.id),
            UsuarioReemplazo_R: user.name,
            IDUnicoAusencia_R: replacementToConfirm.IDUnicoAusencia_AS || '',
            IDuserAusente_R: String(replacementToConfirm.IDUser_AS || ''),
            UsuarioAusente_R: replacementToConfirm.User_AS,
            Fechainicio_R: replacementToConfirm.FechaInicio_AS,
            FechaFinal_R: replacementToConfirm.FechaInicio_AS,
            HoraInicio_R: times[0] || '',
            HoraFinal_R: times[1] || '',
            MotivoAusente_R: replacementToConfirm.Motivo_AS || '',
            Servicio_R: replacementToConfirm.Servicio_AS || '',
            SectorA_R: replacementToConfirm.Sector_AS || '',
            Fecha_R: `${dia}/${mes}/${ano}`,
            Hora_R: `${hora}:${min}`,
            MesAno_R: `${mes}/${ano}`,
            VersionApp_R: APP_VERSION,
            MesAnoInicio_R: replacementToConfirm.MesAnoInicio_AS || '',
            MesAnoFinal_R: replacementToConfirm.MesAnoFinal_AS || '',
            Franja_R: replacementToConfirm.Franja_AS,
            FechaInicioC_R: replacementToConfirm.FechaInicioC_AS || '',
            CorreoAusencia_R: replacementToConfirm.CorreoAusencia_R || '',
            CorreoReemplazo_R: user.email || '',
            IDAtransfer: Number(replacementToConfirm.ID)
        };

        const response = await fetch(TAKE_REPLACEMENT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            setReplacementToConfirm(null);
            setSuccessTakeModal(true);
            
            // Wait 1.5s before refreshing to allow backend processing
            setTimeout(() => {
                handleRefresh();
            }, 1500);
        } else {
            alert("Hubo un error al procesar el reemplazo. Por favor, intente nuevamente.");
        }
    } catch (error) {
        console.error("Error taking replacement:", error);
        alert("Error de conexión al procesar el reemplazo.");
    } finally {
        setLoadingAction(false);
    }
  };

  const confirmCancelReplacement = async () => {
    if (!replacementToCancel) return;
    setIsCancellingReplacement(true);

    try {
        const response = await fetch(CANCEL_REPLACEMENT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ID: Number(replacementToCancel.ID),
                IDUnicoAusencia_R: String(replacementToCancel.IDUnicoAusencia_R || '')
            }),
        });

        if (response.ok) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setReplacementToCancel(null);
            fetchUserReplacements(); // Actualizar lista (el item ya no aparecerá)
        } else {
            alert("No se pudo cancelar el reemplazo. Intente nuevamente.");
        }
    } catch (error) {
        console.error("Error cancelling replacement:", error);
        alert("Error de conexión.");
    } finally {
        setIsCancellingReplacement(false);
    }
  };

  const handleBack = () => setCurrentScreen('home');

  const TopBar = () => (
     <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 w-full border-b border-gray-100">
        <div className="flex items-center gap-4">
             <div className="bg-[#135D54]/10 rounded-xl p-2 animate-in fade-in zoom-in duration-500">
                <img src="https://placehold.co/24x24/135D54/ffffff?text=S3" alt="Logo" className="w-6 h-6 object-contain" />
             </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleRefresh} 
                className="p-2 text-gray-400 hover:text-[#135D54] hover:bg-[#135D54]/10 rounded-full transition-colors active:scale-95"
                title="Actualizar datos"
            >
                <RotateCw size={20} className={isFetchingReplacements || isFetchingUserReplacements || isFetchingUserAbsences ? "animate-spin" : ""} />
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
  );

  const renderHome = () => {
    const pendingAbsencesCount = userAbsences.length;
    const activeReplacementsCount = userReplacements.length;

    const now = new Date();
    now.setHours(0,0,0,0);
    const futureShifts = userReplacements
        .filter(r => parseDate(r.Fechainicio_R) >= now)
        .sort((a, b) => parseDate(a.Fechainicio_R).getTime() - parseDate(b.Fechainicio_R).getTime());
    const nextShift = futureShifts.length > 0 ? futureShifts[0] : null;

    // Logic to extract First Name correctly if format is "Surname, Name"
    const firstName = user.name.includes(',') 
        ? user.name.split(',')[1].trim() 
        : user.name.split(' ')[0]; // Fallback to first word if no comma

    return (
        <div className="flex flex-col h-full bg-[#F8F9FB] pb-8 overflow-y-auto">
        <style>{`
          @keyframes wave {
            0% { transform: rotate(0.0deg) }
            10% { transform: rotate(14.0deg) }
            20% { transform: rotate(-8.0deg) }
            30% { transform: rotate(14.0deg) }
            40% { transform: rotate(-4.0deg) }
            50% { transform: rotate(10.0deg) }
            60% { transform: rotate(0.0deg) }
            100% { transform: rotate(0.0deg) }
          }
          .animate-wave {
            animation-name: wave;
            animation-duration: 2.5s;
            animation-iteration-count: infinite;
            transform-origin: 70% 70%;
            display: inline-block;
          }
        `}</style>
        <TopBar />
        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto flex flex-col gap-6 md:gap-8">
            <div className="mt-2 animate-in slide-in-from-bottom-2 duration-700">
                <h1 className="text-2xl md:text-3xl text-gray-900 font-bold tracking-tight flex items-center gap-2">
                    Hola, {firstName} <span className="animate-wave">👋</span>
                </h1>
                <p className="text-gray-500 text-sm md:text-base mt-1">Tu panel de control médico.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                        {/* Ausencias Card */}
                        <button onClick={() => setCurrentScreen('absences')} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-start justify-between gap-4 hover:border-red-200 transition-all active:scale-[0.98] group relative overflow-hidden h-[160px] md:h-[180px]">
                            <div className="w-full flex justify-between items-start">
                                <div className={`p-3 rounded-xl transition-colors ${pendingAbsencesCount > 0 ? 'bg-[#FFE4E6] text-[#E11D48]' : 'bg-gray-50 text-gray-400'}`}>
                                    <CalendarOff size={24} strokeWidth={2} className="md:w-7 md:h-7" />
                                </div>
                            </div>
                            <div className="text-left w-full">
                                <span className={`block font-bold text-3xl md:text-4xl mb-1 ${pendingAbsencesCount > 0 ? 'text-[#E11D48]' : 'text-gray-400'}`}>
                                    {pendingAbsencesCount}
                                </span>
                                <span className="block font-medium text-gray-900 text-sm md:text-base">Ausencias</span>
                                <span className="text-xs text-gray-500 md:text-sm">
                                    {pendingAbsencesCount === 0 ? 'Libre de ausencias' : `${pendingAbsencesCount} ${pendingAbsencesCount === 1 ? 'pendiente' : 'pendientes'}`}
                                </span>
                            </div>
                        </button>

                        {/* Reemplazos Card */}
                        <button onClick={() => setCurrentScreen('replacements')} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-start justify-between gap-4 hover:border-[#135D54] transition-all active:scale-[0.98] group h-[160px] md:h-[180px]">
                            <div className="w-full flex justify-between items-start">
                                <div className="bg-[#EAF4F4] p-3 rounded-xl text-[#135D54] group-hover:bg-[#D5EAEA] transition-colors">
                                    <History size={24} strokeWidth={2} className="md:w-7 md:h-7" />
                                </div>
                            </div>
                            <div className="text-left w-full">
                                <span className="block font-bold text-3xl md:text-4xl mb-1 text-[#135D54]">{activeReplacementsCount}</span>
                                <span className="block font-medium text-gray-900 text-sm md:text-base">Reemplazos</span>
                                <span className="text-xs text-gray-500 md:text-sm">Guardias asignadas</span>
                            </div>
                        </button>
                    </div>

                    {/* Proximo Compromiso Card - Independent from the replacement tabs */}
                    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4 md:mb-6">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <CalendarCheck size={20} className="text-[#135D54]" /> Próximo Compromiso
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Tu agenda más inmediata.</p>
                            </div>
                            <button 
                                onClick={() => setCurrentScreen('replacements')}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 hover:text-gray-900 h-9 px-3 text-[#135D54] hover:bg-[#135D54]/10 gap-1"
                            >
                                <span className="hidden sm:inline">Ver todo</span> <ArrowRight size={16} />
                            </button>
                        </div>
                        
                        {isFetchingUserReplacements ? (
                            <div className="flex items-center justify-center py-10 bg-gray-50 rounded-xl border border-gray-100">
                                <Loader2 className="w-6 h-6 text-[#135D54] animate-spin" />
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
                                    <div className="sm:hidden">
                                        <span className="bg-green-100 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Conf.
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
                                        <CheckCircle2 size={12} /> Confirmado
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
                                {(Object.keys(REPLACEMENT_ENDPOINTS) as HomeTab[]).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setHomeTab(tab)}
                                        className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 text-center ${
                                            homeTab === tab 
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
                                   <Loader size="sm" text="Buscando..." />
                                </div>
                            ) : availableReplacements.length > 0 ? (
                                <div className="space-y-4">
                                    {availableReplacements.map((item, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                     <div className="bg-primary/5 text-primary p-2 rounded-lg border border-primary/10">
                                                        <Calendar size={18} />
                                                     </div>
                                                     <div>
                                                        <p className="font-bold text-gray-900 text-sm">{item.FechaInicio_AS}</p>
                                                        <p className="text-xs text-gray-400 font-medium">Inicia guardia</p>
                                                     </div>
                                                </div>
                                                <div className="bg-[#EAF4F4] text-primary px-2 py-1 rounded-md text-[10px] font-bold">
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
                                                onClick={() => handleTakeReplacementRequest(item)}
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
                                        No hay ofertas para {homeTab.toLowerCase()} en {user.service}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F9FB] flex flex-col">
      {currentScreen === 'home' && renderHome()}
      {currentScreen === 'absences' && (
        <AbsencesView 
            user={user} 
            onBack={() => setCurrentScreen('home')} 
            onLogout={onLogout}
            onRefresh={handleRefresh}
        />
      )}
      {currentScreen === 'replacements' && (
        <div className="flex flex-col h-full bg-[#F8F9FB]">
            <TopBar />
            <div className="p-4 md:p-8 w-full max-w-7xl mx-auto flex-1 overflow-y-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={handleBack} className="text-[#135D54] hover:bg-gray-100 p-2 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Mis Reemplazos Asignados</h1>
                </div>
                
                {isFetchingUserReplacements ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader size="sm" text="Cargando reemplazos..." />
                    </div>
                ) : userReplacements.length > 0 ? (
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
                                    {userReplacements.map((item) => {
                                        const canCancel = checkCanCancelReplacement(item.Fechainicio_R, item.Franja_R);
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
                                                        onClick={() => setReplacementToCancel(item)}
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
                            {userReplacements.map((item) => {
                                const canCancel = checkCanCancelReplacement(item.Fechainicio_R, item.Franja_R);
                                return (
                                    <div key={item.ID} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-xs font-bold text-[#135D54] bg-[#135D54]/5 px-3 py-1 rounded-full uppercase tracking-wider">{item.Status_R}</span>
                                            <button 
                                                disabled={!canCancel}
                                                onClick={() => setReplacementToCancel(item)}
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
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <History size={48} className="text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No tienes reemplazos registrados aún.</p>
                    </div>
                )}
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

      {/* Confirmation Take Modal */}
      <Modal 
        isOpen={!!replacementToConfirm} 
        onClose={() => !loadingAction && setReplacementToConfirm(null)} 
        title="Confirmar Reemplazo" 
        width="max-w-[380px]"
      >
        <div className="space-y-5">
           <div className="bg-[#135D54]/5 p-4 rounded-2xl border border-[#135D54]/10 space-y-4">
              <div className="flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg text-[#135D54] shadow-sm">
                      <Calendar size={18} />
                  </div>
                  <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Fecha y Horario</p>
                      <p className="text-sm font-bold text-gray-900">{replacementToConfirm?.FechaInicio_AS} - {replacementToConfirm?.Franja_AS}</p>
                  </div>
              </div>
              <div className="flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg text-[#135D54] shadow-sm">
                      <MapPin size={18} />
                  </div>
                  <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sector</p>
                      <p className="text-sm font-bold text-gray-900">{replacementToConfirm?.Sector_AS}</p>
                  </div>
              </div>
              <div className="flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg text-[#135D54] shadow-sm">
                      <UserIcon size={18} />
                  </div>
                  <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Profesional a reemplazar</p>
                      <p className="text-sm font-bold text-gray-900">{replacementToConfirm?.User_AS}</p>
                  </div>
              </div>
           </div>

           <p className="text-xs text-gray-500 leading-relaxed text-center px-4">
               ¿Confirmas que deseas tomar esta guardia? Al confirmar, quedarás asignado oficialmente como reemplazo.
           </p>

           <div className="flex gap-3 pt-2">
             <Button 
                variant="outline" 
                className="flex-1 border-gray-200 text-gray-600" 
                onClick={() => setReplacementToConfirm(null)}
                disabled={loadingAction}
             >
                Cancelar
             </Button>
             <Button 
                className="flex-1 bg-[#135D54] hover:bg-[#0e453e]" 
                onClick={confirmTakeReplacement}
                disabled={loadingAction}
             >
                {loadingAction ? <Loader2 className="animate-spin" size={18} /> : "Confirmar"}
             </Button>
           </div>
        </div>
      </Modal>

      {/* Cancel Replacement Confirmation Modal */}
      <Modal 
        isOpen={!!replacementToCancel} 
        onClose={() => !isCancellingReplacement && setReplacementToCancel(null)}
        title="Cancelar Reemplazo"
        width="max-w-sm"
      >
        <div className="space-y-6 pt-2">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3">
            <XCircle className="text-red-500 shrink-0" size={24} />
            <p className="text-sm text-gray-700 leading-relaxed">
              ¿Estás seguro de que deseas cancelar el reemplazo asignado para el día <span className="font-bold">{replacementToCancel?.Fechainicio_R}</span>?
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center px-4 italic">
            Esta acción liberará el turno para que otro profesional pueda tomarlo.
          </p>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl h-12" 
              onClick={() => setReplacementToCancel(null)}
              disabled={isCancellingReplacement}
            >
              Mantener
            </Button>
            <Button 
              className="flex-1 rounded-xl h-12 bg-red-500 hover:bg-red-600 border-none text-white shadow-sm font-bold"
              onClick={confirmCancelReplacement}
              disabled={isCancellingReplacement}
            >
              {isCancellingReplacement ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Sí, cancelar"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {successTakeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-[#EAF4F4] flex items-center justify-center mb-6 border border-[#135D54]/10"><CheckCircle2 size={40} className="text-[#135D54]" /></div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Turno Asignado!</h3>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">Has tomado el reemplazo correctamente. Ahora puedes verlo en tu historial.</p>
                <Button className="w-full bg-[#135D54] hover:bg-[#0e453e] h-12 text-base shadow-lg shadow-[#135D54]/20" onClick={() => {
                  setSuccessTakeModal(false);
                  handleRefresh();
                }}>Excelente</Button>
             </div>
        </div>
      )}

      {loadingAction && (
        <div className="absolute inset-0 z-[70] bg-white/60 backdrop-blur-sm flex items-center justify-center">
             <div className="flex flex-col items-center gap-3">
                 <div className="w-12 h-12 border-4 border-[#135D54] border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-[#135D54] font-medium text-sm">Procesando...</span>
             </div>
        </div>
      )}
    </div>
  );
};
