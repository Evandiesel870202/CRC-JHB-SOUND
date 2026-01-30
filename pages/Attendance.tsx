
import React, { useState, useMemo, useEffect } from 'react';
import { getAuthUser, getData, saveData } from '../db';
import { User, City, Role, AttendanceRecord, AdHocEvent, Station, Availability } from '../types';
import { 
  Check, 
  X, 
  Calendar, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Music,
  ChevronDown,
  ChevronUp,
  Save,
  MapPin
} from 'lucide-react';

const Attendance: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  
  const [view, setView] = useState<'Standard' | 'AdHoc'>('Standard');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedCity, setSelectedCity] = useState<City>(user?.city || City.JHB);
  const [activeSession, setActiveSession] = useState<{ date: string; time: string; type: 'Sunday' | 'Thursday' | 'AdHoc' } | null>(null);

  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;
  const isLeader = useMemo(() => {
    return [Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER, Role.TWO_IC].includes(user?.role!) || user?.adminEnabled;
  }, [user]);

  // Generate Thursday and Sunday dates for the selected month
  const weekDatesToDisplay = useMemo(() => {
    if (view !== 'Standard') return [];
    const dates: { date: Date; type: 'Thursday' | 'Sunday' }[] = [];
    const year = new Date().getFullYear();
    const date = new Date(year, selectedMonth, 1);
    
    while (date.getMonth() === selectedMonth) {
      if (date.getDay() === 0) { // Sunday
        const thu = new Date(date);
        thu.setDate(date.getDate() - 3);
        dates.push({ date: thu, type: 'Thursday' });
        dates.push({ date: new Date(date), type: 'Sunday' });
      }
      date.setDate(date.getDate() + 1);
    }
    return dates.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [view, selectedMonth]);

  const adHocEvents = useMemo(() => {
    return db.adHocEvents.filter((e: AdHocEvent) => e.city === selectedCity);
  }, [db.adHocEvents, selectedCity]);

  const getTimesForCity = (city: City) => {
    if (city === City.JHB) return ['09:30', '18:00'];
    return ['08:30', '11:00', '18:00'];
  };

  const monthName = new Date(new Date().getFullYear(), selectedMonth, 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Attendance Tracker</h1>
            <p className="text-slate-500 text-sm">Real-time presence capture for campus teams</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {isSuperAdmin && (
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {Object.values(City).map(c => (
                  <button 
                    key={c}
                    onClick={() => { setSelectedCity(c); setActiveSession(null); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedCity === c ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => { setView('Standard'); setActiveSession(null); }}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'Standard' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Services
              </button>
              <button 
                onClick={() => { setView('AdHoc'); setActiveSession(null); }}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'AdHoc' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Ad Hoc
              </button>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {view === 'Standard' ? (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 col-span-1">
              <button 
                onClick={() => setSelectedMonth(prev => (prev === 0 ? 11 : prev - 1))}
                className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-brand transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{monthName} {new Date().getFullYear()}</span>
              </div>
              <button 
                onClick={() => setSelectedMonth(prev => (prev === 11 ? 0 : prev + 1))}
                className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-brand transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            <div className="md:col-span-2">
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20"
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
              >
                <option value="">Select Ad Hoc Event...</option>
                {adHocEvents.map(e => <option key={e.id} value={e.id}>{e.name} ({e.city})</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {view === 'Standard' ? (
            weekDatesToDisplay.map(({ date, type }) => {
              const dateStr = date.toISOString().split('T')[0];
              const isSunday = type === 'Sunday';
              const isActive = activeSession?.date === dateStr && activeSession?.type === type;

              return (
                <div key={`${dateStr}-${type}`} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/30 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center shadow-sm border ${isSunday ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-900 text-white'}`}>
                        <span className={`text-[8px] font-black uppercase ${isSunday ? 'text-slate-400' : 'text-slate-500'}`}>{date.toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-lg font-black leading-tight">{date.getDate()}</span>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800">{date.toLocaleDateString('en-US', { weekday: 'long' })}</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          {isSunday ? <Users size={12}/> : <Music size={12}/>} 
                          {isSunday ? 'Service Sessions' : 'City Rehearsal'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isSunday ? (
                        getTimesForCity(selectedCity).map(time => {
                          const isSessActive = activeSession?.date === dateStr && activeSession?.time === time;
                          return (
                            <button
                              key={time}
                              onClick={() => setActiveSession(isSessActive ? null : { date: dateStr, time, type: 'Sunday' })}
                              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                                isSessActive ? 'bg-brand text-white border-brand shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-brand/30'
                              }`}
                            >
                              {time}
                              {isLeader && (isSessActive ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
                            </button>
                          );
                        })
                      ) : (
                        <button
                          onClick={() => setActiveSession(isActive ? null : { date: dateStr, time: 'Thursday Rehearsal', type: 'Thursday' })}
                          className={`px-6 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                            isActive ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          {isActive ? 'Close List' : 'Capture Rehearsal'}
                          {isLeader && (isActive ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Single Save Action Panel */}
                  {activeSession && activeSession.date === dateStr && activeSession.type === type && isLeader && (
                    <div className="mt-6 p-6 bg-white rounded-2xl border border-slate-200 animate-in slide-in-from-top-4 shadow-sm">
                      <TeamCapturePanel 
                        session={activeSession} 
                        city={selectedCity}
                        onClose={() => setActiveSession(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="space-y-4">
              {selectedEventId ? (
                db.adHocEvents.find((e: any) => e.id === selectedEventId)?.sessions.map((session: any) => {
                  const isActive = activeSession?.date === session.date && activeSession?.time === session.time;
                  return (
                    <div key={session.id} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/30">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white rounded-xl border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                              <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(session.date).toLocaleString('default', { month: 'short' })}</span>
                              <span className="text-lg font-black text-slate-700 leading-tight">{new Date(session.date).getDate()}</span>
                            </div>
                            <div>
                              <h4 className="font-black text-slate-800">{new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' })}</h4>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{session.time} Session</p>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setActiveSession(isActive ? null : { date: session.date, time: session.time, type: 'AdHoc' })}
                            className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                              isActive ? 'bg-brand text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:border-brand/30'
                            }`}
                          >
                            <Users size={16} />
                            {isActive ? 'Close List' : 'Capture Session'}
                          </button>
                       </div>

                       {isActive && isLeader && (
                         <div className="mt-6 p-6 bg-white rounded-2xl border border-slate-200 animate-in slide-in-from-top-4">
                            <TeamCapturePanel 
                              session={activeSession} 
                              city={selectedCity}
                              onClose={() => setActiveSession(null)}
                            />
                         </div>
                       )}
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Calendar className="mx-auto text-slate-200 mb-4" size={48} />
                  <p className="text-slate-400 font-bold">Select an event to start capturing attendance.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TeamCapturePanel: React.FC<{
  session: any;
  city: City;
  onClose: () => void;
}> = ({ session, city, onClose }) => {
  const user = getAuthUser();
  const db = getData();
  const [searchTerm, setSearchTerm] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<'North' | 'South' | 'All'>(city === City.BFN ? 'All' : 'All');
  
  // Track status changes locally before saving
  const [sessionAttendance, setSessionAttendance] = useState<Record<string, { status: 'Present' | 'Absent', building?: 'North' | 'South' } | undefined>>({});

  useEffect(() => {
    // Initialize local state from existing DB records
    const initial: Record<string, { status: 'Present' | 'Absent', building?: 'North' | 'South' } | undefined> = {};
    const currentDb = getData();
    // Use proper array check and explicit casting to fix "unknown" type error on currentDb.attendance items
    if (currentDb.attendance && Array.isArray(currentDb.attendance)) {
      currentDb.attendance.forEach((a: AttendanceRecord) => {
        if (a.date === session.date && a.time === session.time) {
          initial[a.userId] = { status: a.status, building: a.building };
        }
      });
    }
    setSessionAttendance(initial);
  }, [session.date, session.time]);

  const volunteers = useMemo(() => {
    return db.users.filter((u: User) => {
      if (u.city !== city) return false;
      
      // If BFN and auditorium filter is active, filter by user's assigned building
      if (city === City.BFN && buildingFilter !== 'All') {
        if (u.building !== buildingFilter) return false;
      }

      const fullName = `${u.name} ${u.surname}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [db.users, city, searchTerm, buildingFilter]);

  // Determine availability indicators (Y)
  const availableUserIds = useMemo(() => {
    return new Set(
      db.availability
        .filter((av: Availability) => av.date === session.date && av.timeSlot === session.time && av.isAvailable)
        .map((av: Availability) => av.userId)
    );
  }, [db.availability, session.date, session.time]);

  const handleToggle = (userId: string, newStatus: 'Present' | 'Absent') => {
    setSessionAttendance(prev => {
      const current = prev[userId];
      const updated = { ...prev };
      
      if (current?.status === newStatus) {
        // Toggle off if same button clicked
        delete updated[userId];
      } else {
        // Find the user to get their building
        const v = db.users.find((u: User) => u.id === userId);
        // Set to new status
        updated[userId] = { 
          status: newStatus, 
          building: city === City.BFN ? (v?.building || (buildingFilter !== 'All' ? buildingFilter : 'North')) : undefined 
        };
      }
      return updated;
    });
  };

  const handleFinalSave = () => {
    const dbData = getData();
    
    // 1. Remove all current records for this session to prepare for clean overwrite
    dbData.attendance = dbData.attendance.filter((a: AttendanceRecord) => 
      !(a.date === session.date && a.time === session.time)
    );

    // 2. Map local state to persistent database format
    // Fix: Cast entries values to avoid "unknown" type error
    (Object.entries(sessionAttendance) as [string, any][]).forEach(([userId, data]) => {
      if (data) {
        dbData.attendance.push({
          id: Math.random().toString(36).substr(2, 9),
          userId,
          date: session.date,
          time: session.time,
          type: session.type,
          status: data.status,
          building: data.building,
          capturedBy: user?.id!
        });
      }
    });

    // 3. Persist to storage
    saveData(dbData);
    alert('Attendance data has been saved.');
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Attendance Checklist</h4>
          <p className="text-[10px] text-slate-400 font-bold">{session.time} Session • {new Date(session.date).toLocaleDateString()}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-2xl justify-end">
          {city === City.BFN && (
             <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
               {(['All', 'North', 'South'] as const).map(b => (
                 <button 
                   key={b}
                   onClick={() => setBuildingFilter(b)}
                   className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${buildingFilter === b ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   {b === 'All' ? 'All Auditoriums' : b}
                 </button>
               ))}
             </div>
          )}
          
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input 
              placeholder="Search name..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand/20"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-slate-50 px-1">
        {volunteers.map(v => {
          const data = sessionAttendance[v.id];
          const status = data?.status;
          const isScheduled = availableUserIds.has(v.id);

          return (
            <div key={v.id} className="py-3 flex items-center justify-between gap-4 group">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center font-black uppercase text-[10px] border shrink-0 transition-colors ${status === 'Present' ? 'bg-green-600 border-green-600 text-white' : status === 'Absent' ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  {v.name[0]}{v.surname[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 text-sm leading-tight truncate">{v.name} {v.surname}</p>
                    {isScheduled && (
                      <span className="bg-slate-800 text-white text-[7px] font-black px-1 rounded uppercase tracking-tighter shrink-0">Scheduled</span>
                    )}
                    {city === City.BFN && v.building && (
                      <span className="bg-slate-100 text-slate-500 text-[7px] font-black px-1 rounded uppercase tracking-tighter shrink-0 flex items-center gap-0.5">
                        <MapPin size={8}/> {v.building}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate">{v.primaryStation} • {v.role}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleToggle(v.id, 'Absent')}
                  className={`p-2.5 rounded-xl transition-all border ${status === 'Absent' ? 'bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-100' : 'bg-slate-100 text-slate-400 border-slate-100 hover:text-red-500 hover:bg-red-50'}`}
                  title="Mark Absent"
                >
                  <X size={18} />
                </button>
                <button 
                  onClick={() => handleToggle(v.id, 'Present')}
                  className={`p-2.5 rounded-xl transition-all border ${status === 'Present' ? 'bg-green-600 text-white border-green-700 shadow-md ring-2 ring-green-100' : 'bg-slate-100 text-slate-400 border-slate-100 hover:text-green-500 hover:bg-green-50'}`}
                  title="Mark Present"
                >
                  <Check size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
          {/* Fix: Cast Object.values to any[] to fix "unknown" type error on .filter parameter */}
          <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500"/> {(Object.values(sessionAttendance) as any[]).filter(s => s?.status === 'Present').length} Present</span>
          <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-500"/> {(Object.values(sessionAttendance) as any[]).filter(s => s?.status === 'Absent').length} Absent</span>
        </div>
        <button 
          onClick={handleFinalSave}
          className="w-full py-4 bg-brand text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand/20 hover:scale-[1.01] transition-all active:scale-95"
        >
          <Save size={18} /> Save and Finalize Session
        </button>
      </div>
    </div>
  );
};

export default Attendance;
