
import React, { useState, useMemo } from 'react';
import { getAuthUser, getData, saveData } from '../db';
import { User, City, Role, Station, Availability, RosterEntry, AdHocEvent } from '../types';
import { Download, Filter, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Roster: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  const [filterType, setFilterType] = useState<'Sunday' | 'AdHoc'>('Sunday');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedEventId, setSelectedEventId] = useState('');
  
  const cities = [City.JHB, City.BFN, City.PTA];
  const [activeCity, setActiveCity] = useState(user?.city || City.JHB);
  
  // Dynamic auditoriums based on settings
  const cityAuditoriums = useMemo(() => {
    return db.settings?.campuses?.[activeCity]?.auditoriums || [];
  }, [db.settings?.campuses, activeCity]);

  const [building, setBuilding] = useState<string>(cityAuditoriums[0]?.name || 'North');
  const [localRoster, setLocalRoster] = useState<RosterEntry[]>(db.roster);

  const getSundaysInMonth = (month: number) => {
    const dates = [];
    const date = new Date(new Date().getFullYear(), month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() === 0) dates.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const datesToRoster = useMemo(() => {
    if (filterType === 'Sunday') return getSundaysInMonth(selectedMonth);
    const event = db.adHocEvents.find((e: AdHocEvent) => e.id === selectedEventId);
    return event ? event.sessions.map((s: any) => new Date(s.date)) : [];
  }, [filterType, selectedMonth, selectedEventId, db.adHocEvents]);

  const stationsForCity = useMemo(() => {
    return [Station.FOH, Station.MONITORS, Station.BROADCAST, Station.RUNNER, Station.KIDS_RUNNER, Station.MOTHERS_TODDLERS, Station.SHADOWING];
  }, []);

  const availableVolunteers = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return db.users.filter((u: User) => {
      if (u.city !== activeCity) return false;
      const isAvailable = db.availability.some((av: Availability) => av.userId === u.id && av.date === dateStr && av.timeSlot === time);
      return isAvailable;
    });
  };

  const checkRehearsalIndicator = (userId: string, sundayDate: Date) => {
    const thursday = new Date(sundayDate);
    thursday.setDate(sundayDate.getDate() - 3);
    const thursdayStr = thursday.toISOString().split('T')[0];
    
    const isAvailableForThursday = db.availability.some((av: Availability) => 
        av.userId === userId && 
        av.date === thursdayStr && 
        av.timeSlot === 'Thursday Rehearsal'
    );

    const attendedThursday = db.attendance.some((a: any) => 
      a.userId === userId && 
      a.date === thursdayStr && 
      a.type === 'Thursday' && 
      a.status === 'Present'
    );

    return isAvailableForThursday || attendedThursday;
  };

  const handleAssign = (date: Date, time: string, station: Station, userId: string) => {
    if (!userId) return;
    const dateStr = date.toISOString().split('T')[0];
    
    const newEntry: RosterEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: dateStr,
      time,
      userId,
      station,
      city: activeCity,
      building: filterType === 'Sunday' ? building : undefined,
      eventId: filterType === 'AdHoc' ? selectedEventId : undefined
    };

    setLocalRoster(prev => [...prev.filter(r => !(r.date === dateStr && r.time === time && r.station === station)), newEntry]);
  };

  const handleSave = () => {
    db.roster = localRoster;
    saveData(db);
    alert('Roster saved successfully!');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const monthName = new Date(new Date().getFullYear(), selectedMonth, 1).toLocaleString('default', { month: 'long' });
    const eventName = filterType === 'AdHoc' ? db.adHocEvents.find((e: any) => e.id === selectedEventId)?.name || 'Event' : monthName;
    const buildingInfo = filterType === 'Sunday' ? ` (${building} Building)` : '';
    const title = `CRC Sound Roster: ${activeCity}${buildingInfo} - ${eventName}`;
    
    doc.setFillColor(128, 0, 0); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("CRC SOUND DEPARTMENT", 14, 20);
    doc.setFontSize(12);
    doc.text(title, 14, 30);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 48);

    const tableRows: any[] = [];
    
    datesToRoster.forEach((date, dateIdx) => {
      if (dateIdx > 0) {
        tableRows.push([{ content: '', colSpan: 4, styles: { fillColor: [180, 180, 180], minCellHeight: 2 } }]);
      }

      const dateStr = date.toISOString().split('T')[0];
      const selectedAud = cityAuditoriums.find((a: any) => a.name === building);
      const times = filterType === 'Sunday' 
        ? (selectedAud?.serviceTimes || [])
        : db.adHocEvents.find((e: any) => e.id === selectedEventId)?.sessions.filter((s: any) => s.date === dateStr).map((s: any) => s.time) || [];

      times.forEach((time, timeIdx) => {
        if (timeIdx > 0) {
          tableRows.push([{ content: '', colSpan: 4, styles: { fillColor: [240, 240, 240], minCellHeight: 1 } }]);
        }

        stationsForCity.forEach(station => {
          const entry = localRoster.find(r => r.date === dateStr && r.time === time && r.station === station && (filterType !== 'Sunday' || r.building === building));
          let volunteerName = 'non-selected';
          
          if (entry) {
            const volunteer = db.users.find((u: any) => u.id === entry.userId);
            if (volunteer) volunteerName = `${volunteer.name} ${volunteer.surname}`;
          }

          tableRows.push([
            date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
            time,
            station,
            volunteerName
          ]);
        });
      });
    });

    autoTable(doc, {
      startY: 55,
      head: [['Date', 'Session', 'Station', 'Volunteer']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 30 }, 2: { cellWidth: 45 }, 3: { fontStyle: 'bold' } }
    });

    const filename = `Roster_${activeCity}_${eventName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Roster Management</h1>
            <p className="text-slate-500 text-sm">Assign volunteers to stations for upcoming services</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportPDF} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors">
              <Download size={16} /> Export PDF
            </button>
            <button onClick={handleSave} className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
              <CheckCircle2 size={16} /> Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Roster Type</label>
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={filterType} onChange={e => setFilterType(e.target.value as any)}>
              <option value="Sunday">Sunday Serving</option>
              <option value="AdHoc">Ad Hoc Event</option>
            </select>
          </div>
          {filterType === 'Sunday' ? (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Month</label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>{new Date(new Date().getFullYear(), i, 1).toLocaleDateString('en-US', { month: 'long' })}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Event</label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                <option value="">Select Event...</option>
                {db.adHocEvents.filter((e: any) => e.city === activeCity).map((e: any) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">City</label>
            <select disabled={user?.role !== Role.SUPER_ADMIN} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={activeCity} onChange={e => setActiveCity(e.target.value as City)}>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {filterType === 'Sunday' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Building / Auditorium</label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={building} onChange={e => setBuilding(e.target.value)}>
                {cityAuditoriums.map((aud: any) => (
                  <option key={aud.name} value={aud.name}>{aud.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-12">
          {datesToRoster.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const currentAud = cityAuditoriums.find((a: any) => a.name === building);
            const times = filterType === 'Sunday' 
              ? (currentAud?.serviceTimes || [])
              : db.adHocEvents.find((e: any) => e.id === selectedEventId)?.sessions.filter((s: any) => s.date === dateStr).map((s: any) => s.time) || [];

            return (
              <div key={dateStr} className="animate-in fade-in slide-in-from-left-4">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-2">
                  <div className="p-2 bg-red-50 text-red-600 rounded">
                    <Filter size={18} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800">
                    {date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h2>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {times.map((time: string) => (
                    <div key={time} className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/60">
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{time} Session</span>
                      </div>
                      
                      <div className="space-y-4">
                        {stationsForCity.map(station => {
                          const assigned = localRoster.find(r => r.date === dateStr && r.time === time && r.station === station && (filterType !== 'Sunday' || r.building === building));
                          const userObj = db.users.find((u: any) => u.id === assigned?.userId);
                          const userHadRehearsal = userObj ? checkRehearsalIndicator(userObj.id, date) : false;

                          const candidates = availableVolunteers(date, time)
                            .filter(u => {
                              const alreadyRostered = localRoster.some(r => r.date === dateStr && r.time === time && r.userId === u.id && (filterType !== 'Sunday' || r.building === building));
                              if (station === Station.SHADOWING && u.role !== Role.NEW_VOLUNTEER) return false;
                              if (station !== Station.SHADOWING && u.role === Role.NEW_VOLUNTEER) return false;
                              return !alreadyRostered;
                            });

                          return (
                            <div key={station} className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                              <span className="w-full sm:w-40 text-xs font-bold text-slate-500 uppercase">{station}</span>
                              <div className="flex-1">
                                <select 
                                  className={`w-full p-2 bg-white border rounded-lg text-sm font-medium ${assigned ? 'border-green-300 bg-green-50 text-green-800' : 'border-slate-200'}`}
                                  value={assigned?.userId || ''}
                                  onChange={e => handleAssign(date, time, station, e.target.value)}
                                >
                                  <option value="">
                                    {assigned 
                                      ? `${userHadRehearsal ? '(Y) ' : ''}${userObj?.name} ${userObj?.surname}` 
                                      : 'Select volunteer...'}
                                  </option>
                                  {candidates.map(u => (
                                    <option key={u.id} value={u.id}>
                                      {checkRehearsalIndicator(u.id, date) ? '(Y) ' : ''}{u.name} {u.surname} {u.role === Role.NEW_VOLUNTEER ? '(New)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Roster;
