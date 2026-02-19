import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { ConfigView } from './components/ConfigView';
import { MobileView } from './components/MobileView';
import { ViewState, AuthUser } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('calendar');
  const [isLoading, setIsLoading] = useState(false);

  // Handle fake navigation loading
  const handleNavigate = (view: ViewState) => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentView(view);
      setIsLoading(false);
    }, 800); // Simulate the loading transition seen in video
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
        {currentView === 'config' && <ConfigView />}
      </main>

      {/* Global Loading Overlay (matches video transition) */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <img
              src="https://placehold.co/200x200/135D54/ffffff?text=S3"
              alt="S3 Logo"
              className="w-20 h-20 rounded-2xl mb-4 animate-pulse object-contain shadow-md"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;