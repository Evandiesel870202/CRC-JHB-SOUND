
import React, { useState } from 'react';
import { getAuthUser, getData, saveData } from '../db';
import { User, City, Role, Station } from '../types';
import { Save, Search, Link, Check, User as UserIcon, Filter } from 'lucide-react';

const Volunteers: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState<City | 'All'>('All');
  const [localUsers, setLocalUsers] = useState<User[]>(db.users);
  const [copied, setCopied] = useState(false);

  const filteredUsers = localUsers.filter(u => {
    // 1. Role-based restriction: Non-super-admins ONLY see their own city
    if (user?.role !== Role.SUPER_ADMIN && u.city !== user?.city) return false;
    
    // 2. Super-admin city filter (if selection is not 'All')
    if (user?.role === Role.SUPER_ADMIN && cityFilter !== 'All' && u.city !== cityFilter) return false;

    // 3. Search term filter
    const fullName = (u.name + ' ' + u.surname).toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.cellphone.includes(searchTerm);
      
    return matchesSearch;
  });

  const handleUpdate = (userId: string, field: keyof User, value: any) => {
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));
  };

  const handleSaveRow = (userId: string) => {
    const updatedUser = localUsers.find(u => u.id === userId);
    if (!updatedUser) return;
    
    if (!updatedUser.name || !updatedUser.surname) {
      alert("Name and Surname are required.");
      return;
    }

    db.users = db.users.map((u: User) => u.id === userId ? updatedUser : u);
    saveData(db);
    alert(`Successfully updated ${updatedUser.name} ${updatedUser.surname}`);
  };

  const handleCopyInvite = () => {
    const origin = window.location.origin;
    let pathname = window.location.pathname;
    
    if (!pathname.endsWith('/') && !pathname.includes('.')) {
      pathname += '/';
    }
    
    const inviteUrl = `${origin}${pathname}#/login?invite=true`;
    
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      const dummy = document.createElement('input');
      document.body.appendChild(dummy);
      dummy.value = inviteUrl;
      dummy.select();
      document.execCommand('copy');
      document.body.removeChild(dummy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const tableHeaderStyle = "pb-4 px-4 font-black text-left whitespace-nowrap sticky top-0 bg-white z-10";
  const inputStyle = "bg-transparent border-none p-1 focus:ring-1 focus:ring-brand rounded transition-all w-full text-sm";
  const selectStyle = "bg-transparent border-none p-1 focus:ring-1 focus:ring-brand rounded transition-all w-full text-sm cursor-pointer";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Volunteer Directory</h1>
            <p className="text-slate-500 text-sm">Full registry of all department members and their registration data</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 max-w-3xl justify-end">
            
            {/* Super Admin City Filter */}
            {user?.role === Role.SUPER_ADMIN && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-[46px] transition-all focus-within:ring-2 focus-within:ring-brand/20">
                <Filter size={16} className="text-slate-400" />
                <select 
                  className="bg-transparent text-sm font-bold text-slate-600 outline-none h-full py-2 cursor-pointer"
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value as any)}
                >
                  <option value="All">All Campuses</option>
                  {Object.values(City).map(c => <option key={c} value={c}>{c} Campus</option>)}
                </select>
              </div>
            )}

            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                placeholder="Search by name, email or cell..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand h-[46px]"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <button 
              onClick={handleCopyInvite}
              className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shrink-0 h-[46px] ${
                copied ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10'
              }`}
            >
              {copied ? <Check size={16} /> : <Link size={16} />}
              {copied ? 'Invite Link Copied!' : 'Copy Invite Link'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-xl custom-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <table className="w-full text-left border-collapse table-auto min-w-[2000px]">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className={`${tableHeaderStyle} left-0 z-20`}>Volunteer</th>
                <th className={tableHeaderStyle}>Role</th>
                <th className={tableHeaderStyle}>Campus</th>
                <th className={tableHeaderStyle}>Gender</th>
                <th className={tableHeaderStyle}>Ethnicity</th>
                <th className={tableHeaderStyle}>Cellphone</th>
                <th className={tableHeaderStyle}>Email Address</th>
                <th className={tableHeaderStyle}>Suburb</th>
                <th className={tableHeaderStyle}>Birthday</th>
                <th className={tableHeaderStyle}>CRC Member</th>
                <th className={tableHeaderStyle}>Zone Pastor</th>
                <th className={tableHeaderStyle}>Homecell</th>
                <th className={tableHeaderStyle}>Zone</th>
                <th className={tableHeaderStyle}>Shirt</th>
                <th className={tableHeaderStyle}>Primary Station</th>
                <th className={tableHeaderStyle}>Start Date</th>
                <th className={tableHeaderStyle}>Admin Access</th>
                <th className={`${tableHeaderStyle} sticky right-0 bg-white shadow-[-4px_0_8px_rgba(0,0,0,0.02)]`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(v => (
                <tr key={v.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200 shrink-0">
                        {v.profilePicture ? (
                          <img src={v.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={14} />
                        )}
                      </div>
                      <div className="flex flex-col min-w-[120px]">
                        <input 
                          className="bg-transparent border-none p-0 font-bold text-slate-800 text-sm focus:ring-0 w-full" 
                          value={v.name} 
                          onChange={e => handleUpdate(v.id, 'name', e.target.value)} 
                        />
                        <input 
                          className="bg-transparent border-none p-0 text-slate-400 text-[10px] uppercase font-bold focus:ring-0 w-full" 
                          value={v.surname} 
                          onChange={e => handleUpdate(v.id, 'surname', e.target.value)} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select 
                      className={selectStyle}
                      value={v.role}
                      onChange={e => handleUpdate(v.id, 'role', e.target.value as Role)}
                    >
                      {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select 
                      disabled={user?.role !== Role.SUPER_ADMIN}
                      className={`${selectStyle} disabled:opacity-50`}
                      value={v.city}
                      onChange={e => handleUpdate(v.id, 'city', e.target.value as City)}
                    >
                      {Object.values(City).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select className={selectStyle} value={v.gender} onChange={e => handleUpdate(v.id, 'gender', e.target.value)}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select className={selectStyle} value={v.ethnicity} onChange={e => handleUpdate(v.id, 'ethnicity', e.target.value)}>
                      {db.settings?.dropdowns?.ethnicities?.map((et: string) => <option key={et} value={et}>{et}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input className={inputStyle} value={v.cellphone} onChange={e => handleUpdate(v.id, 'cellphone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  </td>
                  <td className="py-3 px-4">
                    <input className={inputStyle} type="email" value={v.email} onChange={e => handleUpdate(v.id, 'email', e.target.value)} />
                  </td>
                  <td className="py-3 px-4">
                    <input className={inputStyle} value={v.suburb} onChange={e => handleUpdate(v.id, 'suburb', e.target.value)} />
                  </td>
                  <td className="py-3 px-4">
                    <input className={inputStyle} placeholder="yyyy/mm/dd" value={v.birthday} onChange={e => handleUpdate(v.id, 'birthday', e.target.value)} />
                  </td>
                  <td className="py-3 px-4">
                    <select className={selectStyle} value={v.isCrcMember} onChange={e => handleUpdate(v.id, 'isCrcMember', e.target.value)}>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select className={selectStyle} value={v.zonePastor} onChange={e => handleUpdate(v.id, 'zonePastor', e.target.value)}>
                      <option value="Unknown">Unknown</option>
                      {db.settings?.pastors?.[v.city]?.map((p: string) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select className={selectStyle} value={v.isHomecell} onChange={e => handleUpdate(v.id, 'isHomecell', e.target.value)}>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input className={inputStyle} value={v.zone} onChange={e => handleUpdate(v.id, 'zone', e.target.value)} />
                  </td>
                  <td className="py-3 px-4">
                    <select className={selectStyle} value={v.shirtSize} onChange={e => handleUpdate(v.id, 'shirtSize', e.target.value)}>
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select className={selectStyle} value={v.primaryStation} onChange={e => handleUpdate(v.id, 'primaryStation', e.target.value as Station)}>
                      {Object.values(Station).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input className={inputStyle} placeholder="yyyy/mm" value={v.startServingDate} onChange={e => handleUpdate(v.id, 'startServingDate', e.target.value)} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded text-brand focus:ring-brand" 
                      checked={v.adminEnabled} 
                      onChange={e => handleUpdate(v.id, 'adminEnabled', e.target.checked)}
                    />
                  </td>
                  <td className="py-3 px-4 sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-50 shadow-[-4px_0_8px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-center">
                      <button 
                        onClick={() => handleSaveRow(v.id)}
                        className="p-2 text-slate-400 hover:text-brand hover:bg-brand-light rounded-lg transition-all"
                        title="Save Changes"
                      >
                        <Save size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <UserIcon className="mx-auto mb-4 opacity-10" size={64} />
            <p className="font-medium italic">No volunteers found matching your search.</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <span>Showing {filteredUsers.length} Volunteers {user?.role === Role.SUPER_ADMIN && cityFilter !== 'All' ? `at ${cityFilter} Campus` : ''}</span>
          <div className="flex items-center gap-2">
            <Filter size={12} />
            <span>Scroll horizontally to view all fields</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Volunteers;
