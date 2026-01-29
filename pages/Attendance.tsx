
import React, { useState, useMemo } from 'react';
import { getAuthUser, getData, saveData } from '../db';
import { User, City, Role, AttendanceRecord } from '../types';
import { Check, X, Calendar, UserCheck, Search } from 'lucide-react';

const Attendance: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  const [activeTab, setActiveTab] = useState<'Self' | 'All'>('Self');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState<'Sunday' | 'Thursday' | 'AdHoc'>('Sunday');

  const canCaptureAll = useMemo(() => {
    return [Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER].includes(user?.role!) || user?.adminEnabled;
  }, [user]);

  const volunteersToCapture = useMemo(() => {
    return db.users.filter((u: User) => {
      if (user?.role !== Role.SUPER_ADMIN && u.city !== user?.city) return false;
      const matchesSearch = (u.name + ' ' + u.surname).toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [db.users, user, searchTerm]);

  const handleCapture = (userId: string, status: 'Present' | 'Absent') => {
    const existingIdx = db.attendance.findIndex((a: AttendanceRecord) => a.userId === userId && a.date === selectedDate && a.type === sessionType);
    
    if (existingIdx >= 0) {
      db.attendance[existingIdx] = { ...db.attendance[existingIdx], status, capturedBy: user?.id! };
    } else {
      db.attendance.push({
        id: Math.random().toString(36).substr(2, 9),
        userId,
        date: selectedDate,
        type: sessionType,
        status,
        capturedBy: user?.id!
      });
    }
    saveData(db);
    alert(`Attendance updated for ${status}`);
  };

  const getStatus = (userId: string) => {
    const record = db.attendance.find((a: AttendanceRecord) => a.userId === userId && a.date === selectedDate && a.type === sessionType);
    return record?.status;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Attendance Tracker</h1>
            <p className="text-slate-500 text-sm">Capture service and rehearsal attendance</p>
          </div>
          {canCaptureAll && (
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('Self')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'Self' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Self Check-in
              </button>
              <button 
                onClick={() => setActiveTab('All')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'All' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Team List
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Service Date</label>
            <input 
              type="date" 
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Session Type</label>
            <select 
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold" 
              value={sessionType} 
              onChange={e => setSessionType(e.target.value as any)}
            >
              <option value="Sunday">Sunday Service</option>
              <option value="Thursday">Thursday Rehearsal</option>
              <option value="AdHoc">Ad Hoc Event</option>
            </select>
          </div>
        </div>

        {activeTab === 'Self' ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
              <UserCheck size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Check-in as {user?.name}</h2>
            <p className="text-slate-500 mb-8 max-w-sm">Confirm your attendance for the selected date and session type.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => handleCapture(user?.id!, 'Absent')}
                className={`px-8 py-3 rounded-xl font-bold border-2 transition-all ${getStatus(user?.id!) === 'Absent' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
              >
                Absent
              </button>
              <button 
                onClick={() => handleCapture(user?.id!, 'Present')}
                className={`px-8 py-3 rounded-xl font-bold transition-all shadow-xl ${getStatus(user?.id!) === 'Present' ? 'bg-green-600 text-white shadow-green-600/20' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20'}`}
              >
                {getStatus(user?.id!) === 'Present' ? 'Confirmed ✓' : 'I am here!'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                placeholder="Search volunteers..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="divide-y divide-slate-100">
              {volunteersToCapture.map(v => (
                <div key={v.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 border flex items-center justify-center text-slate-400 font-bold uppercase text-xs">
                      {v.name[0]}{v.surname[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{v.name} {v.surname}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{v.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleCapture(v.id, 'Absent')}
                      className={`p-2 rounded-lg transition-all ${getStatus(v.id) === 'Absent' ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      <X size={18} />
                    </button>
                    <button 
                      onClick={() => handleCapture(v.id, 'Present')}
                      className={`p-2 rounded-lg transition-all ${getStatus(v.id) === 'Present' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
