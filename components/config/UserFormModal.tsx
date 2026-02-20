import React from 'react';
import { Upload, Loader2, FileText, Eye, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Combobox } from '../ui/Combobox';
import { DatePicker } from '../ui/DatePicker';
import { NewUserForm } from '../../types';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingId: string | null;
    formData: NewUserForm;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onFieldChange: (name: string, value: string) => void;
    onSuccess: () => void; // Called after successful save
    fileInputRef: React.RefObject<HTMLInputElement>;
    fileName: string | null;
    fileContent: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFetchCV: () => void;
    isLoadingCV: boolean;
    isFormValid: boolean;
}

const CREATE_USER_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a43b8cdf5dbf4f6f83e4956eaacb3d5d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=rl5wn8Q3s4fg2pLzpD0HoS1uurNrA4rBeQt6-FIwwUQ';
const UPDATE_USER_ENDPOINT = 'https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/24bb2783df1e489f89454f47d8a75cb1/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=OdTsQeRAS6fNIN0iP3_D6VWJflzfiFJQZ-ytttMivn4';

const ROLE_OPTIONS = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Medico', label: 'Médico' },
    { value: 'User', label: 'RH' },
];

const TYPE_OPTIONS = [
    { value: 'Fijo', label: 'Fijo' },
    { value: 'Suplente', label: 'Suplente' },
];

const SERVICE_OPTIONS = [
    { value: 'Cardiología', label: 'Cardiología' },
    { value: 'Pediatría', label: 'Pediatría' },
    { value: 'Clínica Médica', label: 'Clínica Médica' },
    { value: 'Traumatología', label: 'Traumatología' },
    { value: 'General', label: 'General' },
];

