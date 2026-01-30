
import React, { useState, useMemo } from 'react';
import { getAuthUser, getData, saveData } from '../db';
import { Availability as AvType, City, AdHocEvent } from '../types';
import { Calendar, Clock, Info, CheckCircle2, Music } from 'lucide-react';

const Availability: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  const [view, setView] = useState<'Standard' | 'AdHoc'>('Standard');
  const [localAv, setLocalAv] = useState<AvType[]>(db.availability.filter((a: AvType) => a.userId === user?.id));

  // Availability is open until the start of the new month.
  const isLocked = false; 

  const getSundaysInMonth = (month: number, year: number) => {
    const dates = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() === 0) {
        dates.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const now = new Date();
  const currentSundays = getSundaysInMonth(now.getMonth(), now.getFullYear());
  const nextMonthSundays = getSundaysInMonth(now.getMonth() + 1, now.getFullYear());
  const sundays = [...currentSundays, ...nextMonthSundays].filter(d => d >= new Date());

  const getTimesForCity = (city: City) => {
    if (city === City.JHB) return ['09:30', '18:00'];
    return ['08:30', '11:00', '18:00'];
  };

  const adHocEvents = useMemo(() => {
    return db.adHocEvents.filter((e: AdHocEvent) => e.city === user?.city && new Date(e.endDate) >= new Date());
  }, [db.adHocEvents, user?.city]);

  const toggleAv = (dateStr: string, timeSlot: string, isAdHoc: boolean, eventId?: string) => {
    if (isLocked) return;

    setLocalAv(prev => {
      const existing = prev.find(a => a.date === dateStr && a.timeSlot === timeSlot);
      if (existing) {
        return prev.filter(a => !(a.date === dateStr && a.timeSlot === timeSlot));
      }
      return [...prev, { userId: user?.id!, date: dateStr, timeSlot, isAvailable: true, isAdHoc, eventId }];
    });
  };

  const handleSave = () => {
    const otherAv = db.availability.filter((a: AvType) => a.userId !== user?.id);
    db.availability = [...otherAv, ...localAv];
    saveData(db);
    alert('Availability saved successfully!');
  };

  const isSelected = (dateStr: string, time: string) => localAv.some(a => a.date === dateStr && a.timeSlot === time);

  const daysRemaining = useMemo(() => {
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate() - now.getDate();
  }, [now]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Your Availability</h1>
            <p className="text-slate-500 text-sm">Select when you are available to serve in {user?.city}</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg self-start">
            <button 
              onClick={() => setView('Standard')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${view === 'Standard' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sundays
            </button>
            <button 
              onClick={() => setView('AdHoc')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${view === 'AdHoc' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Ad Hoc Events
            </button>
          </div>
        </div>

        {daysRemaining <= 5 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3 text-blue-700 text-sm animate-in fade-in slide-in-from-top-2">
            <Info size={20} className="shrink-0" />
            <p><strong>Month End approaching!</strong> Please ensure your availability is finalized before the new month starts in {daysRemaining} days so the roster can be generated.</p>
          </div>
        )}

        <div className="space-y-8">
          {view === 'Standard' ? (
            <div className="grid grid-cols-1 gap-6">
              {sundays.map(date => {
                const sundayStr = date.toISOString().split('T')[0];
                const thursday = new Date(date);
                thursday.setDate(date.getDate() - 3);
                const thursdayStr = thursday.toISOString().split('T')[0];

                return (
                  <div key={sundayStr} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/30">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <Calendar className="text-red-600" size={24} />
                            <div>
                                <h3 className="font-black text-slate-800 text-lg">
                                    Sunday, {date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weekend Service</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sunday Sessions */}
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Clock size={12}/> Service Sessions
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {getTimesForCity(user?.city!).map(time => (
                                <button
                                    key={time}
                                    disabled={isLocked}
                                    onClick={() => toggleAv(sundayStr, time, false)}
                                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                                    isSelected(sundayStr, time)
                                        ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-red-200'
                                    }`}
                                >
                                    {time}
                                </button>
                                ))}
                            </div>
                        </div>

                        {/* Thursday Rehearsal */}
                        <div className="md:border-l md:pl-8 border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Music size={12}/> Thursday Rehearsal
                            </p>
                            <div className="space-y-3">
                                <div className="p-3 bg-white border border-slate-100 rounded-xl mb-2 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500">Scheduled for:</span>
                                    <span className="text-xs font-black text-slate-800">
                                        Thu, {thursday.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <button
                                    disabled={isLocked}
                                    onClick={() => toggleAv(thursdayStr, 'Thursday Rehearsal', false)}
                                    className={`w-full px-4 py-4 rounded-xl text-sm font-black border transition-all flex items-center justify-center gap-3 ${
                                    isSelected(thursdayStr, 'Thursday Rehearsal')
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'
                                    }`}
                                >
                                    {isSelected(thursdayStr, 'Thursday Rehearsal') ? '✓ Available for Rehearsal' : 'Mark as Available'}
                                </button>
                            </div>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {adHocEvents.length > 0 ? adHocEvents.map(event => (
                <div key={event.id} className="p-6 rounded-xl border border-slate-200">
                  <h3 className="font-black text-slate-800 text-lg mb-4">{event.name}</h3>
                  <div className="space-y-6">
                    {event.sessions.map(session => {
                      const dateStr = session.date;
                      return (
                        <div key={session.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="min-w-[150px]">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                            <p className="font-bold text-slate-700">{new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
                          </div>
                          <button
                            disabled={isLocked}
                            onClick={() => toggleAv(dateStr, session.time, true, event.id)}
                            className={`px-6 py-3 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 ${
                              isSelected(dateStr, session.time)
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <Clock size={16} />
                            {session.time}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-slate-500 italic bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  No upcoming Ad Hoc events scheduled for {user?.city}.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isLocked}
            className="px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={18} />
            Save Availability
          </button>
        </div>
      </div>
      
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg flex gap-3 text-slate-600 text-xs">
        <Info size={16} className="shrink-0" />
        <p>Providing your availability helps the leadership team plan the roster effectively. Your "Y" indicator on the roster will be based on your Thursday availability selection or actual rehearsal attendance.</p>
      </div>
    </div>
  );
};

export default Availability;
