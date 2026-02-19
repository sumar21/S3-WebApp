import React from 'react';
import { Upload, Loader2, FileText, Eye } from 'lucide-react';
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
    onSave: () => void;
    loading: boolean;
    fileInputRef: React.RefObject<HTMLInputElement>;
    fileName: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFetchCV: () => void;
    isLoadingCV: boolean;
    isFormValid: boolean;
}

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
    onSave,
    loading,
    fileInputRef,
    fileName,
    onFileChange,
    onFetchCV,
    isLoadingCV,
    isFormValid,
}) => {
    const generatedUsername = (formData.name && formData.surname)
        ? `${formData.name.substring(0, 3).toLowerCase()}${formData.surname.toLowerCase()}`
        : '-';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingId ? "Editar usuario" : "Agregar usuario"} width="max-w-3xl">
            <div className="space-y-5">
                {/* Row 1: Name, Surname, Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium leading-none text-gray-700">Curriculum Vitae</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    type="button"
                                    onClick={onFetchCV}
                                    disabled={isLoadingCV}
                                    variant="outline"
                                    className="flex-1 h-12 gap-2 border-[#135D54] text-[#135D54] hover:bg-[#135D54]/5 font-bold"
                                >
                                    {isLoadingCV ? <Loader2 className="animate-spin" size={20} /> : <Eye size={20} />}
                                    {isLoadingCV ? "Cargando..." : "Ver CV Actual"}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="ghost"
                                    className="h-12 px-4 border border-gray-200 text-gray-500 text-xs"
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
                                className="w-full h-auto py-4 border-dashed border-2 hover:bg-gray-50 flex-col gap-2"
                            >
                                {fileName ? (
                                    <div className="flex items-center gap-2 text-[#135D54]">
                                        <FileText size={20} />
                                        <span className="truncate max-w-[200px] font-medium">{fileName}</span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded ml-2">Cambiar archivo</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={20} className="text-gray-400" />
                                        <span className="text-gray-600">Click para subir CV (PDF Obligatorio)</span>
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>

                {/* System Credentials */}
                <div className="bg-[#EAF4F4]/50 p-3 sm:p-4 rounded-lg border border-[#135D54]/10">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#135D54]"></div>
                        Credenciales del sistema
                    </h4>
                    <div className="text-sm">
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs">Usuario</span>
                            <span className="font-medium text-gray-900 font-mono">{generatedUsername}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-100">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
                    <Button
                        className="flex-1 bg-[#135D54] hover:bg-[#0f4a43]"
                        onClick={onSave}
                        disabled={loading || !isFormValid}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                        {editingId ? "Actualizar cambios" : "Crear usuario"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
