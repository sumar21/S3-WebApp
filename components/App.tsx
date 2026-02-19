
import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { ConfigView } from './components/ConfigView';
import { MobileView } from './components/MobileView';
import { AbsencesView } from './components/AbsencesView';
import { Loader } from './components/ui/Loader';
import { ViewState, AuthUser } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('calendar');
  const [isLoading, setIsLoading] = useState(false);

  // Handle navigation with loading transition
  const handleNavigate = (view: ViewState) => {
    setIsLoading(true);
    // Simulate loading time for smoother UX transition
    setTimeout(() => {
        setCurrentView(view);
        setIsLoading(false);
    }, 1200); 
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    handleNavigate('calendar');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  // Role based Routing
  const hasDesktopAccess = currentUser.access.includes('Desktop');
  const hasOnlyMobileAccess = currentUser.access.includes('Mobile') && !hasDesktopAccess;

  if (hasOnlyMobileAccess) {
      return <MobileView user={currentUser} onLogout={handleLogout} />;
  }

  // Default Desktop Layout
  return (
    <div className="flex h-screen w-full bg-[#F8F9FB] font-sans relative">
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout} 
      />
      
      <main className="flex-1 overflow-hidden relative">
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'absences' && <AbsencesView user={currentUser} />}
        {currentView === 'config' && <ConfigView />}
      </main>

      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-center transition-all duration-300">
             <Loader text="Preparando módulo..." />
        </div>
      )}
    </div>
  );
};

export default App;
