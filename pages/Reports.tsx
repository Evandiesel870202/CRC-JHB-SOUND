
import React, { useMemo } from 'react';
import { getAuthUser, getData } from '../db';
import { User, City, Role, AttendanceRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, TrendingUp, Calendar, PieChart as PieIcon } from 'lucide-react';

const Reports: React.FC = () => {
  const user = getAuthUser();
  const db = getData();

  const cityFilter = user?.role === Role.SUPER_ADMIN ? null : user?.city;

  const volunteers = useMemo(() => {
    return db.users.filter((u: User) => !cityFilter || u.city === cityFilter);
  }, [db.users, cityFilter]);

  const stats = useMemo(() => {
    const ethnicities = volunteers.reduce((acc: any, u: User) => {
      acc[u.ethnicity] = (acc[u.ethnicity] || 0) + 1;
      return acc;
    }, {});

    const ethnicityData = Object.entries(ethnicities).map(([name, value]) => ({ name, value }));

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const newVolunteersData = months.map((m, i) => {
      const count = volunteers.filter((u: User) => {
        const date = new Date(u.startServingDate);
        return date.getMonth() === i && date.getFullYear() === new Date().getFullYear();
      }).length;
      return { name: m, count };
    });

    const attendanceData = months.map((m, i) => {
      const count = db.attendance.filter((a: AttendanceRecord) => {
        const u = db.users.find((user: any) => user.id === a.userId);
        if (cityFilter && u?.city !== cityFilter) return false;
        const date = new Date(a.date);
        return date.getMonth() === i && date.getFullYear() === new Date().getFullYear() && a.status === 'Present';
      }).length;
      return { name: m, count };
    });

    return { ethnicityData, newVolunteersData, attendanceData };
  }, [volunteers, db.attendance, db.users, cityFilter]);

  const COLORS = ['#800000', '#D4AF37', '#1E293B', '#475569', '#94A3B8'];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Department Analytics</h1>
        <p className="text-slate-500 text-sm">Insights and metrics for {cityFilter || 'All Campuses'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="h-12 w-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Volunteers</p>
            <p className="text-3xl font-black text-slate-800">{volunteers.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="h-12 w-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth (YTD)</p>
            <p className="text-3xl font-black text-slate-800">
              +{volunteers.filter((u: User) => new Date(u.startServingDate).getFullYear() === new Date().getFullYear()).length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attendance YTD</p>
            <p className="text-3xl font-black text-slate-800">
              {db.attendance.filter((a: any) => a.status === 'Present').length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="text-red-600" size={20} />
            Volunteer Growth per Month
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.newVolunteersData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="count" fill="#800000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieIcon className="text-red-600" size={20} />
            Demographics by Ethnicity
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.ethnicityData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {stats.ethnicityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="text-red-600" size={20} />
            Year-to-Date Attendance Counts
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="count" fill="#1E293B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
