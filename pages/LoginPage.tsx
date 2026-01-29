
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Role, City, Station } from '../types';
import { getData, saveData, loginUser } from '../db';
import { 
  Phone, 
  ChevronRight, 
  Check, 
  X, 
  UserPlus, 
  Mail, 
  MapPin, 
  User as UserIcon, 
  Calendar, 
  Heart, 
  ShieldCheck, 
  Camera, 
  Upload,
  AlertCircle 
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'phone' | 'popia' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dynamic config from DB
  const dbData = getData();
  const dbPastors = dbData.settings?.pastors || {};

  const [regData, setRegData] = useState<Partial<User>>({
    name: '',
    surname: '',
    gender: 'Male',
    city: City.JHB,
    ethnicity: 'Black',
    email: '',
    suburb: '',
    birthday: '',
    isCrcMember: 'No',
    zonePastor: 'Unknown',
    isHomecell: 'No',
    zone: '',
    shirtSize: 'M',
    role: Role.NEW_VOLUNTEER,
    primaryStation: Station.IN_TRAINING,
    startServingDate: new Date().toISOString().slice(0, 7).replace('-', '/'),
    profilePicture: ''
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search || location.hash.split('?')[1]);
    if (params.get('invite') === 'true') {
      setStep('popia');
    }
  }, [location]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{10}$/.test(phone)) {
      setError('Cellphone Number must be exactly 10 digits.');
      return;
    }

    const db = getData();
    const existingUser = db.users.find((u: User) => u.cellphone === phone);

    if (existingUser) {
      loginUser(existingUser);
      onLogin(existingUser);
      navigate('/dashboard');
    } else {
      setStep('popia');
    }
  };

  const handlePopiaAccept = () => setStep('register');
  const handlePopiaReject = () => window.location.href = 'https://crcchurch.com';

  const validateForm = () => {
    if (!regData.name?.trim()) return 'First Name is required.';
    if (!regData.surname?.trim()) return 'Surname is required.';
    if (!regData.email?.includes('@')) return 'Please enter a valid email address.';
    if (!regData.suburb?.trim()) return 'Suburb is required.';
    if (!regData.birthday || !/^\d{4}\/\d{2}\/\d{2}$/.test(regData.birthday)) return 'Date of Birth must be in yyyy/mm/dd format.';
    if (!regData.startServingDate || !/^\d{4}\/\d{2}$/.test(regData.startServingDate)) return 'Serving Start Date must be in yyyy/mm format.';
    
    if (regData.isCrcMember === 'Yes') {
      if (!regData.zonePastor || regData.zonePastor === 'Unknown' || regData.zonePastor === '') {
        return 'Please select your zone pastor.';
      }
    }
    
    const finalPhone = regData.cellphone || phone;
    if (!/^\d{10}$/.test(finalPhone)) return 'Cellphone Number must be 10 digits.';

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('profilePicture', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const db = getData();
      const finalPhone = regData.cellphone || phone;
      
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: regData.name!.trim(),
        surname: regData.surname!.trim(),
        gender: regData.gender as any,
        cellphone: finalPhone,
        role: regData.role as any,
        city: regData.city as any,
        ethnicity: regData.ethnicity!,
        email: regData.email!.trim(),
        suburb: regData.suburb!.trim(),
        birthday: regData.birthday!,
        isCrcMember: regData.isCrcMember as any,
        zonePastor: regData.isCrcMember === 'Yes' ? regData.zonePastor! : 'Unknown',
        isHomecell: regData.isHomecell as any,
        zone: regData.zone!.trim() || 'General',
        shirtSize: regData.shirtSize!,
        primaryStation: regData.role === Role.NEW_VOLUNTEER ? Station.IN_TRAINING : regData.primaryStation!,
        startServingDate: regData.startServingDate!,
        adminEnabled: false,
        profilePicture: regData.profilePicture
      };

      db.users.push(newUser);
      saveData(db);
      loginUser(newUser);
      onLogin(newUser);
      navigate('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const updateField = (field: keyof User, value: any) => {
    setRegData(prev => {
      const updates: Partial<User> = { [field]: value };
      if (field === 'isCrcMember') {
        updates.zonePastor = value === 'Yes' ? '' : 'Unknown';
      }
      if (field === 'role') {
        updates.primaryStation = value === Role.NEW_VOLUNTEER ? Station.IN_TRAINING : Station.FOH;
      }
      return { ...prev, ...updates };
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`w-full ${step === 'register' ? 'max-w-4xl my-8' : 'max-w-md'} bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500`}>
        <div className="bg-[#800000] p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            {step === 'register' ? <UserPlus size={32} /> : step === 'popia' ? <ShieldCheck size={32} /> : <Phone size={32} />}
          </div>
          <h1 className="text-2xl font-bold">CRC Sound Dept</h1>
          <p className="text-red-100 text-sm opacity-80 mt-1 uppercase tracking-widest font-bold">
            {step === 'register' ? 'Volunteer Registration' : step === 'popia' ? 'Privacy Consent' : 'Access Portal'}
          </p>
        </div>

        <div className="p-8">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cellphone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    placeholder="e.g. 0721234567"
                    required
                  />
                </div>
                {error && <p className="text-red-600 text-xs mt-2 font-bold flex items-center gap-1"><X size={12}/> {error}</p>}
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-lg font-bold">Continue</button>
            </form>
          )}

          {step === 'popia' && (
            <div className="text-center">
              <div className="bg-red-50 p-6 rounded-xl border border-red-100 mb-8 italic">
                "I provide my information voluntarily and consent to CRC's Privacy Policy which is available on crcchurch.com"
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={handlePopiaReject} className="py-4 border-2 rounded-xl font-bold">Reject</button>
                <button onClick={handlePopiaAccept} className="py-4 bg-[#800000] text-white rounded-xl font-bold">Accept</button>
              </div>
            </div>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-8 animate-in slide-in-from-bottom-8">
              <div className="flex flex-col items-center gap-4 mb-8">
                <div onClick={() => fileInputRef.current?.click()} className="group relative w-24 h-24 rounded-full border-4 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden">
                  {regData.profilePicture ? <img src={regData.profilePicture} alt="Preview" className="w-full h-full object-cover" /> : <Camera className="text-slate-300" size={32} />}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Upload className="text-white" size={20} /></div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>

              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                    <select className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.role} onChange={e => updateField('role', e.target.value as Role)}>
                      <option value={Role.NEW_VOLUNTEER}>New Volunteer</option>
                      <option value={Role.VOLUNTEER}>Volunteer</option>
                      <option value={Role.SECTION_LEADER}>Section Leader</option>
                      <option value={Role.STAFF}>Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">First Name</label>
                    <input required className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.name} onChange={e => updateField('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Surname</label>
                    <input required className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.surname} onChange={e => updateField('surname', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Gender</label>
                    <select className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.gender} onChange={e => updateField('gender', e.target.value)}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Ethnicity</label>
                    <select className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.ethnicity} onChange={e => updateField('ethnicity', e.target.value)}>
                      {dbData.settings?.dropdowns?.ethnicities?.map((et: string) => <option key={et} value={et}>{et}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cellphone</label>
                    <input className="w-full p-2.5 bg-slate-100 border rounded-lg text-sm text-slate-500" value={phone} disabled />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                    <input type="email" required className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.email} onChange={e => updateField('email', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Suburb</label>
                    <input required className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.suburb} onChange={e => updateField('suburb', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Date of Birth (yyyy/mm/dd)</label>
                    <input placeholder="1995/10/25" className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.birthday} onChange={e => updateField('birthday', e.target.value)} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Church Membership</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">City you serve in</label>
                    <select className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.city} onChange={e => updateField('city', e.target.value as City)}>
                      <option value={City.JHB}>JHB</option>
                      <option value={City.BFN}>BFN</option>
                      <option value={City.PTA}>PTA</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Member of CRC?</label>
                    <select className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.isCrcMember} onChange={e => updateField('isCrcMember', e.target.value)}>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-[10px] font-bold text-slate-500 uppercase ${regData.isCrcMember === 'No' ? 'opacity-50' : ''}`}>Zone Pastor</label>
                    <select 
                      disabled={regData.isCrcMember === 'No'}
                      className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm disabled:opacity-50" 
                      value={regData.zonePastor} 
                      onChange={e => updateField('zonePastor', e.target.value)}
                    >
                      <option value="">Select Pastor...</option>
                      {dbPastors[regData.city as City]?.map((p: string) => <option key={p} value={p}>{p}</option>)}
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">In a Homecell?</label>
                    <select className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.isHomecell} onChange={e => updateField('isHomecell', e.target.value)}>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">What zone are you in?</label>
                    <input placeholder="e.g. North Zone" className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.zone} onChange={e => updateField('zone', e.target.value)} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Sound Department Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Shirt Size</label>
                    <select className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.shirtSize} onChange={e => updateField('shirtSize', e.target.value)}>
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Station</label>
                    <select disabled={regData.role === Role.NEW_VOLUNTEER} className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.primaryStation} onChange={e => updateField('primaryStation', e.target.value as Station)}>
                      {regData.role === Role.NEW_VOLUNTEER ? <option value={Station.IN_TRAINING}>In Training</option> : <>
                        <option value={Station.FOH}>FOH</option>
                        <option value={Station.MONITORS}>Monitors</option>
                        <option value={Station.BROADCAST}>Broadcast</option>
                      </>}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Started Serving (yyyy/mm)</label>
                    <input placeholder="2023/05" className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" value={regData.startServingDate} onChange={e => updateField('startServingDate', e.target.value)} />
                  </div>
                </div>
              </section>

              {error && <div className="p-4 bg-red-50 text-red-700 font-bold text-sm flex gap-3"><AlertCircle size={20} />{error}</div>}
              <button type="submit" className="w-full py-4 bg-[#800000] text-white rounded-xl font-black text-lg shadow-xl">Submit Registration</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
