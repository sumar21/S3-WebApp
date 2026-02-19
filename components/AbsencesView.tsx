
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, ArrowLeft, RotateCw, LogOut, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { AuthUser } from '../types';
import { AbsenceForm } from './absences/AbsenceForm';
import { AbsenceHistory } from './absences/AbsenceHistory';

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
  const [absenceToCancel, setAbsenceToCancel] = useState<any | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const parseDateFromAPI = (dateStr: string): Date => {
    if (!dateStr) return new Date(0);
    const [d, m, y] = dateStr.split('/').map(Number);
    return new Date(y, m - 1, d);
  };

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

  const filteredAbsences = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return userAbsences.filter(item => {
      const itemDate = parseDateFromAPI(item.FechaInicio_AS);
      const hasDateFilter = filters.dateFrom || filters.dateTo;
      const hasStatusFilter = filters.status !== '';
      const isFilterActive = hasDateFilter || hasStatusFilter;

      if (!isFilterActive) {
        return itemDate >= today;
      }

      let matches = true;
      if (hasStatusFilter) {
        if (filters.status.toLowerCase() !== item.Status_AS.toLowerCase()) matches = false;
      }
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
        HoraFinal_AS: startTime,
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
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        setForm({ dateFrom: '', timeRange: '20:00 - 08:00', reason: '' });
      } else {
        alert("Error al reportar la ausencia. Intente nuevamente.");
      }
    } catch (error) {
      console.error("Error submitting absence:", error);
      alert("Error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmCancelAbsence = async () => {
    if (!absenceToCancel) return;
    setIsCancelling(true);
    try {
      const response = await fetch(CANCEL_ABSENCE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ID: Number(absenceToCancel.ID) }),
      });
      if (response.ok) {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] overflow-hidden w-full font-sans">
      <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20 w-full border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-[#135D54]/10 rounded-xl p-2">
            <img src="https://placehold.co/24x24/135D54/ffffff?text=S3" alt="Logo" className="w-6 h-6 object-contain" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (onRefresh) onRefresh(); fetchAbsences(); }}
            className="p-2 text-gray-400 hover:text-[#135D54] hover:bg-[#135D54]/10 rounded-full transition-colors"
          >
            <RotateCw size={20} className={isFetching ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="p-4 md:p-8 w-full max-w-5xl mx-auto flex flex-col min-h-full">
          <div className="flex items-center gap-4 mb-6">
            {onBack && (
              <button onClick={onBack} className="text-[#135D54] hover:bg-gray-100 p-2 rounded-full transition-colors">
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-800">Mis ausencias</h1>
              <p className="text-xs text-gray-400 font-medium uppercase hidden sm:block">Gestión de inasistencias</p>
            </div>
          </div>

          <div className="bg-white p-1 rounded-2xl flex mb-8 border border-gray-200 shadow-sm self-center w-full max-w-md">
            <button
              onClick={() => setActiveTab('cargar')}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'cargar' ? 'bg-[#135D54] text-white shadow-md' : 'text-gray-400 hover:text-[#135D54]'}`}
            >
              Cargar ausencia
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'historial' ? 'bg-[#135D54] text-white shadow-md' : 'text-gray-400 hover:text-[#135D54]'}`}
            >
              Tus ausencias
            </button>
          </div>

          {activeTab === 'cargar' ? (
            <AbsenceForm form={form} setForm={setForm} isSubmitting={isSubmitting} onReport={() => setShowConfirmModal(true)} />
          ) : (
            <AbsenceHistory
              absences={filteredAbsences}
              isFetching={isFetching}
              filters={filters}
              setFilters={setFilters}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              onCancel={setAbsenceToCancel}
              getStatusColor={getStatusColor}
              parseDateFromAPI={parseDateFromAPI}
              today={today}
            />
          )}
        </div>
      </div>

      <Modal isOpen={showConfirmModal} onClose={() => !isSubmitting && setShowConfirmModal(false)} title="Confirmar reporte" width="max-w-sm">
        <div className="space-y-6 pt-2">
          <div className="bg-[#135D54]/5 p-4 rounded-2xl border border-[#135D54]/10 text-sm text-gray-600">
            ¿Confirmas la ausencia para el día <span className="font-bold text-[#135D54]">{form.dateFrom}</span> en el horario de <span className="font-bold text-[#135D54]">{form.timeRange}</span>?
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button className="flex-1 bg-[#135D54] hover:bg-[#0e453e]" onClick={handleConfirmReport} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Continuar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!absenceToCancel} onClose={() => !isCancelling && setAbsenceToCancel(null)} title="Cancelar ausencia" width="max-w-sm">
        <div className="space-y-6 pt-2">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3 text-sm text-gray-700">
            <XCircle className="text-red-500 shrink-0" size={24} />
            <p>¿Cancelar la ausencia del día <span className="font-bold">{absenceToCancel?.FechaInicio_AS}</span>?</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAbsenceToCancel(null)} disabled={isCancelling}>No</Button>
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none" onClick={confirmCancelAbsence} disabled={isCancelling}>
              {isCancelling ? <Loader2 className="animate-spin" size={20} /> : "Sí, cancelar"}
            </Button>
          </div>
        </div>
      </Modal>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-[#EAFBF0] flex items-center justify-center mb-6 border border-green-100">
              <CheckCircle2 size={40} className="text-[#10B981]" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Reportada!</h3>
            <p className="text-gray-500 text-sm mb-6">Hemos notificado tu ausencia correctamente.</p>
            <Button className="w-full bg-[#135D54] hover:bg-[#0e453e] h-12" onClick={() => { setShowSuccessModal(false); if (onBack) onBack(); }}>Entendido</Button>
          </div>
        </div>
      )}

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Cerrar sesión" width="max-w-[350px]">
        <div className="space-y-6">
          <p className="text-gray-500 text-sm">¿Deseas cerrar sesión?</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowLogoutModal(false)}>No</Button>
            <Button className="flex-1 bg-[#135D54]" onClick={onLogout}>Sí</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
