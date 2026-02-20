import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, LogOut, RotateCw, CheckCircle2 } from 'lucide-react';
import { AbsencesView } from './AbsencesView';
import { AuthUser } from '../types';
import { HomeDashboard } from './mobile/HomeDashboard';
import { ReplacementsList } from './mobile/ReplacementsList';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface MobileViewProps {
    user: AuthUser;
    onLogout: () => void;
}

type Screen = 'home' | 'absences' | 'replacements';

const REPLACEMENT_ENDPOINTS: Record<string, string> = {
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
    const [homeTab, setHomeTab] = useState<'Hoy' | 'Mañana' | 'Todos'>('Hoy');

    const [availableReplacements, setAvailableReplacements] = useState<any[]>([]);
    const [userReplacements, setUserReplacements] = useState<any[]>([]);
    const [userAbsences, setUserAbsences] = useState<any[]>([]);

    const [isFetchingReplacements, setIsFetchingReplacements] = useState(false);
    const [isFetchingUserReplacements, setIsFetchingUserReplacements] = useState(false);
    const [isFetchingUserAbsences, setIsFetchingUserAbsences] = useState(false);

    const [errorReplacements, setErrorReplacements] = useState(false);
    const [errorUserReplacements, setErrorUserReplacements] = useState(false);
    const [errorUserAbsences, setErrorUserAbsences] = useState(false);

    const [replacementToConfirm, setReplacementToConfirm] = useState<any | null>(null);
    const [loadingAction, setLoadingAction] = useState(false);
    const [replacementToCancel, setReplacementToCancel] = useState<any | null>(null);
    const [successTakeModal, setSuccessTakeModal] = useState(false);

    const monthsList = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

    const parseDate = (str: string) => {
        if (!str) return new Date(0);
        const [d, m, y] = str.split('/').map(Number);
        return new Date(y, m - 1, d);
    };

    const checkCanCancelReplacement = (dateStr: string, franjaStr: string) => {
        const now = new Date();
        const eventDate = parseDate(dateStr);
        const startTimeStr = franjaStr.split(' - ')[0];
        const [hours, minutes] = startTimeStr.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
        const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffHours >= 72;
    };

    const fetchAvailableReplacements = async (tab: string) => {
        setIsFetchingReplacements(true);
        setAvailableReplacements([]);
        setErrorReplacements(false);
        try {
            const response = await fetch(REPLACEMENT_ENDPOINTS[tab], {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Servicio_AS: user.service || 'General', IDuser: String(user.id) }),
            });
            if (!response.ok) throw new Error("Network response was not ok");
            const result = await response.json();
            setAvailableReplacements(result?.data || []);
        } catch (error) {
            console.error("Error fetching available replacements:", error);
            setErrorReplacements(true);
            setAvailableReplacements([]);
        } finally {
            setIsFetchingReplacements(false);
        }
    };

    const fetchUserReplacements = async () => {
        setIsFetchingUserReplacements(true);
        setErrorUserReplacements(false);
        try {
            const response = await fetch(USER_REPLACEMENTS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ IDuser: String(user.id) }),
            });
            if (!response.ok) throw new Error("Network response was not ok");
            const result = await response.json();
            setUserReplacements(result?.data || []);
        } catch (error) {
            console.error("Error fetching user replacements:", error);
            setErrorUserReplacements(true);
            setUserReplacements([]);
        } finally {
            setIsFetchingUserReplacements(false);
        }
    };

    const fetchUserAbsences = async () => {
        setIsFetchingUserAbsences(true);
        setErrorUserAbsences(false);
        try {
            const response = await fetch(USER_ABSENCES_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ IDuser: String(user.id) }),
            });
            if (!response.ok) throw new Error("Network response was not ok");
            const result = await response.json();
            setUserAbsences(result?.data || []);
        } catch (error) {
            console.error("Error fetching user absences:", error);
            setErrorUserAbsences(true);
            setUserAbsences([]);
        } finally {
            setIsFetchingUserAbsences(false);
        }
    };

    useEffect(() => {
        if (currentScreen === 'home') {
            fetchUserReplacements();
            fetchUserAbsences();
        }
    }, [currentScreen, user.id]);

    useEffect(() => {
        if (currentScreen === 'home') {
            fetchAvailableReplacements(homeTab);
        }
    }, [currentScreen, homeTab, user.id]);

    const handleRefresh = () => {
        fetchAvailableReplacements(homeTab);
        fetchUserReplacements();
        fetchUserAbsences();
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
        setLoadingAction(true);
        try {
            const response = await fetch(CANCEL_REPLACEMENT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ID: Number(replacementToCancel.ID), IDUnicoAusencia_R: String(replacementToCancel.IDUnicoAusencia_R || '') }),
            });
            if (response.ok) {
                setReplacementToCancel(null);
                fetchUserReplacements();
            }
        } finally {
            setLoadingAction(false);
        }
    };

    const nextShift = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return userReplacements
            .filter(r => parseDate(r.Fechainicio_R) >= now)
            .sort((a, b) => parseDate(a.Fechainicio_R).getTime() - parseDate(b.Fechainicio_R).getTime())[0];
    }, [userReplacements]);

    const firstName = user.name.includes(',') ? user.name.split(',')[1].trim() : user.name.split(' ')[0];

    if (currentScreen === 'absences') {
        return <AbsencesView user={user} onBack={() => setCurrentScreen('home')} onLogout={onLogout} onRefresh={handleRefresh} />;
    }

    if (currentScreen === 'replacements') {
        return (
            <div className="h-full flex flex-col bg-[#F8F9FB] overflow-hidden w-full font-sans">
                <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 w-full border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setCurrentScreen('home')} className="text-[#135D54] hover:bg-gray-100 p-2 rounded-full transition-colors mr-1">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">Tus Reemplazos</h1>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
                    <div className="max-w-5xl mx-auto w-full">
                        <ReplacementsList
                            replacements={userReplacements}
                            isFetching={isFetchingUserReplacements}
                            error={errorUserReplacements}
                            onRetry={fetchUserReplacements}
                            onCancel={setReplacementToCancel}
                            checkCanCancel={checkCanCancelReplacement}
                        />
                    </div>
                </div>

                <Modal isOpen={!!replacementToCancel} onClose={() => setReplacementToCancel(null)} title="Cancelar Reemplazo" width="max-w-sm">
                    <div className="space-y-6 pt-2 text-center">
                        <p className="text-sm text-gray-600">¿Estás seguro de que deseas cancelar el reemplazo asignado para el día <span className="font-bold">{replacementToCancel?.Fechainicio_R}</span>?</p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setReplacementToCancel(null)}>No</Button>
                            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={confirmCancelReplacement} disabled={loadingAction}>Sí, cancelar</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#F8F9FB] overflow-hidden w-full font-sans">
            <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 w-full border-b border-gray-100">
                <div className="bg-[#135D54]/10 rounded-xl p-2"><img src="https://placehold.co/24x24/135D54/ffffff?text=S3" alt="Logo" className="w-6 h-6 object-contain" /></div>
                <div className="flex items-center gap-2">
                    <button onClick={handleRefresh} className="p-2 text-gray-400 hover:text-[#135D54] hover:bg-[#135D54]/10 rounded-full transition-colors">
                        <RotateCw size={20} className={isFetchingReplacements || isFetchingUserReplacements || isFetchingUserAbsences ? "animate-spin" : ""} />
                    </button>
                    <button onClick={() => setShowLogoutModal(true)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <HomeDashboard
                    firstName={firstName}
                    totalAbsencesCount={userAbsences.length}
                    pendingAbsencesCount={userAbsences.filter(a => a.Status_AS === 'Pendiente').length}
                    activeReplacementsCount={userReplacements.length}
                    nextShift={nextShift}
                    isFetchingUserReplacements={isFetchingUserReplacements}
                    isFetchingReplacements={isFetchingReplacements}
                    errorUserReplacements={errorUserReplacements}
                    errorReplacements={errorReplacements}
                    onRetryUserReplacements={fetchUserReplacements}
                    onRetryReplacements={() => fetchAvailableReplacements(homeTab)}
                    availableReplacements={availableReplacements}
                    homeTab={homeTab}
                    setHomeTab={setHomeTab}
                    onNavigate={(s) => setCurrentScreen(s as Screen)}
                    onTakeReplacement={setReplacementToConfirm}
                    parseDate={parseDate}
                    monthsList={monthsList}
                    serviceName={user.service}
                />
            </div>

            <Modal isOpen={!!replacementToConfirm} onClose={() => setReplacementToConfirm(null)} title="Confirmar Reemplazo" width="max-w-[380px]">
                <div className="space-y-5 text-center">
                    <p className="text-sm text-gray-600">¿Deseas tomar el reemplazo de {replacementToConfirm?.User_AS} para el {replacementToConfirm?.FechaInicio_AS}?</p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setReplacementToConfirm(null)}>Cancelar</Button>
                        <Button className="flex-1 bg-[#135D54]" onClick={confirmTakeReplacement} disabled={loadingAction}>Confirmar</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Cerrar sesión" width="max-w-[350px]">
                <div className="space-y-6">
                    <p className="text-gray-500 text-sm">¿Deseas cerrar sesión?</p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowLogoutModal(false)}>No</Button>
                        <Button className="flex-1 bg-[#135D54]" onClick={onLogout}>Sí</Button>
                    </div>
                </div>
            </Modal>

            {successTakeModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6 border border-green-100">
                            <CheckCircle2 size={40} className="text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Turno Asignado!</h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">Has tomado el reemplazo correctamente. Ahora puedes verlo en tu historial.</p>
                        <Button className="w-full bg-[#135D54] hover:bg-[#0e453e] h-12 text-base shadow-lg shadow-[#135D54]/20" onClick={() => {
                            setSuccessTakeModal(false);
                            handleRefresh();
                        }}>Excelente</Button>
                    </div>
                </div>
            )}
        </div>
    );
};
