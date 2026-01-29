
import React, { useState, useMemo } from 'react';
import { getAuthUser, getData, saveData } from '../db';
import { User, City, Role, Station, Training } from '../types';
import { GraduationCap, Plus, Clock, CheckCircle, Info } from 'lucide-react';

const TrainingPage: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  const [showAdd, setShowAdd] = useState(false);
  const [newTraining, setNewTraining] = useState<Partial<Training>>({
    name: '',
    city: user?.city || City.JHB,
    station: Station.GENERAL,
    startDate: '',
    dueDate: '',
    description: '',
    completions: {}
  });

  const trainings = useMemo(() => {
    return db.training.filter((t: Training) => user?.role === Role.SUPER_ADMIN || t.city === user?.city);
  }, [db.training, user]);

  const canSchedule = [Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER].includes(user?.role!);

  const handleCreate = () => {
    if (!newTraining.name || !newTraining.startDate || !newTraining.dueDate) return;
    db.training.push({ ...newTraining, id: Math.random().toString(36).substr(2, 9) } as Training);
    saveData(db);
    setShowAdd(false);
    alert('Training scheduled!');
  };

  const toggleCompletion = (trainingId: string, userId: string) => {
    if (![Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER].includes(user?.role!)) return;
    
    db.training = db.training.map((t: Training) => {
      if (t.id === trainingId) {
        const completions = { ...t.completions };
        completions[userId] = !completions[userId];
        return { ...t, completions };
      }
      return t;
    });
    saveData(db);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Training Portal</h1>
            <p className="text-slate-500 text-sm">Station mastery and department training schedules</p>
          </div>
          {canSchedule && (
            <button 
              onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
            >
              <Plus size={18} /> Schedule Training
            </button>
          )}
        </div>

        {showAdd && (
          <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">Create New Training Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <input placeholder="Training Title" className="p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm" value={newTraining.name} onChange={e => setNewTraining({...newTraining, name: e.target.value})} />
              <select className="p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm" value={newTraining.station} onChange={e => setNewTraining({...newTraining, station: e.target.value as Station})}>
                {Object.values(Station).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm" value={newTraining.city} onChange={e => setNewTraining({...newTraining, city: e.target.value as City})}>
                {Object.values(City).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" className="p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm" value={newTraining.startDate} onChange={e => setNewTraining({...newTraining, startDate: e.target.value})} />
              <input type="date" className="p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm" value={newTraining.dueDate} onChange={e => setNewTraining({...newTraining, dueDate: e.target.value})} />
            </div>
            <textarea placeholder="Description and requirements..." className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm mb-4" rows={3} value={newTraining.description} onChange={e => setNewTraining({...newTraining, description: e.target.value})} />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-500 font-bold text-sm">Cancel</button>
              <button onClick={handleCreate} className="px-8 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">Save Training</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trainings.length > 0 ? trainings.map((t: Training) => (
            <div key={t.id} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-red-100 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-slate-100">
                  {t.station}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Due Date</span>
                  <span className="text-sm font-black text-red-600">{new Date(t.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">{t.name}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">{t.description}</p>
              
              <div className="pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    {Object.values(t.completions).filter(v => v).length} completed
                  </span>
                  {t.completions[user?.id!] ? (
                    <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm">
                      <CheckCircle size={16} /> Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
                      <Clock size={16} /> In Progress
                    </span>
                  )}
                </div>

                {canSchedule && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Completion Status (Leader Only)</p>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-2">
                      {db.users.filter((u: User) => u.city === t.city).map((u: User) => (
                        <div key={u.id} className="flex items-center justify-between">
                          <span className="text-xs text-slate-600 font-medium">{u.name} {u.surname}</span>
                          <input 
                            type="checkbox" 
                            checked={t.completions[u.id] || false} 
                            onChange={() => toggleCompletion(t.id, u.id)}
                            className="w-4 h-4 rounded text-red-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <GraduationCap className="mx-auto text-slate-200 mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-400 italic">No training sessions scheduled at this time.</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
