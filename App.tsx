
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeDB, getAuthUser, getData } from './db';
import { User, Role } from './types';

// Layout & Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Availability from './pages/Availability';
import AdHocEvents from './pages/AdHocEvents';
import Roster from './pages/Roster';
import Attendance from './pages/Attendance';
import TrainingPage from './pages/Training';
import FeedbackPage from './pages/Feedback';
import Reports from './pages/Reports';
import Volunteers from './pages/Volunteers';
import AllThingsSound from './pages/AllThingsSound';
import Settings from './pages/Settings';
import CreateAnnouncement from './pages/CreateAnnouncement';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: Role[] }> = ({ children, allowedRoles }) => {
  const user = getAuthUser();
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    initializeDB();
    const user = getAuthUser();
    setCurrentUser(user);

    // Apply Dynamic Theme
    const db = getData();
    if (db.settings?.themeColor) {
      applyTheme(db.settings.themeColor);
    }
  }, []);

  const applyTheme = (color: string) => {
    const root = document.documentElement;
    root.style.setProperty('--crc-red', color);
    
    // Generate darker hover color
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const darken = (val: number) => Math.max(0, Math.floor(val * 0.8));
    const hoverColor = `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;
    const lightColor = `rgba(${r}, ${g}, ${b}, 0.1)`;
    const shadowColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
    
    root.style.setProperty('--crc-red-hover', hoverColor);
    root.style.setProperty('--crc-red-light', lightColor);
    root.style.setProperty('--crc-red-shadow', shadowColor);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Re-apply theme on login just in case
    const db = getData();
    if (db.settings?.themeColor) applyTheme(db.settings.themeColor);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex bg-slate-50">
        {currentUser && <Sidebar user={currentUser} onLogout={handleLogout} />}
        <main className={`flex-1 flex flex-col min-w-0 ${currentUser ? 'md:ml-64' : ''}`}>
          {currentUser && <Header user={currentUser} />}
          <div className="p-4 md:p-8">
            <Routes>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/availability" element={<ProtectedRoute><Availability /></ProtectedRoute>} />
              <Route 
                path="/ad-hoc-events" 
                element={
                  <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER]}>
                    <AdHocEvents />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/roster" 
                element={
                  <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER]}>
                    <Roster />
                  </ProtectedRoute>
                } 
              />
              <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
              <Route path="/training" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
              <Route 
                path="/feedback" 
                element={
                  <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER]}>
                    <FeedbackPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER]}>
                    <Reports />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/volunteers" 
                element={
                  <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER, Role.TWO_IC]}>
                    <Volunteers />
                  </ProtectedRoute>
                } 
              />
              <Route path="/all-things-sound" element={<ProtectedRoute><AllThingsSound /></ProtectedRoute>} />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-announcement" 
                element={
                  <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER]}>
                    <CreateAnnouncement />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;