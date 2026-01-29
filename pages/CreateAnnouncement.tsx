
import React, { useState } from 'react';
import { getAuthUser, getData, saveData } from '../db';
import { City, Role, Announcement } from '../types';
import { Megaphone, Send, Calendar, MapPin, Type } from 'lucide-react';

const CreateAnnouncement: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    type: 'General',
    city: user?.role === Role.SUPER_ADMIN ? 'All' : user?.city!,
    eventDate: ''
  });

  const handlePost = () => {
    if (!formData.title || !formData.content) return;

    const newAnnouncement: Announcement = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString()
    } as Announcement;

    db.announcements.unshift(newAnnouncement);
    saveData(db);
    alert('Announcement posted!');
    setFormData({ title: '', content: '', type: 'General', city: user?.role === Role.SUPER_ADMIN ? 'All' : user?.city!, eventDate: '' });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
          <Megaphone className="text-red-600" />
          Create Announcement
        </h1>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Announcement Type</label>
              <div className="flex bg-slate-50 p-1 rounded-lg">
                <button 
                  onClick={() => setFormData({...formData, type: 'General'})}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formData.type === 'General' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
                >
                  General Comms
                </button>
                <button 
                  onClick={() => setFormData({...formData, type: 'Social'})}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formData.type === 'Social' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Social Event
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Post To Campus</label>
              <select 
                disabled={user?.role !== Role.SUPER_ADMIN}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value as any})}
              >
                <option value="All">All Cities</option>
                <option value={City.JHB}>JHB</option>
                <option value={City.BFN}>BFN</option>
                <option value={City.PTA}>PTA</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Title</label>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-bold"
              placeholder="Give your update a clear heading..."
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          {formData.type === 'Social' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Event Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="date"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  value={formData.eventDate}
                  onChange={e => setFormData({...formData, eventDate: e.target.value})}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Content</label>
            <textarea 
              rows={6}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm leading-relaxed"
              placeholder="What do the volunteers need to know?"
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
            />
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              onClick={handlePost}
              className="px-10 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 flex items-center gap-2"
            >
              <Send size={18} /> Post Announcement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAnnouncement;