export const UserFormModal: React.FC<UserFormModalProps> = ({
    isOpen,
    onClose,
    editingId,
    formData,
    onInputChange,
    onFieldChange,
    onSuccess,
    fileInputRef,
    fileName,
    fileContent,
    onFileChange,
    onFetchCV,
    isLoadingCV,
    isFormValid,
}) => {
    const [loading, setLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const handleInternalSave = async () => {
        setLoading(true);
        try {
            let appAccess = '';
            if (formData.role === 'Admin') appAccess = 'Desktop;Mobile';
            else if (formData.role === 'Medico') appAccess = 'Mobile';
            else if (formData.role === 'User') appAccess = 'Desktop';

            let formattedBirthDate = formData.birthDate;
            if (formData.birthDate && formData.birthDate.includes('-')) {
                const parts = formData.birthDate.split('-');
                if (parts.length === 3) formattedBirthDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }

            const generatedUser = (formData.name && formData.surname)
                ? `${formData.name.substring(0, 3).toLowerCase()}${formData.surname.toLowerCase()}`
                : '';

            const payload: any = {
                DNI: String(formData.dni),
                Sector: formData.sector,
                Correo: formData.email,
                FechaNac: formattedBirthDate,
                TipoM: formData.type,
                Aplicacion: appAccess,
                Contrasena: formData.password,
                TipoPerfil: formData.role === 'User' ? 'RH' : formData.role,
                ConcatLog: generatedUser,
                ConcatName: `${formData.surname}, ${formData.name}`,
                Nombre: formData.name,
                Apellido: formData.surname,
                Servicio: formData.service
            };

            if (editingId) {
                payload.ID = Number(editingId);
            }

            if (fileContent) {
                payload.FileName = fileName;
                payload.FileContent = fileContent;
            }

            const endpoint = editingId ? UPDATE_USER_ENDPOINT : CREATE_USER_ENDPOINT;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const errorText = await response.text();
                console.error("Error saving user:", errorText);
                alert("Error al guardar el usuario: " + errorText);
            }
        } catch (error) {
            console.error("Network error saving user:", error);
            alert("Error de red al guardar el usuario.");
        } finally {
            setLoading(false);
        }
    };
    const generatedUsername = (formData.name && formData.surname)
        ? `${formData.name.substring(0, 3).toLowerCase()}${formData.surname.toLowerCase()}`
        : '-';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingId ? "Editar usuario" : "Agregar usuario"} width="max-w-3xl">
            <div className="space-y-4">
                {/* Row 1: Name, Surname, Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Input label="Nombre" name="name" value={formData.name} onChange={onInputChange} placeholder="Ej: Fermin" />
                    <Input label="Apellido" name="surname" value={formData.surname} onChange={onInputChange} placeholder="Ej: Ahumada" />

                    <Combobox
                        label="Rol"
                        options={ROLE_OPTIONS}
                        value={formData.role}
                        onChange={(val) => onFieldChange('role', val)}
                        placeholder="Seleccionar rol"
                        searchable={false}
                    />
                </div>

                {/* Row 2: Type, DOB, DNI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Combobox
                        label="Tipo"
                        options={TYPE_OPTIONS}
                        value={formData.type}
                        onChange={(val) => onFieldChange('type', val)}
                        placeholder="Seleccionar tipo"
                        searchable={false}
                    />

                    <DatePicker
                        label="Fecha de nacimiento"
                        value={formData.birthDate}
                        onChange={(val) => onFieldChange('birthDate', val)}
                        placeholder="Seleccionar fecha"
                    />

                    <Input label="DNI" name="dni" value={formData.dni} onChange={onInputChange} placeholder="Sin puntos" />
                </div>

                {/* Row 3: Email, Sector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Correo" name="email" value={formData.email} onChange={onInputChange} placeholder="usuario@med.cli" />
                    <Input label="Sector" name="sector" value={formData.sector} onChange={onInputChange} placeholder="Ej: Clínica Médica" />
                </div>

                {/* Row 4: Service (full width) */}
                <Combobox
                    label="Servicio"
                    options={SERVICE_OPTIONS}
                    value={formData.service}
                    onChange={(val) => onFieldChange('service', val)}
                    placeholder="Seleccionar servicio"
                />

                {/* CV Upload Section */}
                <div className="w-full">
                    {editingId ? (
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Curriculum Vitae</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    type="button"
                                    onClick={onFetchCV}
                                    disabled={isLoadingCV}
                                    variant="outline"
                                    className="flex-1 h-10 gap-2 border-[#135D54] text-[#135D54] hover:bg-[#135D54]/5 font-bold text-sm"
                                >
                                    {isLoadingCV ? <Loader2 className="animate-spin" size={18} /> : <Eye size={18} />}
                                    {isLoadingCV ? "Cargando..." : "Ver CV Actual"}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="ghost"
                                    className="h-10 px-4 border border-gray-200 text-gray-500 text-[11px]"
                                >
                                    <Upload size={14} className="mr-2" />
                                    Actualizar PDF
                                </Button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} accept=".pdf" />
                            </div>
                            {fileName && (
                                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <FileText size={12} /> Nuevo archivo seleccionado: {fileName}
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} accept=".pdf" />
                            <Button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                className="w-full h-auto py-3 border-dashed border-2 hover:bg-gray-50 flex-col gap-1.5"
                            >
                                {fileName ? (
                                    <div className="flex items-center gap-2 text-[#135D54]">
                                        <FileText size={18} />
                                        <span className="truncate max-w-[200px] font-medium text-sm">{fileName}</span>
                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded ml-2">Cambiar archivo</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={18} className="text-gray-400" />
                                        <span className="text-gray-600 text-sm">Click para subir CV (PDF Obligatorio)</span>
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>

                {/* System Credentials */}
                <div className="bg-[#EAF4F4]/50 p-3 sm:p-4 rounded-2xl border border-[#135D54]/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Lock size={32} className="text-[#135D54]" />
                    </div>

                    <h4 className="font-bold text-[#135D54] mb-3 text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={12} />
                        Credenciales del sistema
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 relative z-10">
                        <div className="space-y-1">
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Identificador (Usuario)</span>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-900 font-mono font-bold bg-white px-2 py-1 rounded shadow-sm border border-gray-100">{generatedUsername}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                                {formData.status === 'Pendiente' ? 'Código de Acceso Inicial' : 'Clave de Seguridad'}
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-3 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                                    <span className="text-gray-900 font-mono font-bold text-sm">
                                        {formData.status === 'Pendiente' || showPassword
                                            ? formData.password
                                            : '••••••••'
                                        }
                                    </span>
                                    {formData.status !== 'Pendiente' && (
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-gray-400 hover:text-[#135D54] transition-colors"
                                        >
                                            {showPassword ? <Eye size={14} /> : <Eye size={14} className="opacity-50" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {formData.status === 'Activo' && (
                                <div className="flex flex-col gap-1 mt-2">
                                    <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Cuenta Validada y Activa
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium italic">
                                        El profesional ya estableció su propia contraseña privada.
                                    </span>
                                    {showPassword && formData.password.length > 20 && (
                                        <span className="text-[9px] text-amber-600 font-mono mt-1 break-all bg-amber-50 p-1 rounded">
                                            Hash: {formData.password.substring(0, 20)}...
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-gray-100">
                    <Button variant="outline" className="flex-1 h-10" onClick={onClose}>Cancelar</Button>
                    <Button
                        className="flex-1 h-10 bg-[#135D54] hover:bg-[#0f4a43] font-bold"
                        onClick={handleInternalSave}
                        disabled={loading || !isFormValid}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        {editingId ? "Actualizar cambios" : "Crear usuario"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
