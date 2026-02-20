
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, ChevronDown, SquarePen, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Loader } from './ui/Loader';
import { ErrorMessage } from './ui/ErrorMessage';
import { User, NewUserForm } from '../types';
import { UserFormModal } from './config/UserFormModal';
import { DeleteUserModal } from './config/DeleteUserModal';
import { CVViewerModal } from './config/CVViewerModal';

const generateRandomCode = () => Math.floor(10000000 + Math.random() * 90000000).toString();

export const ConfigView: React.FC = () => {
  const [showAddUser, setShowAddUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState(false);
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
    name: '', surname: '', password: '', type: '', birthDate: '', dni: '', email: '', service: '', role: '', sector: '', status: ''
  });

  const fetchUsers = async () => {
    setIsFetching(true);
    setFetchError(false);
    try {
      const response = await fetch('https://default20435c5a4f504349a09a856bdf1f70.49.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6a07ae950e5b42e0af0673e2a03e376b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=T6xYIqivUbpY4DaWw1lHE9C7Jwz7IK0sPPcszU6o4xg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error("Network response was not ok");
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
          role: item.TipoPerfil_US || '',
          status: item.Status_USR || item.Status_US || '',
          password: item.Contrasena_USR || item.Contrasena_US || ''
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setFetchError(true);
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

  const handleFieldChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
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
      sector: '',
      status: 'Pendiente'
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
      type: user.type,
      birthDate: formattedDate,
      dni: user.dni || '',
      email: user.email || '',
      service: user.service || '',
      role: user.role === 'RH' ? 'User' : user.role || '',
      sector: user.sector,
      password: user.password || '',
      status: user.status || ''
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
    setFormData({ name: '', surname: '', password: '', type: '', birthDate: '', dni: '', email: '', service: '', role: '', sector: '', status: '' });
    setFileName(null);
    setFileContent(null);
    if (cvPdfUrl) {
      URL.revokeObjectURL(cvPdfUrl);
    }
    setCvPdfUrl(null);
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
        ) : fetchError ? (
          <div className="flex-1 flex items-center justify-center p-8 bg-white rounded-xl">
            <ErrorMessage
              message="No pudimos cargar la lista de usuarios. Verifica tu conexión e intenta de nuevo."
              onRetry={fetchUsers}
            />
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
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              {user.surname}, {user.name}
                              {user.status === 'Pendiente' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-tight">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>
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
      <UserFormModal
        isOpen={showAddUser}
        onClose={handleClose}
        editingId={editingId}
        formData={formData}
        onInputChange={handleInputChange}
        onFieldChange={handleFieldChange}
        onSuccess={fetchUsers}
        fileInputRef={fileInputRef}
        fileName={fileName}
        fileContent={fileContent}
        onFileChange={handleFileChange}
        onFetchCV={fetchCV}
        isLoadingCV={isLoadingCV}
        isFormValid={!!isFormValid}
      />

      {/* Delete Confirmation Modal */}
      <DeleteUserModal
        user={userToDelete}
        onConfirm={handleConfirmDelete}
        onClose={() => setUserToDelete(null)}
        loading={loading}
      />

      {/* CV Viewer Modal */}
      <CVViewerModal
        isOpen={showCVViewer}
        onClose={() => setShowCVViewer(false)}
        cvPdfUrl={cvPdfUrl}
      />
    </div>
  );
};
