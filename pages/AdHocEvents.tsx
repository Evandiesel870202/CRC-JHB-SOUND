
import React, { useState } from 'react';
import { getAuthUser, getData, saveData } from '../db';
import { AdHocEvent, City, Station } from '../types';
import { Plus, Trash2, Calendar, MapPin, Tag, Clock, Users } from 'lucide-react';

const AdHocEvents: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  const [event, setEvent] = useState<Partial<AdHocEvent>>({
    name: '',
    city: user?.city || City.JHB,
    startDate: '',
    endDate: '',
    sessions: []
  });

  const addSession = () => {
    const newSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: event.startDate || '',
      time: '09:00',
      requiredStations: [
        { station: Station.FOH, count: 1 },
        { station: Station.MONITORS, count: 1 },
        { station: Station.BROADCAST, count: 1 }
      ]
    };
    setEvent(prev => ({ ...prev, sessions: [...(prev.sessions || []), newSession] }));
  };

  const removeSession = (id: string) => {
    setEvent(prev => ({ ...prev, sessions: prev.sessions?.filter(s => s.id !== id) }));
  };

  const updateSession = (id: string, field: string, value: any) => {
    setEvent(prev => ({
      ...prev,
      sessions: prev.sessions?.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleSave = () => {
    if (!event.name || !event.startDate || !event.endDate || !event.sessions?.length) {
      alert('Please fill in all required fields and add at least one session.');
      return;
    }

    db.adHocEvents.push({ ...event, id: Math.random().toString(36).substr(2, 9) } as AdHocEvent);
    saveData(db);
    alert('Event created successfully!');
    setEvent({ name: '', city: user?.city, startDate: '', endDate: '', sessions: [] });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
          <Calendar className="text-red-600" />
          Create Ad Hoc Event
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
              <Tag size={12} /> Event Name
            </label>
            <input
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g. Dreamweek"
              value={event.name}
              onChange={e => setEvent({ ...event, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
              <MapPin size={12} /> Campus City
            </label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              value={event.city}
              onChange={e => setEvent({ ...event, city: e.target.value as City })}
            >
              <option value={City.JHB}>JHB</option>
              <option value={City.BFN}>BFN</option>
              <option value={City.PTA}>PTA</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Start Date</label>
            <input
              type="date"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              value={event.startDate}
              onChange={e => setEvent({ ...event, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">End Date</label>
            <input
              type="date"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              value={event.endDate}
              onChange={e => setEvent({ ...event, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Clock className="text-slate-400" size={18} />
              Event Sessions
            </h2>
            <button
              onClick={addSession}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Add Session
            </button>
          </div>

          <div className="space-y-4">
            {event.sessions?.map((session, idx) => (
              <div key={session.id} className="p-6 bg-slate-50 rounded-xl border border-slate-200 relative group animate-in fade-in slide-in-from-bottom-2">
                <button
                  onClick={() => removeSession(session.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Session Date</label>
                    <input
                      type="date"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                      value={session.date}
                      onChange={e => updateSession(session.id, 'date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Session Time</label>
                    <input
                      type="time"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                      value={session.time}
                      onChange={e => updateSession(session.id, 'time', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block flex items-center gap-1">
                    <Users size={12} /> Required Stations
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {Object.values(Station).filter(s => [Station.FOH, Station.MONITORS, Station.BROADCAST, Station.RUNNER].includes(s)).map(station => (
                      <div key={station} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-xs font-medium text-slate-600">{station}</span>
                        <input
                          type="number"
                          min="0"
                          className="w-12 text-center text-sm font-bold bg-slate-50 rounded"
                          value={session.requiredStations.find(rs => rs.station === station)?.count || 0}
                          onChange={e => {
                            const newRS = [...session.requiredStations];
                            const idx = newRS.findIndex(rs => rs.station === station);
                            if (idx >= 0) newRS[idx].count = parseInt(e.target.value) || 0;
                            else newRS.push({ station, count: parseInt(e.target.value) || 0 });
                            updateSession(session.id, 'requiredStations', newRS);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            className="px-10 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdHocEvents;
