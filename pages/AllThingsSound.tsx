
import React, { useState, useMemo } from 'react';
import { getAuthUser, getData, saveData } from '../db';
import { User, City, Role, SoundDocument } from '../types';
import { FileText, Upload, Trash2, Search, ExternalLink } from 'lucide-react';

const AllThingsSound: React.FC = () => {
  const user = getAuthUser();
  const db = getData();
  const [searchTerm, setSearchTerm] = useState('');

  const documents = useMemo(() => {
    return db.documents.filter((d: SoundDocument) => {
      if (user?.role !== Role.SUPER_ADMIN && d.city !== 'All' && d.city !== user?.city) return false;
      return d.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [db.documents, user, searchTerm]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulated upload - in real app would use Supabase Storage
    const newDoc: SoundDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: '#', // Mock URL
      city: user?.role === Role.SUPER_ADMIN ? 'All' : user?.city!,
      uploadedBy: user?.name!
    };

    db.documents.push(newDoc);
    saveData(db);
    alert('File uploaded successfully!');
  };

  const handleDelete = (id: string) => {
    db.documents = db.documents.filter((d: SoundDocument) => d.id !== id);
    saveData(db);
    alert('File deleted');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800">All Things Sound</h1>
            <p className="text-slate-500 text-sm">Resource library for technical manuals and guides</p>
          </div>
          <div className="relative group">
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileUpload} 
              accept=".pdf,.doc,.docx"
            />
            <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 group-hover:bg-red-700 transition-all">
              <Upload size={18} /> Upload Guide
            </button>
          </div>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            placeholder="Search documents..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.length > 0 ? documents.map(doc => (
            <div key={doc.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all hover:border-red-100 flex items-center gap-4 group">
              <div className="h-12 w-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-sm truncate">{doc.name}</h3>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{doc.city} Campus</p>
              </div>
              <div className="flex gap-1">
                <a href={doc.url} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg">
                  <ExternalLink size={18} />
                </a>
                {([Role.SUPER_ADMIN, Role.STAFF, Role.SECTION_LEADER].includes(user?.role!) || doc.uploadedBy === user?.name) && (
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <FileText size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium italic">No resources found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllThingsSound;
