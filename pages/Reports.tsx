
import React, { useMemo, useState } from 'react';
import { getAuthUser, getData } from '../db';
import { User, City, Role, AttendanceRecord, Station } from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  PieChart as PieIcon, 
  Filter, 
  Clock, 
  CalendarDays,
  ChevronRight,
  MapPin,
  Building2
} from 'lucide-react';

const Reports: React.FC = () => {
  const user = getAuthUser();
  const db = getData();

  // Filters State
  const [cityFilter, setCityFilter] = useState<City | 'All'>(user?.role === Role.SUPER_ADMIN ? 'All' : user?.city || 'All');
  const [buildingFilter, setBuildingFilter] = useState<'North' | 'South' | 'All'>('All');
  const [rangeMode, setRangeMode] = useState<'MTD' | 'Month'>('MTD');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [serviceTimeFilter, setServiceTimeFilter] = useState<string>('All');

  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  // Available service times based on city selection
  const availableServiceTimes = useMemo(() => {
    if (cityFilter === 'All') return ['08:30', '09:30', '11:00', '18:00', 'Thursday Rehearsal'];
    if (cityFilter === City.JHB) return ['09:30', '18:00', 'Thursday Rehearsal'];
    return ['08:30', '11:00', '18:00', 'Thursday Rehearsal'];
  }, [cityFilter]);

  // Scope volunteers based on City & Building Filter
  const filteredVolunteers = useMemo(() => {
    return db.users.filter((u: User) => {
      if (cityFilter !== 'All' && u.city !== cityFilter) return false;
      if (cityFilter === City.BFN && buildingFilter !== 'All' && u.building !== buildingFilter) return false;
      return true;
    });
  }, [db.users, cityFilter, buildingFilter]);

  // Scope Attendance based on filters
  const filteredAttendance = useMemo(() => {
    return db.attendance.filter((a: AttendanceRecord) => {
      // 1. City Filter
      const volunteer = db.users.find((u: any) => u.id === a.userId);
      if (!volunteer) return false;
      if (cityFilter !== 'All' && volunteer.city !== cityFilter) return false;

      // 2. Building Filter (Specific to BFN)
      if (cityFilter === City.BFN && buildingFilter !== 'All') {
        const recordBuilding = a.building || volunteer.building;
        if (recordBuilding !== buildingFilter) return false;
      }

      // 3. Service Time Filter
      if (serviceTimeFilter !== 'All' && a.time !== serviceTimeFilter) return false;

      // 4. Date Range Filter
      const aDate = new Date(a.date);
      const now = new Date();
      if (rangeMode === 'MTD') {
        return aDate.getMonth() === now.getMonth() && aDate.getFullYear() === now.getFullYear();
      } else {
        return aDate.getMonth() === selectedMonth && aDate.getFullYear() === now.getFullYear();
      }
    });
  }, [db.attendance, db.users, cityFilter, buildingFilter, serviceTimeFilter, rangeMode, selectedMonth]);

  const stats = useMemo(() => {
    // 1. Demographics
    const ethnicities = filteredVolunteers.reduce((acc: any, u: User) => {
      acc[u.ethnicity] = (acc[u.ethnicity] || 0) + 1;
      return acc;
    }, {});
    const ethnicityData = Object.entries(ethnicities).map(([name, value]) => ({ name, value }));

    // 2. Growth (Monthly - Constant View)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const growthData = months.map((m, i) => {
      const count = filteredVolunteers.filter((u: User) => {
        const date = new Date(u.startServingDate);
        return date.getMonth() === i && date.getFullYear() === new Date().getFullYear();
      }).length;
      return { name: m, count };
    });

    // 3. Weekly Attendance YTD - Segmented by Service Time
    // INJECT ZERO VALUES FOR ALL WEEKS AND SERVICES
    const weeklyMap = new Map<string, Record<string, number>>();
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Start from the first Sunday of the year
    let tempDate = new Date(currentYear, 0, 1);
    while (tempDate.getDay() !== 0) tempDate.setDate(tempDate.getDate() + 1);

    // Initialize map with 0s for every week up to today
    while (tempDate <= now) {
      const weekLabel = tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const initialCounts: Record<string, number> = {};
      availableServiceTimes.forEach(time => {
        initialCounts[time] = 0;
      });
      weeklyMap.set(weekLabel, initialCounts);
      tempDate.setDate(tempDate.getDate() + 7);
    }
    
    // Filter present records for YTD
    const ytdPresentRecords = db.attendance.filter((a: AttendanceRecord) => {
      const v = db.users.find((u: any) => u.id === a.userId);
      if (!v || (cityFilter !== 'All' && v.city !== cityFilter)) return false;
      
      if (cityFilter === City.BFN && buildingFilter !== 'All') {
        const recordBuilding = a.building || v.building;
        if (recordBuilding !== buildingFilter) return false;
      }

      const d = new Date(a.date);
      return d.getFullYear() === currentYear && a.status === 'Present';
    });

    // Increment existing counts from DB data
    ytdPresentRecords.forEach((a: AttendanceRecord) => {
      const d = new Date(a.date);
      const day = d.getDay();
      const diff = d.getDate() - day; // Find Sunday
      const sunday = new Date(new Date(a.date).setDate(diff));
      const weekLabel = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (weeklyMap.has(weekLabel)) {
        const current = weeklyMap.get(weekLabel)!;
        if (availableServiceTimes.includes(a.time)) {
          current[a.time] = (current[a.time] || 0) + 1;
        }
      }
    });

    // Convert Map to array and ensure chronological sort
    const weeklyAttendanceData = Array.from(weeklyMap.entries())
      .map(([name, counts]) => ({ name, ...counts }))
      .sort((a, b) => {
          return new Date(a.name + ' ' + currentYear).getTime() - 
                 new Date(b.name + ' ' + currentYear).getTime();
      });

    return { ethnicityData, growthData, weeklyAttendanceData };
  }, [filteredVolunteers, db.attendance, db.users, cityFilter, buildingFilter, availableServiceTimes]);

  const COLORS = ['#800000', '#D4AF37', '#1E293B', '#475569', '#94A3B8'];
  
  const SERVICE_COLORS: Record<string, string> = {
    '08:30': '#0ea5e9', // Blue
    '09:30': '#800000', // CRC Red
    '11:00': '#8b5cf6', // Violet
    '18:00': '#f59e0b', // Amber
    'Thursday Rehearsal': '#1e293b' // Slate
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Intelligence & Analytics</h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring growth, demographics and operational excellence</p>
        </div>
        <div className="flex items-center gap-2 bg-brand-light px-3 py-1.5 rounded-lg border border-brand/10">
            <span className="text-[10px] font-black text-brand uppercase tracking-widest">Active Scope</span>
            <ChevronRight size={12} className="text-brand" />
            <span className="text-xs font-bold text-slate-700">
              {cityFilter === 'All' ? 'Global Department' : `${cityFilter} Campus`}
              {cityFilter === City.BFN && buildingFilter !== 'All' ? ` (${buildingFilter})` : ''}
            </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <Filter size={18} className="text-slate-400" />
            <h3 className="font-black text-slate-700 uppercase text-xs tracking-widest">Report Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest flex items-center gap-1">
                <MapPin size={10} /> Campus Location
            </label>
            <select 
              disabled={!isSuperAdmin}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
              value={cityFilter}
              onChange={e => {
                  setCityFilter(e.target.value as any);
                  setServiceTimeFilter('All');
                  setBuildingFilter('All');
              }}
            >
              <option value="All">All Campuses</option>
              {Object.values(City).map(c => <option key={c} value={c}>{c} Campus</option>)}
            </select>
          </div>

          {cityFilter === City.BFN && (
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest flex items-center gap-1">
                    <Building2 size={10} /> Auditorium
                </label>
                <select 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20"
                  value={buildingFilter}
                  onChange={e => setBuildingFilter(e.target.value as any)}
                >
                  <option value="All">All Auditoriums</option>
                  <option value="North">North Auditorium</option>
                  <option value="South">South Auditorium</option>
                </select>
              </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest flex items-center gap-1">
                <CalendarDays size={10} /> Report Period
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setRangeMode('MTD')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${rangeMode === 'MTD' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  MTD
                </button>
                <button 
                  onClick={() => setRangeMode('Month')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${rangeMode === 'Month' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Month
                </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest flex items-center gap-1">
                <Calendar size={10} /> Target Month
            </label>
            <select 
              disabled={rangeMode === 'MTD'}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest flex items-center gap-1">
                <Clock size={10} /> Session / Slot
            </label>
            <select 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20"
              value={serviceTimeFilter}
              onChange={e => setServiceTimeFilter(e.target.value)}
            >
              <option value="All">All Sessions</option>
              {availableServiceTimes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          icon={<Users className="text-red-600" size={24} />} 
          title="Active Personnel" 
          value={filteredVolunteers.length.toString()} 
          label={`${cityFilter === 'All' ? 'Total' : cityFilter}${cityFilter === City.BFN && buildingFilter !== 'All' ? ` (${buildingFilter})` : ''} Capacity`}
          color="bg-red-50"
        />
        <StatsCard 
          icon={<TrendingUp className="text-brand" size={24} />} 
          title="Presence Growth" 
          value={`+${filteredVolunteers.filter((u: User) => new Date(u.startServingDate).getFullYear() === new Date().getFullYear()).length}`} 
          label="Joined in 2024"
          color="bg-brand-light"
        />
        <StatsCard 
          icon={<Calendar className="text-slate-800" size={24} />} 
          title="Period Attendance" 
          value={filteredAttendance.filter(a => a.status === 'Present').length.toString()} 
          label={`${rangeMode === 'MTD' ? 'Month-to-Date' : 'Selected Month'} Total`}
          color="bg-slate-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-brand" size={20} />
                Attendance Trends by Service Slot
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                YTD Weekly Performance Comparison (Continuous Year View)
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end max-w-md">
              {availableServiceTimes.map(time => (
                <div key={time} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SERVICE_COLORS[time] }} />
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">{time}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyAttendanceData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 0' }}
                  labelStyle={{ fontWeight: 'black', color: '#1e293b', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '20px' }}
                />
                
                {availableServiceTimes.filter(t => serviceTimeFilter === 'All' || t === serviceTimeFilter).map(time => (
                  <Line 
                    key={time}
                    type="monotone" 
                    dataKey={time} 
                    stroke={SERVICE_COLORS[time] || '#cbd5e1'} 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name={time}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <PieIcon className="text-brand" size={20} />
            Ethnicity Breakdown
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={stats.ethnicityData} 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={8} 
                  dataKey="value"
                  stroke="none"
                >
                  {stats.ethnicityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="text-brand" size={20} />
            2024 Onboarding Trends
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.growthData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#800000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#800000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#800000" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" name="New Volunteers" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard: React.FC<{ icon: React.ReactNode; title: string; value: string; label: string; color: string }> = ({ icon, title, value, label, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex items-center gap-5">
    <div className={`h-14 w-14 ${color} rounded-2xl flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-slate-800 tracking-tight">{value}</span>
        <span className="text-[10px] font-bold text-slate-500">{label}</span>
      </div>
    </div>
  </div>
);

export default Reports;
