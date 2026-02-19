
import React, { useState } from 'react';
import { Calendar, Settings, LogOut } from 'lucide-react';
import { ViewState } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'config', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="w-20 lg:w-64 bg-white border-r border-gray-200 h-full flex flex-col shadow-sm z-30 transition-all duration-300">
      {/* Logo Area */}
      <div className="h-16 lg:h-20 flex items-center justify-center lg:justify-start px-0 lg:px-6 border-b border-gray-100/80">
        <div className="flex items-center gap-3 text-[#135D54]">
          <div className="w-10 h-10 rounded-lg bg-[#135D54]/10 flex items-center justify-center shrink-0">
             <img 
                src="https://placehold.co/100x100/135D54/ffffff?text=S3" 
                alt="S3 Logo" 
                className="h-6 w-6 object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight hidden lg:block">S3</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ViewState)}
              className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-md transition-all duration-200 font-medium group relative ${
                isActive
                  ? 'bg-[#135D54]/10 text-[#135D54] shadow-none'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={22} className={isActive ? 'text-[#135D54]' : 'text-gray-500 group-hover:text-gray-900'} />
              <span className="hidden lg:block text-sm">{item.label}</span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#135D54] rounded-r-full lg:hidden"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          <span className="hidden lg:block text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        title="Cerrar sesión" 
        width="max-w-sm"
      >
        <div className="space-y-6">
           <p className="text-gray-600 text-sm">
             ¿Estás seguro de que deseas cerrar la sesión actual? Deberás ingresar tus credenciales nuevamente.
           </p>
           <div className="flex gap-3">
             <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setShowLogoutModal(false)}
             >
                Cancelar
             </Button>
             <Button 
                variant="danger"
                className="flex-1" 
                onClick={onLogout}
             >
                Cerrar sesión
             </Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};
