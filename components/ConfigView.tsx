
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, ChevronDown, SquarePen, Trash2, X, Upload, Loader2, FileText, Eye, Lock } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Loader } from './ui/Loader';
import { User, NewUserForm } from '../types';

const generateRandomCode = () => Math.floor(10000000 + Math.random() * 90000000).toString();

export const ConfigView: React.FC = () => {
  const [showAddUser, setShowAddUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showCVViewer, setShowCVViewer] = useState(false);
  const [cvPdfUrl, setCvPdfUrl] = useState<string | null>(null);
  const [isLoadingCV, setIsLoadingCV] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<NewUserForm>({
    name: '', surname: '', password: '', type: '', birthDate: '', dni: '', email: '', service: '', role: '', sector: ''
  });

  const fetchUsers = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6a07ae950e5b42e0af0673e2a03e376b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=T6xYIqivUbpY4DaWw1lHE9C7Jwz7IK0sPPcszU6o4xg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result && result.data && Array.isArray(result.data)) {
        const mappedUsers: User[] = result.data.map((item: any) => ({
          id: item.ID.toString(),
          name: item.Nombre_US || '',
          surname: item.Apellido_US || '',
          birthDate: item.FechaNac_US || '',
          sector: item.Sector_US || '',
          type: item.TipoM_US || '',
          dni: item.DNI_US || '',
          email: item.Correo_US || '',
          service: item.Servicio_US || '',
          role: item.TipoPerfil_US || ''
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor, selecciona un archivo PDF válido.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64 = base64String.split(',')[1];
        setFileContent(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchCV = async () => {
    if (!editingId) {
        console.error("No editingId found");
        return;
    }
    setIsLoadingCV(true);
    console.log("Fetching CV for ID:", editingId);
    try {
      const response = await fetch('https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/bb29ae12f713489d8ce7500dc2fbe30a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=9tk-sipjdbPexfWm5NJJWh4pKx_kDxKBr-e5I6p6c9c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ID: editingId }),
      });
      
      const result = await response.json();
      console.log("CV Fetch Result:", result);
      
      if (result && result.base64) {
         try {
            const binaryString = window.atob(result.base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const pdfDataUrl = URL.createObjectURL(blob);
            setCvPdfUrl(pdfDataUrl);
            setShowCVViewer(true);
         } catch (e) {
             console.error("Error converting base64 to PDF:", e);
             alert("Error al procesar el archivo PDF.");
         }
      } else {
         console.error("CV Fetch failed: No base64 data", result);
         alert("No se pudo recuperar el CV. Verifique que el usuario tenga un CV cargado.");
      }
    } catch (error) {
      console.error("Error fetching CV:", error);
      alert("Ocurrió un error al intentar obtener el CV.");
    } finally {
      setIsLoadingCV(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ 
        name: '', 
        surname: '', 
        password: generateRandomCode(), 
        type: '', 
        birthDate: '', 
        dni: '', 
        email: '', 
        service: '', 
        role: '', 
        sector: '' 
    });
    setFileName(null);
    setFileContent(null);
    if (cvPdfUrl) {
        URL.revokeObjectURL(cvPdfUrl);
    }
    setCvPdfUrl(null);
    setShowAddUser(true);
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    
    // Convertir DD/MM/YYYY a YYYY-MM-DD para el input date
    let formattedDate = '';
    if (user.birthDate) {
        const parts = user.birthDate.split('/');
        if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    setFormData({
      name: user.name,
      surname: user.surname,
      password: generateRandomCode(), // Generate new random code even on edit as per request
      type: user.type,
      birthDate: formattedDate,
      dni: user.dni || '',
      email: user.email || '',
      service: user.service || '',
      role: user.role === 'RH' ? 'User' : user.role || '',
      sector: user.sector
    });
    
    setFileName(null);
    setFileContent(null);
    if (cvPdfUrl) {
        URL.revokeObjectURL(cvPdfUrl);
    }
    setCvPdfUrl(null);
    setShowAddUser(true);
  };

  const handleClose = () => {
    setShowAddUser(false);
    setEditingId(null);
    setFormData({ name: '', surname: '', password: '', type: '', birthDate: '', dni: '', email: '', service: '', role: '', sector: '' });
    setFileName(null);
    setFileContent(null);
    if (cvPdfUrl) {
        URL.revokeObjectURL(cvPdfUrl);
    }
    setCvPdfUrl(null);
  };

  const handleSave = async () => {
    setLoading(true);
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
        DNI: formData.dni,
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

    // Solo enviamos el ID si estamos editando
    if (editingId) {
        payload.ID = parseInt(editingId);
    }

    // Solo enviamos el archivo si se cargó uno nuevo
    if (fileContent) {
        payload.FileName = fileName;
        payload.FileContent = fileContent;
    }

    try {
        const response = await fetch('https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a43b8cdf5dbf4f6f83e4956eaacb3d5d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=rl5wn8Q3s4fg2pLzpD0HoS1uurNrA4rBeQt6-FIwwUQ', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            await fetchUsers();
            handleClose();
        } else {
            console.error("Error saving user:", await response.text());
        }
    } catch (error) {
        console.error("Network error saving user:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteClick = (user: User) => setUserToDelete(user);

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      setLoading(true);
      try {
        await fetch('https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/226a7985952948e9b95d3b4ed25ce51d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=AXIfvtbtimfbFIucdStiyOvE_wzn2zgf5XKzr3CVcEU', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ID: parseInt(userToDelete.id) }),
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      } finally {
        setLoading(false);
        setUserToDelete(null); 
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) || 
      user.surname.toLowerCase().includes(searchLower)
    );
  });

  const generatedUsername = (formData.name && formData.surname) 
    ? `${formData.name.substring(0, 3).toLowerCase()}${formData.surname.toLowerCase()}`
    : '-';

  // Al editar, no es obligatorio el archivo si ya existe uno en el sistema
  const isFormValid = formData.name && formData.surname && formData.email && formData.dni && formData.sector && (editingId ? true : !!fileContent);

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] p-4 lg:p-6 w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">Configuración</h1>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Button onClick={handleOpenAdd} className="bg-[#135D54] hover:bg-[#0f4a43] gap-2 rounded-lg shadow-md" size="sm">
            <Plus size={18} />
            Agregar
          </Button>

           <div className="relative group min-w-[140px]">
              <div className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-between cursor-pointer hover:border-[#135D54] transition-colors text-sm font-medium h-9">
                 <span>Usuarios</span>
                 <ChevronDown size={14} className="text-gray-400" />
              </div>
           </div>

          <div className="relative w-full sm:w-64">
             <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Buscar usuarios..." 
               className="pl-9 pr-4 h-9 rounded-lg border border-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-[#135D54] bg-white text-sm transition-all" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 relative">
        {isFetching ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <Loader text="Cargando usuarios..." />
            </div>
        ) : (
            <div className="overflow-x-auto flex-1">
            <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50/80 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Nac.</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sector</th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="py-4 px-6 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#135D54]/10 text-[#135D54] flex items-center justify-center text-xs font-bold">
                                    {user.name.charAt(0)}{user.surname.charAt(0)}
                                </div>
                                {user.surname}, {user.name}
                            </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500">{user.birthDate}</td>
                        <td className="py-4 px-6 text-sm text-gray-500">{user.sector}</td>
                        <td className="py-4 px-6 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {user.type}
                            </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                className="p-2 text-gray-400 hover:text-[#135D54] hover:bg-[#135D54]/10 rounded-full transition-colors"
                                onClick={() => handleEdit(user)}
                                title="Editar"
                            >
                            <SquarePen size={16} />
                            </button>
                            <button 
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                onClick={() => handleDeleteClick(user)}
                                title="Eliminar"
                            >
                            <Trash2 size={16} />
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                        No se encontraron usuarios que coincidan con la búsqueda.
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      <Modal isOpen={showAddUser} onClose={handleClose} title={editingId ? "Editar usuario" : "Agregar usuario"} width="max-w-3xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Input label="Nombre" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: Fermin" />
            <Input label="Apellido" name="surname" value={formData.surname} onChange={handleInputChange} placeholder="Ej: Ahumada" />
            
            <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-gray-700">Rol</label>
                <div className="relative">
                    <select 
                        name="role"
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135D54] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        value={formData.role}
                        onChange={handleInputChange}
                    >
                        <option value="">Seleccionar</option>
                        <option value="Admin">Admin</option>
                        <option value="Medico">Medico</option>
                        <option value="User">RH</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>

            <div className="relative group">
                <Input 
                    label="Código de Acceso" 
                    name="password" 
                    type="password"
                    value={formData.password} 
                    readOnly 
                    className="h-10 bg-gray-50 border-gray-200 text-gray-500 font-mono font-bold cursor-not-allowed" 
                />
                <div className="absolute right-3 top-[38px] text-gray-400">
                    <Lock size={14} />
                </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-gray-700">Tipo</label>
                <div className="relative">
                    <select 
                        name="type"
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135D54] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        value={formData.type}
                        onChange={handleInputChange}
                    >
                        <option value="">Seleccionar</option>
                        <option value="Fijo">Fijo</option>
                        <option value="Suplente">Suplente</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>

             <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-gray-700">Fecha de nacimiento</label>
                <input 
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135D54] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <Input label="DNI" name="dni" value={formData.dni} onChange={handleInputChange} placeholder="Sin puntos" />
            <Input label="Correo" name="email" value={formData.email} onChange={handleInputChange} placeholder="usuario@med.cli" />
            <Input label="Sector" name="sector" value={formData.sector} onChange={handleInputChange} placeholder="Ej: Clínica Médica" />
          </div>
          
           <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-gray-700">Servicio</label>
                <div className="relative">
                    <select 
                        name="service"
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135D54] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        value={formData.service}
                        onChange={handleInputChange}
                    >
                        <option value="">Seleccionar</option>
                        <option value="Cardiología">Cardiología</option>
                        <option value="Pediatría">Pediatría</option>
                        <option value="Clínica Médica">Clínica Médica</option>
                        <option value="Traumatología">Traumatología</option>
                        <option value="General">General</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>

          <div className="w-full">
            {editingId ? (
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium leading-none text-gray-700">Curriculum Vitae</label>
                    <div className="flex gap-3">
                        <Button 
                            type="button"
                            onClick={fetchCV}
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
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf" />
                    </div>
                    {fileName && (
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                           <FileText size={12} /> Nuevo archivo seleccionado: {fileName}
                        </p>
                    )}
                </div>
            ) : (
                <>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf" />
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

          <div className="bg-[#EAF4F4]/50 p-4 rounded-lg border border-[#135D54]/10">
             <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#135D54]"></div>
                Credenciales del sistema
             </h4>
             <div className="text-sm grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Usuario</span>
                    <span className="font-medium text-gray-900 font-mono">{generatedUsername}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Código de Acceso (Password)</span>
                    <span className="font-medium text-[#135D54] font-mono font-bold tracking-wider">
                        ••••••••
                    </span>
                </div>
             </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <Button variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
            <Button 
                className="flex-1 bg-[#135D54] hover:bg-[#0f4a43]"
                onClick={handleSave} 
                disabled={loading || !isFormValid}
            >
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                {editingId ? "Actualizar cambios" : "Crear usuario"}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="Eliminar usuario" width="max-w-sm">
        <div className="space-y-4">
           <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-4">
             <p>¿Estás seguro de que deseas eliminar a <strong>{userToDelete?.surname}, {userToDelete?.name}</strong>?</p>
             <p className="mt-1 font-medium">Esta acción no se puede deshacer.</p>
           </div>
           <div className="flex gap-3">
             <Button variant="outline" className="flex-1" onClick={() => setUserToDelete(null)} disabled={loading}>Cancelar</Button>
             <Button variant="danger" className="flex-1" onClick={handleConfirmDelete} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Eliminar definitivamente"}
             </Button>
           </div>
        </div>
      </Modal>

      {/* CV Viewer Modal */}
      <Modal isOpen={showCVViewer} onClose={() => setShowCVViewer(false)} title="Visualizador de CV" width="max-w-5xl" zIndex={60}>
         <div className="flex flex-col gap-4">
            <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200 h-[70vh]">
                {cvPdfUrl ? (
                    <iframe 
                        src={cvPdfUrl}
                        className="w-full h-full border-none"
                        title="Visor PDF"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No hay documento para mostrar
                    </div>
                )}
            </div>
            <div className="flex justify-end">
                <Button onClick={() => setShowCVViewer(false)}>Cerrar Ventana</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};
