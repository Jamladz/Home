import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { DoctorProfile, Permanence } from "../../types";
import { LogOut, LayoutDashboard, Stethoscope, Microscope, Trash2, MapPin, Plus, CheckCircle, Clock, Settings, Wrench, BadgeCheck } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { getWilayas } from "../../lib/algeria_data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'permanences' | 'settings'>('overview');

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [permanences, setPermanences] = useState<Permanence[]>([]);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [globalApiKey, setGlobalApiKey] = useState('');
  const [savingApiKey, setSavingApiKey] = useState(false);

  // Add Permanence Form
  const [newPerm, setNewPerm] = useState<Partial<Permanence>>({ type: 'pharmacy', name: '', address: '', phone: '', openUntil: '' });
  const [isAddingPerm, setIsAddingPerm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email?.toLowerCase().trim() === 'sekanedrmessaif@gmail.com') {
        setIsAdmin(true);
        fetchData();
      } else {
        setIsAdmin(false);
        navigate('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const docsSnap = await getDocs(collection(db, "doctors"));
      const docsData = docsSnap.docs.map(doc => ({ ...doc.data(), userId: doc.id } as DoctorProfile));
      setDoctors(docsData);

      const permSnap = await getDocs(collection(db, "permanences"));
      const permData = permSnap.docs.map(d => ({ ...d.data(), id: d.id } as Permanence));
      setPermanences(permData);

      const configSnap = await getDoc(doc(db, "config", "maintenance"));
      if (configSnap.exists()) {
        setIsMaintenance(configSnap.data().active || false);
      }

      const settingsSnap = await getDoc(doc(db, "config", "settings"));
      if (settingsSnap.exists()) {
        setGlobalApiKey(settingsSnap.data().geminiApiKey || '');
      }
    } catch (e) {
      console.error("Error fetching admin data", e);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      const newState = !isMaintenance;
      await setDoc(doc(db, "config", "maintenance"), { active: newState }, { merge: true });
      setIsMaintenance(newState);
    } catch (e) {
      console.error("Error toggle maintenance", e);
      alert("حدث خطأ أثناء تعديل حالة الصيانة.");
    }
  };

  const handleSaveApiKey = async () => {
    try {
      setSavingApiKey(true);
      await setDoc(doc(db, "config", "settings"), { geminiApiKey: globalApiKey.trim() }, { merge: true });
      alert(language === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved successfully!');
    } catch (e) {
      console.error("Error saving API Key", e);
      alert("حدث خطأ أثناء الحفظ.");
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الطبيب نهائياً؟")) {
      try {
        await deleteDoc(doc(db, "doctors", doctorId));
        setDoctors(prev => prev.filter(d => d.userId !== doctorId));
      } catch (e) {
        console.error("Error deleting doctor", e);
        alert("حدث خطأ أثناء الحذف.");
      }
    }
  };

  const handleToggleApproval = async (doctorId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      await updateDoc(doc(db, "doctors", doctorId), { status: newStatus });
      setDoctors(prev => prev.map(d => d.userId === doctorId ? { ...d, status: newStatus as 'pending' | 'approved' } : d));
    } catch (e) {
      console.error("Error modifying status", e);
      alert("حدث خطأ أثناء تعديل الحالة.");
    }
  };

  const handleToggleVerification = async (doctorId: string, isVerified: boolean) => {
    try {
      await updateDoc(doc(db, "doctors", doctorId), { isVerified: !isVerified });
      setDoctors(prev => prev.map(d => d.userId === doctorId ? { ...d, isVerified: !isVerified } : d));
    } catch (e) {
      console.error("Error modifying verification status", e);
      alert("حدث خطأ أثناء تعديل حالة التوثيق.");
    }
  };

  const handleDeletePermanence = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه المناوبة؟")) {
      try {
        await deleteDoc(doc(db, "permanences", id));
        setPermanences(prev => prev.filter(p => p.id !== id));
      } catch (e) {
        console.error("Error deleting permanence", e);
      }
    }
  };

  const handleAddPermanence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "permanences"), newPerm);
      setPermanences([{ ...newPerm, id: docRef.id } as Permanence, ...permanences]);
      setIsAddingPerm(false);
      setNewPerm({ type: 'pharmacy', name: '', address: '', phone: '', openUntil: '' });
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الإضافة.");
    }
  };

  const wilayaStats = useMemo(() => {
    const stats: Record<string, number> = {};
    const ALL_WILAYAS = getWilayas();
    doctors.forEach(d => {
      if (d.wilaya) {
        const wName = ALL_WILAYAS.find(w => w.id === d.wilaya)?.name || d.wilaya;
        stats[wName] = (stats[wName] || 0) + 1;
      }
    });
    return Object.entries(stats).map(([name, count]) => ({ name, count }));
  }, [doctors]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Sidebar for Desktop / Top nav for mobile */}
      <div className="md:w-64 bg-slate-900 text-slate-300 md:min-h-screen flex flex-col shadow-2xl z-20 shrink-0">
        <div className="p-6 md:p-8 flex justify-between md:justify-center items-center border-b border-slate-800">
          <div className="flex items-center gap-3 text-white">
            <LayoutDashboard className="w-8 h-8 text-indigo-500" />
            <h1 className="text-xl font-bold tracking-wide">{t('admin.title')}</h1>
          </div>
          <button onClick={() => { signOut(auth); navigate('/'); }} className="md:hidden text-slate-400 hover:text-white transition">
            <LogOut className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium text-sm">{t('admin.overview')}</span>
          </button>
          <button 
            onClick={() => setActiveTab('doctors')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${activeTab === 'doctors' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Stethoscope className="w-5 h-5" />
            <span className="font-medium text-sm">{t('admin.doctors')}</span>
          </button>
          <button 
            onClick={() => setActiveTab('permanences')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${activeTab === 'permanences' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Microscope className="w-5 h-5" />
            <span className="font-medium text-sm">{t('admin.permanences')}</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">{t('admin.settings')}</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 hidden md:block">
          <button onClick={() => { signOut(auth); navigate('/'); }} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">تسجيل الخروج / Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto w-full">
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
          
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                {activeTab === 'overview' && t('admin.overview')}
                {activeTab === 'doctors' && t('admin.doctors_list')}
                {activeTab === 'permanences' && t('admin.permanences')}
              </h2>
              <p className="text-slate-500">{t('admin.welcome')}</p>
            </div>
          </div>

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">{t('admin.total_doctors')}</p>
                    <p className="text-3xl font-bold text-slate-800">{doctors.length}</p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">{t('admin.pending_doctors')}</p>
                    <p className="text-3xl font-bold text-slate-800">{doctors.filter(d => d.status === 'pending' || !d.status).length}</p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Microscope className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">{t('admin.active_permanences')}</p>
                    <p className="text-3xl font-bold text-slate-800">{permanences.length}</p>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 h-[400px]">
                  <h3 className="font-bold text-slate-800 mb-6 text-center">أطباء حسب الولاية / Doctors by Wilaya</h3>
                  <div className="h-64">
                    {wilayaStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={wilayaStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data / لا توجد بيانات كافية</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 shadow-md text-white flex flex-col justify-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">النظام يعمل بشكل ممتاز<br/>System is operating perfectly</h3>
                  <p className="text-indigo-100 leading-relaxed max-w-sm">
                    أنت الآن تستخدم لوحة التحكم الإدارية الإصدار 2.0. أسرع، أكثر احترافية، تدعم اللغتين وتوفر إدارة شاملة للأطباء والمناوبات بأعلى معايير الأمان.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DOCTORS */}
          {activeTab === 'doctors' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {doctors.length === 0 ? (
                <div className="p-12 text-center text-slate-500">{t('admin.no_doctors')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="font-semibold py-4 px-6 text-start">الطبيب / Doctor</th>
                        <th className="font-semibold py-4 px-6 text-start">الموقع / Location</th>
                        <th className="font-semibold py-4 px-6 text-start">الحالة / Status</th>
                        <th className="font-semibold py-4 px-6 text-center">إجراءات / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {doctors.map(doctor => (
                        <tr key={doctor.userId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                                {doctor.name.charAt(0)}
                              </div>
                              <div className="text-start">
                                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                                  د. {doctor.name}
                                  {doctor.isVerified && (
                                    <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                                  )}
                                </h3>
                                <p className="text-slate-500 text-xs mt-0.5">{doctor.specialty}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center text-slate-600 text-xs text-start">
                              <MapPin className="w-3.5 h-3.5 ml-1 mr-1 shrink-0" />
                              <span className="truncate max-w-[150px]">{doctor.clinicAddress}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-start">
                            {(!doctor.status || doctor.status === 'pending') ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                {t('admin.pending')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {t('admin.approved')}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleToggleVerification(doctor.userId, !!doctor.isVerified)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all border flex items-center gap-1 ${doctor.isVerified ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                                title={doctor.isVerified ? 'إلغاء التوثيق' : 'توثيق الحساب'}
                              >
                                <BadgeCheck className={`w-3.5 h-3.5 ${doctor.isVerified ? 'text-blue-600' : 'text-slate-400'}`} />
                                {doctor.isVerified ? 'موثق' : 'توثيق'}
                              </button>
                              <button 
                                onClick={() => handleToggleApproval(doctor.userId, doctor.status || 'pending')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all border ${doctor.status === 'approved' ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                              >
                                {doctor.status === 'approved' ? t('admin.revoke') : t('admin.approve')}
                              </button>
                              <button 
                                onClick={() => handleDeleteDoctor(doctor.userId)}
                                className="p-2 bg-white text-rose-600 rounded-xl hover:bg-rose-50 transition border border-slate-200 hover:border-rose-200 flex items-center justify-center shrink-0"
                                title={t('admin.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: PERMANENCES */}
          {activeTab === 'permanences' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-end">
                <button 
                  onClick={() => setIsAddingPerm(!isAddingPerm)}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition flex items-center shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" /> {language === 'ar' ? 'إضافة مناوبة' : 'Add Permanence'}
                </button>
              </div>

              {isAddingPerm && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 mb-6">
                  <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-4">
                    {language === 'ar' ? 'إضافة مناوبة جديدة' : 'Add New Permanence'}
                  </h3>
                  <form onSubmit={handleAddPermanence} className="space-y-4 text-start">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-600 text-xs font-semibold mb-1.5">النوع / Type</label>
                        <select required value={newPerm.type} onChange={e => setNewPerm({...newPerm, type: e.target.value as 'pharmacy'|'laboratory'})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                          <option value="pharmacy">{language === 'ar' ? 'صيدلية' : 'Pharmacy'}</option>
                          <option value="laboratory">{language === 'ar' ? 'مخبر' : 'Laboratory'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 text-xs font-semibold mb-1.5">الاسم / Name</label>
                        <input required type="text" value={newPerm.name} onChange={e => setNewPerm({...newPerm, name: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1.5">العنوان / Address</label>
                      <input required type="text" value={newPerm.address} onChange={e => setNewPerm({...newPerm, address: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-600 text-xs font-semibold mb-1.5">الرقم / Phone</label>
                        <input required type="text" value={newPerm.phone} onChange={e => setNewPerm({...newPerm, phone: e.target.value})} dir="ltr"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-left" />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-xs font-semibold mb-1.5">مفتوح حتى / Open Until</label>
                        <input required type="text" value={newPerm.openUntil} onChange={e => setNewPerm({...newPerm, openUntil: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button type="submit" className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-700 shadow-sm transition-all">
                        {language === 'ar' ? 'حفظ البيانات' : 'Save Data'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {permanences.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200/60 text-center text-slate-500 shadow-sm">
                  {language === 'ar' ? 'لا توجد مناوبات مسجلة حالياً.' : 'No permanences registered yet.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {permanences.map(perm => (
                    <div key={perm.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 flex items-start justify-between group hover:border-indigo-200 transition-colors">
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${perm.type === 'pharmacy' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          <Microscope className="w-6 h-6" />
                        </div>
                        <div className="text-start">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-800">{perm.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${perm.type === 'pharmacy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                              {perm.type === 'pharmacy' ? (language === 'ar' ? 'صيدلية' : 'Pharmacist') : (language === 'ar' ? 'مخبر' : 'Laboratory')}
                            </span>
                          </div>
                          <p className="text-slate-500 text-sm mb-1">{perm.address}</p>
                          <div className="text-xs text-slate-400 font-medium">
                            {language === 'ar' ? 'مفتوح حتى: ' : 'Open until: '} {perm.openUntil}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeletePermanence(perm.id!)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                        title={t('admin.delete')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div className="text-start">
                    <h2 className="text-lg font-bold text-slate-800">وضع الصيانة</h2>
                    <p className="text-sm text-slate-500">إيقاف الموقع مؤقتاً وعرض صفحة الصيانة للمستخدمين.</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleMaintenance}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${isMaintenance ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-md ${isMaintenance ? (language === 'ar' ? '-translate-x-6' : 'translate-x-6') : (language === 'ar' ? 'translate-x-0' : 'translate-x-0')}`}
                  />
                </button>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col gap-4">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div className="text-start">
                    <h2 className="text-lg font-bold text-slate-800">إعدادات الذكاء الاصطناعي (Gemini API Key)</h2>
                    <p className="text-sm text-slate-500">للحصول على ردود المساعد الطبي الذكي، قم بوضع المفتاح هنا ليتم تطبيقه على جميع المستخدمين.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <input
                    type="password"
                    value={globalApiKey}
                    onChange={(e) => setGlobalApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    dir="ltr"
                    className="w-full max-w-lg bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-left"
                  />
                  <div>
                    <button
                      onClick={handleSaveApiKey}
                      disabled={savingApiKey}
                      className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
                    >
                      {savingApiKey ? 'جاري الحفظ...' : (language === 'ar' ? 'حفظ المفتاح' : 'Save Key')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
