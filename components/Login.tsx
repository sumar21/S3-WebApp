
import React, { useState } from 'react';
import { Eye, EyeOff, RefreshCw, ArrowRight, Lock, User, AlertCircle, CheckCircle2, ShieldCheck, Loader2, UserCheck, KeyRound } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { AuthUser } from '../types';

interface LoginProps {
  onLoginSuccess: (user: AuthUser) => void;
}

const LOGIN_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b2dcc4d15f5046c2b1cd26a18ccd4dff/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=gKmVKBGVBJ39ieJH1-FSPc-IkP4T7ioLdDcjPQyqnPc';
const UPDATE_PASSWORD_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c0e17a1de21c404790f00b7be53a900d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=2QYfvZ61Ogo7y7ngw0bS2anW48ei1SxKkrZ6yDvFsp8';
const VALIDATE_USER_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/335bae20e0684ea7978de9689d7b2cf5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=_WUPo8PA0PZxFIL17CVSssG7zLB6gnRJHr9V_CpAx3k';

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  
  // Recover Password State
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverFeedback, setRecoverFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Validate User State
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [validateEmail, setValidateEmail] = useState('');
  const [validationCode, setValidationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validateFeedback, setValidateFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Set Password Modal (for 'Pendiente' users or after validation code)
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [tempUser, setTempUser] = useState<AuthUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ConcatLog_US: username,
          Password: password
        }),
      });

      const data = await response.json();

      if (data && data.success === true) {
        const accessArray = data.Aplicacion_US 
          ? data.Aplicacion_US.split(';').map((s: string) => s.trim()) 
          : [];

        const authUser: AuthUser = {
          id: Number(data.ID_US),
          name: data.NombreConcat_US,
          username: data.User_US,
          email: data.Correo_US,
          access: accessArray as ('Desktop' | 'Mobile')[],
          profileType: data.TipoPerfil_US,
          doctorType: data.TipoM_US,
          service: data.Servicio_US,
          status : data.Status_US
        };

        if (data.Status_US === 'Pendiente') {
            setTempUser(authUser);
            setShowSetPasswordModal(true);
        } else {
            onLoginSuccess(authUser);
        }
      } else {
        setErrorModalOpen(true);
      }

    } catch (error) {
      console.error('Login error:', error);
      setErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!tempUser) return;
    if (newPassword.length < 6) {
        setPasswordError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }
    if (newPassword !== confirmPassword) {
        setPasswordError('Las contraseñas no coinciden.');
        return;
    }

    setIsSettingPassword(true);
    setPasswordError(null);

    try {
        const response = await fetch(UPDATE_PASSWORD_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ID: tempUser.id,
                Password: newPassword
            }),
        });

        if (response.ok) { 
            await new Promise(resolve => setTimeout(resolve, 1500));
            setShowSetPasswordModal(false);
            onLoginSuccess({ ...tempUser, status: 'Activo' });
        } else {
            setPasswordError('No se pudo actualizar la contraseña. Intente nuevamente.');
        }
    } catch (error) {
        console.error('Error updating password:', error);
        setPasswordError('Error de conexión.');
    } finally {
        setIsSettingPassword(false);
    }
  };

  const handleRecoverSubmit = async () => {
    if (!isValidEmail(recoverEmail)) return;

    setIsRecovering(true);
    setRecoverFeedback(null);

    try {
        const response = await fetch('https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6aec9efa73084dcba85a7fe13e029fd1/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=IoIYKXOMt5iElp7wgeSWg2xKwPqI-z45_XotgfuX8yo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Email_US: recoverEmail
            }),
        });

        const data = await response.json();

        if (data && data.success === true) {
            setRecoverFeedback({ type: 'success', message: 'Correo enviado correctamente.' });
            setTimeout(() => {
                setShowRecoverModal(false);
                setRecoverEmail('');
                setRecoverFeedback(null);
            }, 2000);
        } else {
            setRecoverFeedback({ type: 'error', message: 'No se encuentra el correo electrónico.' });
        }
    } catch (error) {
        console.error('Recovery error:', error);
        setRecoverFeedback({ type: 'error', message: 'Error de conexión. Intente nuevamente.' });
    } finally {
        setIsRecovering(false);
    }
  };

  const handleValidateSubmit = async () => {
    if (!isValidEmail(validateEmail)) return;

    setIsValidating(true);
    setValidateFeedback(null);

    try {
        if (!showCodeInput) {
            // Paso 1: Validar si existe el correo y si falta validar
            const response = await fetch(VALIDATE_USER_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Correo_US: validateEmail }),
            });

            const data = await response.json();

            if (data && data.success === true) {
                setValidateFeedback({ type: 'success', message: 'Ya esta validado este usuario' });
                setShowCodeInput(false);
            } else if (data && data.success === false && data.message === "Falta validar usuario") {
                setValidateFeedback({ type: 'error', message: 'Falta validar usuario' });
                setShowCodeInput(true);
            } else if (data && data.success === false && data.message === "No exite el correo") {
                setValidateFeedback({ type: 'error', message: 'No existe ese correo registrado' });
                setShowCodeInput(false);
            } else {
                setValidateFeedback({ type: 'error', message: data.message || 'Error al validar el correo.' });
                setShowCodeInput(false);
            }
        } else {
            // Paso 2: Verificar el código usando el endpoint de Login
            const response = await fetch(LOGIN_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ConcatLog_US: validateEmail,
                    Password: validationCode
                }),
            });

            const data = await response.json();

            if (data && data.success === true && data.message === "Accept") {
                const accessArray = data.Aplicacion_US 
                  ? data.Aplicacion_US.split(';').map((s: string) => s.trim()) 
                  : [];

                const authUser: AuthUser = {
                  id: Number(data.ID_US),
                  name: data.NombreConcat_US,
                  username: data.User_US,
                  email: data.Correo_US,
                  access: accessArray as ('Desktop' | 'Mobile')[],
                  profileType: data.TipoPerfil_US,
                  doctorType: data.TipoM_US,
                  service: data.Servicio_US,
                  status : data.Status_US
                };

                // Abrir inmediatamente el popup de primera vez para poner nueva contraseña
                setTempUser(authUser);
                setShowValidateModal(false);
                setShowSetPasswordModal(true);
                setValidateFeedback({ type: 'success', message: 'Código verificado con éxito' });
            } else {
                setValidateFeedback({ type: 'error', message: 'Código de validación incorrecto o expirado.' });
            }
        }
    } catch (error) {
        console.error('Validation error:', error);
        setValidateFeedback({ type: 'error', message: 'Error de conexión. Intente nuevamente.' });
    } finally {
        setIsValidating(false);
    }
  };

  const closeRecoverModal = () => {
      setShowRecoverModal(false);
      setRecoverFeedback(null);
      setRecoverEmail('');
  };

  const closeValidateModal = () => {
    setShowValidateModal(false);
    setValidateFeedback(null);
    setValidateEmail('');
    setValidationCode('');
    setShowCodeInput(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans overflow-hidden">
      {/* Panel Izquierdo - Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-[100dvh] bg-white relative z-10 animate-in slide-in-from-left-4 duration-500">
        
        {/* Logo de Cabecera */}
        <div className="px-6 py-6 lg:px-12 lg:py-8 flex-none">
           <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#135D54] flex items-center justify-center shadow-lg shadow-[#135D54]/20">
              <span className="text-white font-bold text-sm tracking-tighter">S3</span>
            </div>
            <span className="lg:hidden text-lg font-bold text-gray-900 tracking-tight">MedCover</span>
          </div>
        </div>

        {/* Contenido Central */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-12">
           <div className="w-full max-w-[400px] mx-auto space-y-8">
              <div className="space-y-2 text-center lg:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bienvenido</h1>
                <p className="text-gray-500 text-base">
                  Inicia sesión para gestionar tu agenda médica.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#135D54] transition-colors pointer-events-none z-10">
                      <User size={18} />
                    </div>
                    <Input
                      id="username"
                      name="username"
                      placeholder="Usuario o correo"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      className="h-11 pl-10 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#135D54] transition-all text-gray-900 placeholder:text-gray-400 rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative group">
                        <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#135D54] transition-colors pointer-events-none z-10">
                          <Lock size={18} />
                        </div>
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Contraseña"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          className="h-11 pl-10 pr-10 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#135D54] transition-all text-gray-900 placeholder:text-gray-400 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <div className="flex justify-end gap-3 items-center">
                        <button 
                          type="button"
                          onClick={() => setShowValidateModal(true)}
                          className="text-xs font-semibold text-gray-500 hover:text-[#135D54] transition-colors focus:outline-none hover:underline"
                        >
                          Validar usuario
                        </button>
                        <span className="text-gray-300">|</span>
                        <button 
                          type="button"
                          onClick={() => setShowRecoverModal(true)}
                          className="text-xs font-semibold text-[#135D54] hover:text-[#0e453e] transition-colors focus:outline-none hover:underline"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold shadow-lg shadow-[#135D54]/20 hover:shadow-[#135D54]/30 transition-all active:scale-[0.98] rounded-xl bg-[#135D54] hover:bg-[#0e453e]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                         <Loader2 className="w-5 h-5 animate-spin" />
                         <span>Ingresando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Iniciar sesión</span>
                      <ArrowRight size={18} className="opacity-80" />
                    </div>
                  )}
                </Button>
              </form>
           </div>
        </div>

        {/* Pie de página */}
        <div className="px-6 py-6 lg:px-12 flex-none flex items-center justify-between border-t border-gray-50 lg:border-none">
           <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 text-xs text-gray-400">
             <span>© 2025 S3 App</span>
             <span className="hidden lg:inline">•</span>
             <span className="font-mono">v1.2.0</span>
           </div>
           
           <div 
             className="flex items-center gap-2 text-gray-400 hover:text-[#135D54] transition-colors cursor-pointer group"
             onClick={() => window.location.reload()}
          >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500"/>
              <span className="text-xs font-semibold uppercase tracking-wide">Actualizar</span>
          </div>
        </div>
      </div>

      {/* Panel Derecho - Imagen */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0D2B26] overflow-hidden items-center justify-center min-h-screen">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=2091&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#135D54] via-[#0D2B26] to-black opacity-90"></div>
        
        <div className="relative z-10 max-w-lg px-12 text-center space-y-8 animate-in slide-in-from-bottom-8 duration-1000 delay-100">
           <div className="inline-flex p-4 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 mb-4 shadow-2xl">
              <img 
                src="https://placehold.co/80x80/135D54/ffffff?text=S3" 
                alt="App Icon" 
                className="w-16 h-16 object-contain drop-shadow-lg"
              />
           </div>
           
           <div className="space-y-4">
             <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
               Gestión inteligente <br/> para profesionales.
             </h2>
             <p className="text-lg text-gray-300 font-light leading-relaxed max-w-md mx-auto">
               Optimiza tus horarios, coordina reemplazos y mantén el control de tu agenda médica.
             </p>
           </div>
        </div>
      </div>
      
      {/* Modal de Nueva Contraseña (para Status 'Pendiente' o post-validación) */}
      <Modal 
        isOpen={showSetPasswordModal} 
        onClose={() => !isSettingPassword && setShowSetPasswordModal(false)}
        title="Configurar Contraseña"
        width="max-w-md"
      >
        <div className="space-y-6 pt-2">
            <div className="bg-[#135D54]/5 p-4 rounded-2xl border border-[#135D54]/10 flex gap-4">
                <div className="bg-white p-2.5 rounded-xl text-[#135D54] shadow-sm shrink-0 h-fit">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-900">Configuración de seguridad</h4>
                    <p className="text-xs text-gray-500 leading-relaxed mt-1">
                        Por seguridad, debes establecer una nueva contraseña personal para continuar.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                    <div className="relative">
                        <Input 
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="h-12 rounded-xl bg-gray-50/50"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setPasswordError(null);
                            }}
                        />
                        <Lock className="absolute right-4 top-3.5 text-gray-300" size={18} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                    <div className="relative">
                        <Input 
                            type="password"
                            placeholder="Repite la contraseña"
                            className="h-12 rounded-xl bg-gray-50/50"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setPasswordError(null);
                            }}
                        />
                        <ShieldCheck className="absolute right-4 top-3.5 text-gray-300" size={18} />
                    </div>
                </div>
                {passwordError && (
                    <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 p-2.5 rounded-lg border border-red-100 animate-in shake duration-300">
                        <AlertCircle size={14} />
                        {passwordError}
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-2">
                <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl border-gray-200 text-gray-500" 
                    onClick={() => setShowSetPasswordModal(false)}
                    disabled={isSettingPassword}
                >
                    Cancelar
                </Button>
                <Button 
                    className="flex-1 h-12 rounded-xl bg-[#135D54] hover:bg-[#0e453e] font-bold"
                    onClick={handleUpdatePassword}
                    // REQUISITO: Ambos campos iguales para desbloquear
                    disabled={isSettingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                >
                    {isSettingPassword ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        "Guardar y Entrar"
                    )}
                </Button>
            </div>
        </div>
      </Modal>

      {/* Modal Acceso Denegado */}
      <Modal isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} width="max-w-sm">
        <div className="flex flex-col items-center text-center space-y-4 py-4 px-2">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
             <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">Acceso denegado</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Las credenciales ingresadas no coinciden con nuestros registros.
            </p>
          </div>
          <div className="flex gap-3 w-full pt-4">
            <Button variant="outline" className="flex-1 border-gray-200 text-gray-700" onClick={() => setErrorModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none" onClick={() => setErrorModalOpen(false)}>
              Reintentar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Validar Usuario */}
      <Modal 
        isOpen={showValidateModal} 
        onClose={closeValidateModal} 
        title="Validar usuario"
        width="max-w-md"
      >
        <div className="space-y-6 pt-2">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-3">
             <UserCheck className="text-[#135D54] shrink-0" size={20} />
             <p className="text-gray-600 text-sm">
               Ingresa tu correo para validar el estado de tu cuenta.
             </p>
          </div>
          
          <div className="space-y-4">
             <div className="space-y-1.5">
               <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Correo electrónico</label>
               <Input
                  type="email"
                  placeholder="nombre@institucion.com"
                  value={validateEmail}
                  onChange={(e) => {
                      setValidateEmail(e.target.value);
                      setValidateFeedback(null);
                  }}
                  className={`h-11 rounded-xl ${validateFeedback?.type === 'error' && !showCodeInput ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
               />
             </div>

             {showCodeInput && (
               <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Código de validación</label>
                  <div className="relative">
                    <Input
                        type="text"
                        placeholder="Ingrese el código"
                        value={validationCode}
                        onChange={(e) => setValidationCode(e.target.value)}
                        className="h-11 rounded-xl bg-white border-[#135D54]/20 focus:border-[#135D54]"
                    />
                    <KeyRound className="absolute right-3 top-2.5 text-gray-300" size={18} />
                  </div>
               </div>
             )}

             {validateFeedback && (
                <div className={`text-sm flex items-center gap-2 p-3 rounded-md animate-in fade-in slide-in-from-top-1 ${
                    validateFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                    {validateFeedback.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                    {validateFeedback.message}
                </div>
             )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
                variant="ghost" 
                className="flex-1 text-gray-500 hover:text-gray-800" 
                onClick={closeValidateModal}
            >
              Cerrar
            </Button>
            <Button 
                className="flex-1 bg-[#135D54] hover:bg-[#0e453e]"
                onClick={handleValidateSubmit}
                disabled={!isValidEmail(validateEmail) || isValidating}
            >
              {isValidating ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                showCodeInput ? "Verificar código" : "Validar ahora"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Recuperar Contraseña */}
      <Modal 
        isOpen={showRecoverModal} 
        onClose={closeRecoverModal} 
        title="Restablecer contraseña"
        width="max-w-md"
      >
        <div className="space-y-6 pt-2">
          <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
            Ingresa tu correo. Te enviaremos un enlace seguro para generar una nueva contraseña.
          </p>
          
          <div className="space-y-4">
             <div className="space-y-1.5">
               <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Correo electrónico</label>
               <Input
                  type="email"
                  placeholder="nombre@institucion.com"
                  value={recoverEmail}
                  onChange={(e) => {
                      setRecoverEmail(e.target.value);
                      setRecoverFeedback(null);
                  }}
                  className={`h-11 rounded-xl ${recoverFeedback?.type === 'error' ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
               />
             </div>
             {recoverFeedback && (
                <div className={`text-sm flex items-center gap-2 p-3 rounded-md animate-in fade-in slide-in-from-top-1 ${
                    recoverFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                    {recoverFeedback.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                    {recoverFeedback.message}
                </div>
             )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
                variant="ghost" 
                className="flex-1 text-gray-500 hover:text-gray-800" 
                onClick={closeRecoverModal}
            >
              Cancelar
            </Button>
            <Button 
                className="flex-1 bg-[#135D54] hover:bg-[#0e453e]"
                onClick={handleRecoverSubmit}
                disabled={!isValidEmail(recoverEmail) || isRecovering}
            >
              {isRecovering ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Enviar enlace"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
