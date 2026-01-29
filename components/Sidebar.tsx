
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, Role } from '../types';
import { logoutUser, getData } from '../db';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  CalendarPlus, 
  ClipboardList, 
  UserCheck, 
  GraduationCap, 
  MessageSquare, 
  BarChart3, 
  Users, 
  FileVolume, 
  Settings as SettingsIcon, 
  Megaphone,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const db = getData();
  
  // Dynamic permissions from DB
  const rolePermissions = db.settings?.rolePermissions?.[user.role] || [];
  const logo = db.settings?.logo;

  const handleLogout = () => {
    logoutUser();
    onLogout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Availability', path: '/availability', icon: <CalendarCheck size={20} /> },
    { name: 'Create Ad Hoc', path: '/ad-hoc-events', icon: <CalendarPlus size={20} /> },
    { name: 'Roster', path: '/roster', icon: <ClipboardList size={20} /> },
    { name: 'Attendance', path: '/attendance', icon: <UserCheck size={20} /> },
    { name: 'Training', path: '/training', icon: <GraduationCap size={20} /> },
    { name: 'Feedback', path: '/feedback', icon: <MessageSquare size={20} /> },
    { name: 'Reports', path: '/reports', icon: <BarChart3 size={20} /> },
    { name: 'Volunteers', path: '/volunteers', icon: <Users size={20} /> },
    { name: 'Sound Docs', path: '/all-things-sound', icon: <FileVolume size={20} /> },
    { name: 'Announcement', path: '/create-announcement', icon: <Megaphone size={20} /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  const filteredMenu = menuItems.filter(item => rolePermissions.includes(item.name));

  return (
    <>
      <button className="fixed top-4 left-4 z-50 md:hidden p-2 bg-slate-900 text-white rounded-md" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 text-slate-300 z-40 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full border-2 border-brand overflow-hidden flex items-center justify-center bg-slate-800">
              {logo ? <img src={logo} alt="CRC" className="w-full h-full object-contain p-1" /> : (user.profilePicture ? <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" /> : <span className="font-bold text-white text-lg">CRC</span>)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white text-sm truncate">{user.name} {user.surname}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{user.role}</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 space-y-1 py-2">
            {filteredMenu.map(item => (
              <NavLink key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-brand-light text-brand font-medium' : 'hover:bg-slate-800 hover:text-white'}`}>
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-400">
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;