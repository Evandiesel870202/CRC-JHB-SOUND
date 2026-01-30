
import React, { useState, useMemo, useRef } from 'react';
import { getAuthUser, getData, saveData } from '../db';
import { User, City, Role, SoundDocument } from '../types';
import { FileText, Upload, Trash2, Search, ExternalLink, Filter, Plus, X, Globe, MapPin } from 'lucide-react';

const AllThingsSound: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState<City | 'All'>(user?.role === Role.SUPER_ADMIN ? 'All' : user?.city || 'All');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<{
    city: City | 'All';
    category: 'General' | 'FOH' | 'Broadcast' | 'Monitors';
    file: File | null;
  }>({
    city: user?.role === Role.SUPER_ADMIN ? 'All' : user?.city || 'All',
    category: 'General',
    file: null
  });

  const documents = useMemo(() => {
    return (db.documents || []).filter((d: SoundDocument) => {
      // Non-admins only see documents for their city or 'All'
      if (user?.role !== Role.SUPER_ADMIN) {
        if (d.city !== 'All' && d.city !== user?.city) return false;
      } else {
        // Admins can filter by specific city
        if (filterCity !== 'All' && d.city !== filterCity) return false;
      }
      
      const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [db.documents, user, searchTerm, filterCity]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadState((prev: any) => ({ ...prev, file }));
    }
  };

  const handleUploadSubmit = () => {
    if (!uploadState.file) {
      alert('Please select a file first.');
      return;
    }

    // Simulated upload - in real app would use Cloud Storage
    const newDoc: SoundDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: uploadState.file.name,
      url: '#', // Mock URL
      city: uploadState.city,
      category: uploadState.category,
      uploadedBy: user?.name!
    };

    if (!db.documents) db.documents = [];
    db.documents.push(newDoc);
    saveData(db);
    alert('Resource added to library!');
    setShowUploadForm(false);
    setUploadState({
      city: user?.role === Role.SUPER_ADMIN ? 'All' : user?.city || 'All',
      category: 'General',
      file: null
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    db.documents = db.documents.filter((d: SoundDocument) => d.id !== id);
    saveData(db);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800">All Things Sound</h1>
            <p className="text-slate-500 text-sm">Technical library for manuals, guides and configurations</p>
          </div>
          <button 
            onClick={() => setShowUploadForm(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
          >
            <Plus size={18} /> New Resource
          </button>
        </div>

        {/* Upload Form Modal/Section */}
        {showUploadForm && (
          <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
                <Upload size={14} /> Upload Technical Guide
              </h3>
              <button onClick={() => setShowUploadForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Campus Visibility</label>
                <select 
                  disabled={user?.role !== Role.SUPER_ADMIN}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-red-500/20"
                  value={uploadState.city}
                  onChange={e => setUploadState({ ...uploadState, city: e.target.value as any })}
                >
                  <option value="All">All Campuses</option>
                  <option value={City.JHB}>JHB Campus</option>
                  <option value={City.BFN}>BFN Campus</option>
                  <option value={City.PTA}>PTA Campus</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Category</label>
                <select 
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-red-500/20"
                  value={uploadState.category}
                  onChange={e => setUploadState({ ...uploadState, category: e.target.value as any })}
                >
                  <option value="General">General Technical</option>
                  <option value="FOH">FOH / PA</option>
                  <option value="Broadcast">Broadcast / Recording</option>
                  <option value="Monitors">Monitors / IEMs</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Resource File</label>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-2.5 border-2 border-dashed rounded-lg text-xs font-bold transition-all truncate px-4 ${uploadState.file ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400 bg-white hover:border-slate-300'}`}
                >
                  {uploadState.file ? uploadState.file.name : 'Choose File...'}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUploadForm(false)} className="px-5 py-2 text-slate-400 text-sm font-bold">Cancel</button>
              <button 
                onClick={handleUploadSubmit}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm shadow-xl shadow-slate-900/10"
              >
                Upload Resource
              </button>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              placeholder="Search by resource name..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500/10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {user?.role === Role.SUPER_ADMIN && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3">
              <Filter size={16} className="text-slate-400" />
              <select 
                className="bg-transparent text-sm font-bold text-slate-600 outline-none h-full py-2"
                value={filterCity}
                onChange={e => setFilterCity(e.target.value as any)}
              >
                <option value="All">All Campuses</option>
                <option value={City.JHB}>JHB</option>
                <option value={City.BFN}>BFN</option>
                <option value={City.PTA}>PTA</option>
              </select>
            </div>
          )}
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.length > 0 ? documents.map(doc => (
            <div key={doc.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all hover:border-red-100 flex items-center gap-4 group">
              <div className="h-12 w-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{doc.name}</h3>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                    doc.category === 'FOH' ? 'bg-blue-100 text-blue-600' :
                    doc.category === 'Broadcast' ? 'bg-purple-100 text-purple-600' :
                    doc.category === 'Monitors' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {doc.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    {doc.city === 'All' ? <Globe size={10} /> : <MapPin size={10} />}
                    {doc.city}
                  </span>
                  <span>&bull;</span>
                  <span>By {doc.uploadedBy}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-blue-600 rounded-lg bg-slate-50 hover:bg-blue-50 transition-all"
                  title="View Document"
                >
                  <ExternalLink size={18} />
                </a>
                {([Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER].includes(user?.role!) || doc.uploadedBy === user?.name) && (
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete Resource"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                <FileText size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold text-sm">No technical resources found.</p>
              <p className="text-slate-300 text-xs mt-1">Try adjusting your search or campus filters.</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl flex gap-3 text-slate-500 text-xs italic">
        <Filter size={16} className="shrink-0 text-slate-400" />
        <p>Technical manuals and campus-specific configurations are stored here. For global policies, check the 'All' campus filter. Staff and Section Leaders can contribute to this library.</p>
      </div>
    </div>
  );
};

export default AllThingsSound;
