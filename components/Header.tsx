
import React, { useRef } from 'react';
import { User } from '../types';
import { Bell, User as UserIcon, Camera } from 'lucide-react';
import { getData, saveData, loginUser } from '../db';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const db = getData();
        const updatedUser = { ...user, profilePicture: base64 };
        
        db.users = db.users.map((u: any) => u.id === user.id ? updatedUser : u);
        saveData(db);
        loginUser(updatedUser);
        window.location.reload();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="hidden md:block">
        <h1 className="text-lg font-semibold text-slate-800">Welcome, {user.name}</h1>
        <p className="text-xs text-slate-500 font-medium">{user.role} &bull; {user.city}</p>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Bell size={20} />
        </button>
        
        <div className="h-8 w-px bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700 leading-tight">{user.name} {user.surname}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user.city} Campus</p>
          </div>
          <div 
            onClick={handleProfileClick}
            className="group relative h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 cursor-pointer overflow-hidden transition-all hover:border-brand"
          >
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={20} />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={14} className="text-white" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;