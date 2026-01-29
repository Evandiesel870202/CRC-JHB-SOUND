
import React, { useState, useMemo } from 'react';
import { getAuthUser, getData, saveData } from '../db';
import { User, City, Role, Feedback } from '../types';
import { MessageSquare, Send, User as UserIcon, Calendar } from 'lucide-react';

const FeedbackPage: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [comment, setComment] = useState('');

  const cityVolunteers = useMemo(() => {
    return db.users.filter((u: User) => user?.role === Role.SUPER_ADMIN || u.city === user?.city);
  }, [db.users, user]);

  const feedbackHistory = useMemo(() => {
    return db.feedback.filter((f: Feedback) => {
      const v = db.users.find((u: any) => u.id === f.userId);
      return user?.role === Role.SUPER_ADMIN || v?.city === user?.city;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [db.feedback, db.users, user]);

  const handlePost = () => {
    if (!selectedVolunteer || !comment) return;

    const newFeedback: Feedback = {
      id: Math.random().toString(36).substr(2, 9),
      userId: selectedVolunteer,
      authorId: user?.id!,
      comment,
      date: new Date().toISOString()
    };

    db.feedback.unshift(newFeedback);
    saveData(db);
    setComment('');
    alert('Feedback submitted');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-black text-slate-800 mb-6">Team Feedback</h1>
        
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">Add Comment for Volunteer</h3>
          <div className="space-y-4">
            <select 
              className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm font-semibold"
              value={selectedVolunteer}
              onChange={e => setSelectedVolunteer(e.target.value)}
            >
              <option value="">Select Volunteer...</option>
              {cityVolunteers.map(v => <option key={v.id} value={v.id}>{v.name} {v.surname} ({v.role})</option>)}
            </select>
            <textarea 
              rows={3}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none text-sm leading-relaxed"
              placeholder="Observation, encouragement or improvement area..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <div className="flex justify-end">
              <button 
                onClick={handlePost}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all"
              >
                <Send size={16} /> Submit Feedback
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-700 mb-4">Recent Comments</h2>
          {feedbackHistory.length > 0 ? feedbackHistory.map((f: Feedback) => {
            const v = db.users.find((u: any) => u.id === f.userId);
            const author = db.users.find((u: any) => u.id === f.authorId);
            return (
              <div key={f.id} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex gap-4">
                <div className="h-10 w-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center shrink-0">
                  <UserIcon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-800">{v?.name} {v?.surname}</h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar size={10} /> {new Date(f.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">"{f.comment}"</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BY {author?.name} {author?.surname}</span>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="py-20 text-center text-slate-400 italic font-medium bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
              <MessageSquare className="mx-auto mb-4 opacity-20" size={48} />
              No feedback entries yet for this campus.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
