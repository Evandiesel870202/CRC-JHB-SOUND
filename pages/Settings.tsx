
import React, { useState, useRef } from 'react';
import { getData, saveData, CSVService } from '../db';
import { 
  Palette, 
  List, 
  Shield, 
  Database, 
  Plus, 
  Trash2, 
  MapPin, 
  CheckSquare, 
  Square, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  FileSpreadsheet,
  Download,
  Link as LinkIcon,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Role, City } from '../types';

const Settings: React.FC = () => {
  const db = getData();
  const [settings, setSettings] = useState(db.settings);
  const [activeCity, setActiveCity] = useState<City>(City.JHB);
  const [newPastor, setNewPastor] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const csvUserImportRef = useRef<HTMLInputElement>(null);
  const csvAvailImportRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleUpdate = (field: string, value: any) => {
    const updated = { ...settings, [field]: value };
    setSettings(updated);
    db.settings = updated;
    saveData(db);

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
      canvas.width = 50;
      canvas.height = 50;
      if (ctx) {
        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
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

  const handleExportUsers = () => {
    const csv = CSVService.generateUsersTemplate();
    CSVService.downloadFile(csv, 'CRC_Sound_Volunteers_Database.csv');
  };

  const handleExportAvail = () => {
    const db = getData();
    const csv = CSVService.generateAvailabilityTemplate(db.availability);
    CSVService.downloadFile(csv, 'CRC_Sound_Availability_Database.csv');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>, type: 'Users' | 'Avail') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string;
          const db = getData();
          
          if (type === 'Users') {
            const parsed = CSVService.parseUsersCSV(csvText);
            const currentUsers = [...db.users];
            parsed.forEach(newUser => {
              const index = currentUsers.findIndex(u => u.cellphone === newUser.cellphone);
              if (index >= 0) currentUsers[index] = { ...currentUsers[index], ...newUser };
              else currentUsers.push(newUser);
            });
            db.users = currentUsers;
            setImportStatus(`Imported ${parsed.length} volunteers!`);
          } else {
            const parsed = CSVService.parseAvailabilityCSV(csvText);
            db.availability = parsed;
            setImportStatus(`Imported ${parsed.length} availability records!`);
          }
          
          saveData(db);
          setTimeout(() => setImportStatus(null), 5000);
        } catch (err) {
          setImportStatus("Error parsing CSV. Please use a clean export template.");
        }
      };
      reader.readAsText(file);
    }
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
    const updatedPastors = { ...settings.pastors, [activeCity]: [...cityPastors, newPastor] };
    handleUpdate('pastors', updatedPastors);
    setNewPastor('');
  };

  const handleRemovePastor = (city: City, name: string) => {
    const updatedPastors = { ...settings.pastors, [city]: settings.pastors[city].filter((p: string) => p !== name) };
    handleUpdate('pastors', updatedPastors);
  };

  const togglePermission = (role: Role, pathName: string) => {
    const rolePaths = settings.rolePermissions[role] || [];
    const updatedPaths = rolePaths.includes(pathName) ? rolePaths.filter((p: string) => p !== pathName) : [...rolePaths, pathName];
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
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setShowHelp(!showHelp)}
                className={`p-2 rounded-lg transition-all ${showHelp ? 'bg-brand text-white' : 'bg-white text-slate-400 border border-slate-200 hover:text-brand'}`}
            >
                <HelpCircle size={20} />
            </button>
            {settings.logo && (
                <div className="h-12 px-4 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                    <img src={settings.logo} alt="CRC Logo" className="h-8 w-auto object-contain" />
                </div>
            )}
        </div>
      </div>

      {showHelp && (
          <div className="bg-slate-900 text-slate-300 p-8 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FileSpreadsheet className="text-brand" size={20} />
                  Google Sheets Guide
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed">
                  <div className="space-y-4">
                      <p><strong className="text-brand">Step 1:</strong> Create a new Google Sheet and copy the long ID from the URL (the part between /d/ and /edit).</p>
                      <p><strong className="text-brand">Step 2:</strong> Create two tabs in your Sheet: <span className="text-white font-mono bg-slate-800 px-1 rounded">Volunteers</span> and <span className="text-white font-mono bg-slate-800 px-1 rounded">Availability</span>.</p>
                      <p><strong className="text-brand">Step 3:</strong> Download the CSV templates from the app and upload them to their respective tabs using <span className="italic text-white">File > Import > Upload</span>.</p>
                  </div>
                  <div className="space-y-4">
                      <p><strong className="text-brand">Data Sync:</strong> To update the app, export your sheet as a <span className="text-white">CSV</span> and upload it back here. The app will intelligently merge or replace records based on cellphone numbers.</p>
                      <p className="p-3 bg-white/5 rounded-lg border border-white/10 italic text-xs">
                          "This manual CSV method ensures your data remains secure and avoids complex API authentication while giving you the full power of Google Sheets for bulk editing."
                      </p>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Google Sheets Integration Card */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileSpreadsheet className="text-brand" size={20} />
            Google Sheets Connectivity
          </h2>
          
          <div className="space-y-8">
            <div className="max-w-xl">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Target Spreadsheet ID</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand outline-none" 
                  placeholder="e.g. 1aBC-dEfG1234567890..."
                  value={settings.spreadsheetId || ''}
                  onChange={e => handleUpdate('spreadsheetId', e.target.value)}
                />
                <button 
                  onClick={() => settings.spreadsheetId && window.open(`https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}`, '_blank')}
                  className="px-4 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Open in Google Sheets"
                >
                  <LinkIcon size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Volunteers Tab Management */}
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                    <Database className="text-slate-400" size={18} />
                    <h3 className="font-black text-slate-700 uppercase text-[10px] tracking-widest">Volunteers Database</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportUsers} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition-all">
                    <Download size={14} /> Export CSV
                  </button>
                  <button onClick={() => csvUserImportRef.current?.click()} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                    <Upload size={14} /> Import CSV
                  </button>
                </div>
                <input type="file" ref={csvUserImportRef} className="hidden" accept=".csv" onChange={(e) => handleImportCSV(e, 'Users')} />
              </div>

              {/* Availability Tab Management */}
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-slate-400" size={18} />
                    <h3 className="font-black text-slate-700 uppercase text-[10px] tracking-widest">Availability Records</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportAvail} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition-all">
                    <Download size={14} /> Export CSV
                  </button>
                  <button onClick={() => csvAvailImportRef.current?.click()} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                    <Upload size={14} /> Import CSV
                  </button>
                </div>
                <input type="file" ref={csvAvailImportRef} className="hidden" accept=".csv" onChange={(e) => handleImportCSV(e, 'Avail')} />
              </div>
            </div>

            {importStatus && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in zoom-in-95 ${importStatus.includes('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                {importStatus.includes('Error') ? <AlertCircle size={18} /> : <Check size={18} />}
                {importStatus}
              </div>
            )}
          </div>
        </section>

        {/* Logo & Branding */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ImageIcon className="text-brand" size={20} />
            Department Branding
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
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
                    <p className="text-sm font-bold text-slate-500">Upload Department Logo</p>
                  </>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="bg-white text-slate-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <Upload size={16} /> Update Logo
                  </span>
                </div>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Global Accent Color</label>
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="h-12 w-12 rounded-lg border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: settings.themeColor }} />
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-700 uppercase">{settings.themeColor}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <input type="color" className="h-10 w-10 rounded cursor-pointer p-0 border-none bg-transparent" value={settings.themeColor} onChange={e => handleUpdate('themeColor', e.target.value)} />
                  <input type="text" className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono uppercase" value={settings.themeColor} onChange={e => handleUpdate('themeColor', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pastors Management */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <MapPin className="text-brand" size={20} />
            Zone Pastors
          </h2>
          <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {Object.values(City).map(city => (
                <button key={city} onClick={() => setActiveCity(city)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md transition-all ${activeCity === city ? 'bg-white text-brand shadow-sm' : 'text-slate-500'}`}>
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
              <input className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder={`New pastor for ${activeCity}...`} value={newPastor} onChange={e => setNewPastor(e.target.value)} />
              <button onClick={handleAddPastor} className="px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"><Plus size={18} /></button>
            </div>
          </div>
        </section>

        {/* List Options */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Palette className="text-brand" size={20} />
            Data Lists
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Ethnicity Options</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {settings.dropdowns.ethnicities.map((e: string) => (
                  <span key={e} className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-full border border-slate-200">
                    {e} <button onClick={() => removeDropdownItem('ethnicities', e)} className="hover:text-red-500"><X size={10} /></button>
                  </span>
                ))}
              </div>
              <input 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                placeholder="Add new option and press Enter..." 
                onKeyPress={e => {
                    if (e.key === 'Enter') {
                        addDropdownItem('ethnicities', (e.target as any).value);
                        (e.target as any).value = '';
                    }
                }} 
              />
            </div>
          </div>
        </section>

        {/* Permissions */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Shield className="text-brand" size={20} />
            Role Permissions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Name</th>
                  {Object.values(Role).map(role => (
                    <th key={role} className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">{role}</th>
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
                          <button onClick={() => togglePermission(role, path)} className={`inline-flex items-center justify-center p-1.5 rounded transition-all ${hasAccess ? 'text-brand bg-brand-light' : 'text-slate-200 hover:text-slate-400'}`}>
                            {hasAccess ? <CheckSquare size={20} /> : <Square size={20} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Maintenance */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 text-red-600">
            <Database size={20} />
            System Maintenance
          </h2>
          <div className="flex flex-wrap gap-4">
            <button 
                onClick={() => {
                    const data = JSON.stringify(getData(), null, 2);
                    CSVService.downloadFile(data, `CRC_Sound_Backup_${new Date().toISOString().split('T')[0]}.json`);
                }}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all"
            >
                Download Full Backup (JSON)
            </button>
            <button onClick={() => { if(confirm('Are you absolutely sure? This will wipe ALL data locally. Ensure you have a backup!')) { localStorage.clear(); window.location.reload(); } }} className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all border border-red-100">
                Wipe Local Database
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
