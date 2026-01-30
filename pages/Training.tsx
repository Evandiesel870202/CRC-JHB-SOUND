
import React, { useState, useMemo } from 'react';
import { getAuthUser, getData, saveData } from '../db';
import { User, City, Role, Station, Training } from '../types';
import { GraduationCap, Plus, Clock, CheckCircle, Info, Filter, MapPin, Search } from 'lucide-react';

const TrainingPage: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState<City | 'All'>(user?.role === Role.SUPER_ADMIN ? 'All' : user?.city || 'All');
  const [stationFilter, setStationFilter] = useState<Station | 'All'>('All');

  const [newTraining, setNewTraining] = useState<Partial<Training>>({
    name: '',
    city: user?.city || City.JHB,
    station: Station.GENERAL,
    startDate: '',
    dueDate: '',
    description: '',
    completions: {}
  });

  const filteredTrainings = useMemo(() => {
    return (db.training || []).filter((t: Training) => {
      // 1. City Filter (Non-super-admins restricted to their city)
      if (user?.role !== Role.SUPER_ADMIN) {
        if (t.city !== user?.city) return false;
      } else {
        if (cityFilter !== 'All' && t.city !== cityFilter) return false;
      }

      // 2. Station Filter
      if (stationFilter !== 'All' && t.station !== stationFilter) return false;

      // 3. Search Filter
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [db.training, user, cityFilter, stationFilter, searchTerm]);

  const canSchedule = [Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER].includes(user?.role!);

  const handleCreate = () => {
    if (!newTraining.name || !newTraining.startDate || !newTraining.dueDate) {
      alert("Please fill in all required fields.");
      return;
    }
    const dbData = getData();
    dbData.training.push({ ...newTraining, id: Math.random().toString(36).substr(2, 9) } as Training);
    saveData(dbData);
    setShowAdd(false);
    alert('Training successfully scheduled!');
    // Refresh page or trigger re-render by updating local state if necessary
    window.location.reload();
  };

  const toggleCompletion = (trainingId: string, userId: string) => {
    if (![Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER].includes(user?.role!)) return;
    
    const dbData = getData();
    dbData.training = dbData.training.map((t: Training) => {
      if (t.id === trainingId) {
        const completions = { ...t.completions };
        completions[userId] = !completions[userId];
        return { ...t, completions };
      }
      return t;
    });
    saveData(dbData);
    // Note: In a real app we'd use a state variable for the whole DB to trigger re-renders
    // For this prototype, we'll assume the local list handles it or use window reload if needed.
    // To be safe for this specific component, we can force a reload or just update the DB locally.
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Training Portal</h1>
            <p className="text-slate-500 text-sm">Station mastery and department training schedules</p>
          </div>
          {canSchedule && (
            <button 
              onClick={() => setShowAdd(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
            >
              <Plus size={18} /> Schedule Training
            </button>
          )}
        </div>

        {/* Search and Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              placeholder="Search training name or description..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/10 text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-[46px]">
            <MapPin size={16} className="text-slate-400" />
            <select 
              disabled={user?.role !== Role.SUPER_ADMIN}
              className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full cursor-pointer disabled:opacity-50"
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value as any)}
            >
              <option value="All">All Campuses</option>
              {Object.values(City).map(c => <option key={c} value={c}>{c} Campus</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-[46px]">
            <Filter size={16} className="text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full cursor-pointer"
              value={stationFilter}
              onChange={e => setStationFilter(e.target.value as any)}
            >
              <option value="All">All Stations</option>
              {Object.values(Station).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {showAdd && (
          <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 shadow-inner">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Create New Training Plan</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Training Title</label>
                <input placeholder="e.g. FOH Console Basics" className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm font-semibold" value={newTraining.name} onChange={e => setNewTraining({...newTraining, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Station</label>
                <select className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm font-semibold" value={newTraining.station} onChange={e => setNewTraining({...newTraining, station: e.target.value as Station})}>
                  {Object.values(Station).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Campus</label>
                <select className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm font-semibold" value={newTraining.city} onChange={e => setNewTraining({...newTraining, city: e.target.value as City})}>
                  {Object.values(City).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                <input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm" value={newTraining.startDate} onChange={e => setNewTraining({...newTraining, startDate: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</label>
                <input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm" value={newTraining.dueDate} onChange={e => setNewTraining({...newTraining, dueDate: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1 mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Training Requirements</label>
              <textarea placeholder="Outline what the volunteer needs to master..." className="w-full p-4 bg-white border border-slate-200 rounded-lg outline-none text-sm leading-relaxed" rows={4} value={newTraining.description} onChange={e => setNewTraining({...newTraining, description: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-6 py-2.5 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">Cancel</button>
              <button onClick={handleCreate} className="px-10 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-900/10 hover:opacity-90 transition-all">Schedule Training</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredTrainings.length > 0 ? filteredTrainings.map((t: Training) => (
            <div key={t.id} className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-brand/20 flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 flex gap-2">
                <span className="bg-slate-50 text-slate-400 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-slate-100">
                  {t.city} Campus
                </span>
                <span className="bg-brand-light text-brand font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-brand/5">
                  {t.station}
                </span>
              </div>

              <div className="mt-4 mb-4">
                <h3 className="text-xl font-black text-slate-800 group-hover:text-brand transition-colors mb-2">{t.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{t.description}</p>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completion Window</span>
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <Clock size={14} className="text-slate-400" />
                      {new Date(t.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(t.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  
                  {t.completions[user?.id!] ? (
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Your Status</span>
                       <span className="flex items-center gap-1.5 text-green-600 font-black text-sm">
                        <CheckCircle size={18} /> Mastery Achieved
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Your Status</span>
                       <span className="flex items-center gap-1.5 text-amber-500 font-black text-sm italic">
                        <Clock size={18} /> Not Completed
                      </span>
                    </div>
                  )}
                </div>

                {canSchedule && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel Proficiency</p>
                        <span className="text-[10px] font-black text-brand bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
                            {Object.values(t.completions).filter(v => v).length} / {db.users.filter((u: User) => u.city === t.city).length}
                        </span>
                    </div>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                      {db.users.filter((u: User) => u.city === t.city).map((u: User) => (
                        <div key={u.id} className="flex items-center justify-between group/user">
                          <span className="text-xs text-slate-600 font-bold group-hover/user:text-slate-900 transition-colors">
                            {u.name} {u.surname}
                          </span>
                          <input 
                            type="checkbox" 
                            checked={t.completions[u.id] || false} 
                            onChange={() => toggleCompletion(t.id, u.id)}
                            className="w-4 h-4 rounded text-brand border-slate-300 focus:ring-brand cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full py-28 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                <GraduationCap className="text-slate-200" size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-400 italic mb-2">No Training Found</h3>
              <p className="text-slate-300 text-sm max-w-xs mx-auto">Try adjusting your filters or search terms to find specific training modules.</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-brand-light border border-brand/10 rounded-2xl flex gap-4 text-slate-600 text-xs shadow-sm">
        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-brand shrink-0 shadow-sm">
            <Info size={18} />
        </div>
        <div>
            <p className="font-bold text-slate-700 uppercase tracking-tighter mb-1">Technical Excellence Directive</p>
            <p className="leading-relaxed opacity-80">Volunteers are required to complete all scheduled training for their primary station within the specified due dates. Failure to maintain proficiency may result in limited roster availability for specialized technical roles.</p>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
