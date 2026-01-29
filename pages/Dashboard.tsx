
import React, { useMemo, useState } from 'react';
import { getAuthUser, getData } from '../db';
import { User, Role, Announcement, RosterEntry } from '../types';
import { Users, Cake, Calendar, Megaphone as AnnouncementIcon, UserPlus, Copy, Check } from 'lucide-react';

const Dashboard: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  const [copied, setCopied] = useState(false);

  const cityVolunteers = useMemo(() => {
    if (user?.role === Role.SUPER_ADMIN) return db.users.length;
    return db.users.filter((u: User) => u.city === user?.city).length;
  }, [user, db.users]);

  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    return db.users.filter((u: User) => {
      if (user?.role !== Role.SUPER_ADMIN && u.city !== user?.city) return false;
      
      const bday = new Date(u.birthday);
      const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      
      return thisYearBday >= today && thisYearBday <= thirtyDaysLater;
    });
  }, [user, db.users]);

  const announcements = useMemo(() => {
    return db.announcements.filter((a: Announcement) => 
      a.city === 'All' || a.city === user?.city
    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [user, db.announcements]);

  const roster = useMemo(() => {
    const today = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);

    return db.roster.filter((r: RosterEntry) => {
      if (r.userId !== user?.id) return false;
      const date = new Date(r.date);
      return date >= today && date <= twoWeeksLater;
    }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [user, db.roster]);

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}#/login?invite=true`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLeader = user && [Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          icon={<Users className="text-blue-500" />} 
          title="City Volunteers" 
          value={cityVolunteers.toString()} 
          label={`In ${user?.role === Role.SUPER_ADMIN ? 'all cities' : user?.city}`} 
        />
        <StatsCard 
          icon={<Cake className="text-pink-500" />} 
          title="Birthdays" 
          value={upcomingBirthdays.length.toString()} 
          label="Next 30 days" 
        />
        <StatsCard 
          icon={<Calendar className="text-green-500" />} 
          title="Rostered Sessions" 
          value={roster.length.toString()} 
          label="Next 2 weeks" 
        />
        <StatsCard 
          icon={<AnnouncementIcon className="text-orange-500" />} 
          title="Announcements" 
          value={announcements.length.toString()} 
          label="Recent updates" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roster Section */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="text-brand" size={20} />
                Your Next 2 Weeks
              </h2>
            </div>
            <div className="space-y-3">
              {roster.length > 0 ? roster.map((item: RosterEntry) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex flex-col items-center justify-center min-w-[50px] py-1 px-2 bg-white rounded border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-slate-700">
                      {new Date(item.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{item.station}</h3>
                    <p className="text-xs text-slate-500">{item.time} &bull; {user?.city}</p>
                  </div>
                </div>
              )) : (
                <p className="text-slate-500 text-sm py-8 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  No roster entries found for the next 2 weeks.
                </p>
              )}
            </div>
          </section>

          {isLeader && (
            <section className="bg-slate-900 p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <UserPlus className="text-brand" size={20} />
                </div>
                <h2 className="text-lg font-bold">Admin Quick Actions</h2>
              </div>
              <p className="text-sm text-slate-400 mb-6">Need to add a new volunteer? Send them this secure registration link.</p>
              <button 
                onClick={handleCopyInvite}
                className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  copied ? 'bg-green-600' : 'bg-brand hover-bg-brand shadow-lg shadow-brand'
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Link Copied!' : 'Copy Invite Link'}
              </button>
            </section>
          )}
        </div>

        {/* Announcements Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AnnouncementIcon className="text-brand" size={20} />
              Recent Announcements
            </h2>
          </div>
          <div className="space-y-4">
            {announcements.length > 0 ? announcements.slice(0, 5).map((a: Announcement) => (
              <div key={a.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    a.type === 'Social' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {a.type}
                  </span>
                  <span className="text-[10px] text-slate-400">{new Date(a.date).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-slate-800 leading-tight mb-1">{a.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{a.content}</p>
                {a.eventDate && (
                  <div className="mt-3 py-1 px-3 bg-white border border-slate-100 rounded text-xs font-medium text-slate-500 inline-flex items-center gap-1.5">
                    <Calendar size={12} /> Event: {new Date(a.eventDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            )) : (
              <p className="text-slate-500 text-sm py-8 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                No announcements to show.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const StatsCard: React.FC<{ icon: React.ReactNode; title: string; value: string; label: string }> = ({ icon, title, value, label }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
        {icon}
      </div>
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black text-slate-800">{value}</span>
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
    </div>
  </div>
);

export default Dashboard;