
import React, { useState, useRef } from 'react';
import { getData, saveData } from '../db';
import { Palette, List, Shield, Database, Plus, Trash2, MapPin, CheckSquare, Square, X, Upload, Image as ImageIcon, Check } from 'lucide-react';
import { Role, City } from '../types';

const Settings: React.FC = () => {
  const db = getData();
  const [settings, setSettings] = useState(db.settings);
  const [activeCity, setActiveCity] = useState<City>(City.JHB);
  const [newPastor, setNewPastor] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);

  const handleUpdate = (field: string, value: any) => {
    const updated = { ...settings, [field]: value };
    setSettings(updated);
    db.settings = updated;
    saveData(db);

    // Apply theme immediately if color changed
    if (field === 'themeColor') {
      applyTheme(value);
    }
  };

  const applyTheme = (color: string) => {
    const root = document.documentElement;
    root.style.setProperty('--crc-red', color);
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const darken = (val: number) => Math.max(0, Math.floor(val * 0.8));
    const hoverColor = `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;
    const lightColor = `rgba(${r}, ${g}, ${b}, 0.1)`;
    root.style.setProperty('--crc-red-hover', hoverColor);
    root.style.setProperty('--crc-red-light', lightColor);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExtracting(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        extractColorFromLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractColorFromLogo = (base64: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 50; // Downsample for performance
      canvas.height = 50;
      if (ctx) {
        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data;
        
        // Simple color averaging for primary color
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Skip transparent or near-white pixels
          if (data[i+3] < 128) continue;
          if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) continue;
          
          r += data[i];
          g += data[i+1];
          b += data[i+2];
          count++;
        }

        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          
          const updated = { ...settings, logo: base64, themeColor: hex };
          setSettings(updated);
          db.settings = updated;
          saveData(db);
          applyTheme(hex);
        } else {
          handleUpdate('logo', base64);
        }
      }
      setExtracting(false);
    };
    img.src = base64;
  };

  const addDropdownItem = (list: 'ethnicities', item: string) => {
    if (!item) return;
    const newList = [...settings.dropdowns[list], item];
    const updated = { ...settings, dropdowns: { ...settings.dropdowns, [list]: newList } };
    handleUpdate('dropdowns', updated.dropdowns);
  };

  const removeDropdownItem = (list: 'ethnicities', item: string) => {
    const newList = settings.dropdowns[list].filter((i: string) => i !== item);
    const updated = { ...settings, dropdowns: { ...settings.dropdowns, [list]: newList } };
    handleUpdate('dropdowns', updated.dropdowns);
  };

  const handleAddPastor = () => {
    if (!newPastor) return;
    const cityPastors = settings.pastors[activeCity] || [];
    const updatedPastors = { 
      ...settings.pastors, 
      [activeCity]: [...cityPastors, newPastor] 
    };
    handleUpdate('pastors', updatedPastors);
    setNewPastor('');
  };

  const handleRemovePastor = (city: City, name: string) => {
    const updatedPastors = { 
      ...settings.pastors, 
      [city]: settings.pastors[city].filter((p: string) => p !== name) 
    };
    handleUpdate('pastors', updatedPastors);
  };

  const togglePermission = (role: Role, pathName: string) => {
    const rolePaths = settings.rolePermissions[role] || [];
    const updatedPaths = rolePaths.includes(pathName)
      ? rolePaths.filter((p: string) => p !== pathName)
      : [...rolePaths, pathName];
    
    const updatedPerms = { ...settings.rolePermissions, [role]: updatedPaths };
    handleUpdate('rolePermissions', updatedPerms);
  };

  const menuPaths = ['Dashboard', 'Availability', 'Create Ad Hoc', 'Roster', 'Attendance', 'Training', 'Feedback', 'Reports', 'Volunteers', 'Sound Docs', 'Announcement', 'Settings'];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">System Configuration</h1>
          <p className="text-slate-500 text-sm">Global application management for Super Admins</p>
        </div>
        {settings.logo && (
          <div className="h-12 px-4 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
            <img src={settings.logo} alt="CRC Logo" className="h-8 w-auto object-contain" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Logo & Branding */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ImageIcon className="text-brand" size={20} />
            Logo & Branding
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-4 block tracking-widest">Department Logo</label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="relative h-48 w-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-slate-50 transition-all group overflow-hidden"
              >
                {settings.logo ? (
                  <div className="absolute inset-0 flex items-center justify-center p-8 bg-white">
                    <img src={settings.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3 group-hover:bg-brand-light group-hover:text-brand">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-500">Upload CRC Logo</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG or SVG (Max 2MB)</p>
                  </>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="bg-white text-slate-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <Upload size={16} /> {settings.logo ? 'Change Logo' : 'Upload Logo'}
                  </span>
                </div>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </div>
              <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
                <ImageIcon size={12} /> Colors will be automatically extracted from the uploaded logo to theme the application.
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Current Theme Color</label>
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div 
                    className="h-12 w-12 rounded-lg border-2 border-white shadow-sm shrink-0" 
                    style={{ backgroundColor: settings.themeColor }} 
                  />
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-700">{settings.themeColor}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Primary Brand Color</p>
                  </div>
                  {extracting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand border-t-transparent" />}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Manual Color Override</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    className="h-10 w-10 rounded cursor-pointer border-none p-0 bg-transparent" 
                    value={settings.themeColor} 
                    onChange={e => handleUpdate('themeColor', e.target.value)} 
                  />
                  <input 
                    type="text" 
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono" 
                    value={settings.themeColor} 
                    onChange={e => handleUpdate('themeColor', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pastors Management */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <MapPin className="text-brand" size={20} />
            Zone Pastors Registry
          </h2>
          <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {Object.values(City).map(city => (
                <button 
                  key={city}
                  onClick={() => setActiveCity(city)}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeCity === city ? 'bg-white text-brand shadow-sm' : 'text-slate-500'}`}
                >
                  {city}
                </button>
              ))}
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {(settings.pastors[activeCity] || []).map((name: string) => (
                <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <span className="text-sm font-semibold text-slate-700">{name}</span>
                  <button onClick={() => handleRemovePastor(activeCity, name)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input 
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                placeholder={`New pastor for ${activeCity}...`}
                value={newPastor}
                onChange={e => setNewPastor(e.target.value)}
              />
              <button onClick={handleAddPastor} className="px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Other Dropdowns */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Palette className="text-brand" size={20} />
            List Options
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Ethnicities Dropdown</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {settings.dropdowns.ethnicities.map((e: string) => (
                  <span key={e} className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                    {e} <button onClick={() => removeDropdownItem('ethnicities', e)}><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input id="new-eth" className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Add ethnicity..." onKeyPress={e => e.key === 'Enter' && addDropdownItem('ethnicities', (e.target as any).value)} />
              </div>
            </div>
          </div>
        </section>

        {/* Permissions Editor */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Shield className="text-brand" size={20} />
            Permissions Matrix & Page Access
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase">Page / Path</th>
                  {Object.values(Role).map(role => (
                    <th key={role} className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase text-center">{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {menuPaths.map(path => (
                  <tr key={path} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-2">
                      <span className="text-sm font-bold text-slate-700">{path}</span>
                    </td>
                    {Object.values(Role).map(role => {
                      const hasAccess = settings.rolePermissions[role]?.includes(path);
                      return (
                        <td key={role} className="py-3 px-2 text-center">
                          <button 
                            onClick={() => togglePermission(role, path)}
                            className={`inline-flex items-center justify-center p-1.5 rounded transition-all ${hasAccess ? 'text-brand bg-brand-light' : 'text-slate-300 hover:text-slate-400'}`}
                          >
                            {hasAccess ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium italic">
            Note: Page access changes apply immediately for all users of the selected role. Removing access to "Settings" for Super Admin is restricted to prevent system lockout.
          </p>
        </section>

        {/* Maintenance */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Database className="text-brand" size={20} />
            Data Maintenance
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm">Download DB Backup (JSON)</button>
            <button onClick={() => { if(confirm('Reset all settings and users?')) { localStorage.clear(); window.location.reload(); } }} className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm">Clear Application Cache</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;