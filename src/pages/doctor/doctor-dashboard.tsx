import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, onSnapshot, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { DoctorProfile, Appointment, Review } from "../../types";
import { UserRound, LogOut, CalendarCheck, MapPin, Clock, Phone, Settings, Trash2, Star, MessageSquareText } from "lucide-react";
import { getWilayas, getCommunesByWilaya } from "../../lib/algeria_data";
import { useLanguage } from "../../contexts/LanguageContext";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'reviews'>('appointments');
  
  // Registration Form State
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [phone, setPhone] = useState("");
  const [maxPatientsPerDay, setMaxPatientsPerDay] = useState<number>(20);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'past'>('today');

  useEffect(() => {
    let unsubscribeAppointments: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/doctor/login");
        return;
      }
      if (user.email?.toLowerCase().trim() === 'sekanedrmessaif@gmail.com') {
        navigate("/admin");
        return;
      }
      
      setUid(user.uid);
      
      try {
        const docRef = doc(db, "doctors", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const profileData = docSnap.data() as DoctorProfile;
          setProfile(profileData);
          setName(profileData.name || "");
          setSpecialty(profileData.specialty || "");
          setClinicAddress(profileData.clinicAddress || "");
          setWilaya(profileData.wilaya || "");
          setCommune(profileData.commune || "");
          setPhone(profileData.phone || "");
          if (profileData.maxPatientsPerDay) {
            setMaxPatientsPerDay(profileData.maxPatientsPerDay);
          }
          
          // Real-time listener for appointments
          const q = query(collection(db, "appointments"), where("doctorId", "==", user.uid));
          unsubscribeAppointments = onSnapshot(q, (apptSnap) => {
            const appts = apptSnap.docs.map(d => ({ ...d.data(), id: d.id } as Appointment));
            // Sort descending
            appts.sort((a, b) => b.createdAt - a.createdAt);
            setAppointments(appts);
          });

          // Fetch reviews
          const reviewQ = query(collection(db, "reviews"), where("doctorId", "==", user.uid));
          getDocs(reviewQ).then((rSnap) => {
            const revs = rSnap.docs.map(d => ({ ...d.data(), id: d.id } as Review));
            revs.sort((a, b) => b.createdAt - a.createdAt);
            setReviews(revs);
          }).catch(err => console.error("Error fetching reviews", err));
        }
      } catch (error) {
        console.error("Dashboard Load Error", error);
      } finally {
        setLoading(false);
      }
    });
    
    return () => {
      unsubscribeAuth();
      if (unsubscribeAppointments) unsubscribeAppointments();
    };
  }, [navigate]);

  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setLoading(true);
    try {
      const newProfile: DoctorProfile = {
        userId: uid,
        name,
        specialty,
        clinicAddress,
        wilaya,
        commune,
        phone,
        maxPatientsPerDay,
        rating: profile?.rating ?? 5,
        reviewCount: profile?.reviewCount ?? 0,
        patientCount: profile?.patientCount ?? 0,
        status: profile?.status ?? 'pending'
      };
      await setDoc(doc(db, "doctors", uid), newProfile);
      setProfile(newProfile);
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error creating profile", error);
      alert("حدث خطأ أثناء حفظ الملف الشخصي.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (apptId: string, status: 'confirmed' | 'cancelled') => {
    try {
      await updateDoc(doc(db, "appointments", apptId), { status });
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status } : a));
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const deleteAppointment = async (apptId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الحجز نهائياً؟ سيفيدك هذا في إخلاء القائمة من الحجوزات القديمة.")) {
      try {
        await deleteDoc(doc(db, "appointments", apptId));
        setAppointments(prev => prev.filter(a => a.id !== apptId));
      } catch (error) {
        console.error("Error deleting appointment:", error);
        alert("حدث خطأ أثناء محاولة حذف الحجز.");
      }
    }
  };

  const exportToCSV = () => {
    // Adding BOM \uFEFF to ensure Arabic characters render perfectly in Excel
    const headers = ['تاريخ الحجز', 'الوقت', 'اسم المريض', 'رقم الهاتف', 'حالة الحجز', 'تاريخ التسجيل'];
    const csvRows = [headers.join(',')];
    
    appointments.forEach(appt => {
      const statusMap = { 'confirmed': 'مؤكد', 'pending': 'قيد الانتظار', 'cancelled': 'ملغي' };
      const dateStr = new Date(appt.createdAt).toLocaleString('ar-EG');
      const row = [
        appt.date,
        appt.time || 'غير محدد',
        `"${appt.patientName}"`,
        `="${appt.patientPhone}"`, // prepend = to force excel to respect leading zeros in phone
        statusMap[appt.status] || appt.status,
        `"${dateStr}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `حجوزات_${profile?.name}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const filteredAppointments = appointments.filter(appt => {
    if (filter === 'today') return appt.date === todayStr;
    if (filter === 'upcoming') return appt.date > todayStr;
    if (filter === 'past') return appt.date < todayStr;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  // If no profile or editing, show creation/edit form
  if (!profile || isEditingProfile) {
    return (
      <div className="p-4 pt-8 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              {profile ? "تعديل الملف الشخصي" : "أكمل ملفك الشخصي"}
            </h1>
            <p className="text-slate-500 text-sm">
              {profile ? "قم بتحديث بيانات العيادة بما يتناسب معك." : "لكي يتمكن المرضى من العثور عليك، يرجى إدخال بيانات العيادة."}
            </p>
          </div>
          {profile && (
            <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-slate-600">
              إلغاء
            </button>
          )}
        </div>
        
        <form onSubmit={handleRegisterProfile} className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل (مع اللقب)</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">التخصص</label>
            <input type="text" required value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="مثال: طب عام، طب أسنان..."
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الولاية</label>
            <select required value={wilaya} onChange={e => {setWilaya(e.target.value); setCommune("");}}
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none">
              <option value="">اختر الولاية</option>
              {getWilayas().map(w => (
                <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">البلدية</label>
            <select required value={commune} onChange={e => setCommune(e.target.value)} disabled={!wilaya}
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none disabled:opacity-50">
              <option value="">اختر البلدية</option>
              {getCommunesByWilaya(wilaya).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">عنوان العيادة</label>
            <input type="text" required value={clinicAddress} onChange={e => setClinicAddress(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف للحجوزات</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr"
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none text-left" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الحد الأقصى للمرضى في اليوم</label>
            <input type="number" required min="1" value={maxPatientsPerDay} onChange={e => setMaxPatientsPerDay(parseInt(e.target.value) || 20)}
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none text-left" dir="ltr" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-2xl py-3.5 mt-4 hover:bg-indigo-700 shadow-sm">
            حفظ البيانات
          </button>
        </form>
      </div>
    );
  }

  // Dashboard / Sheet
  return (
    <div className="pb-8 bg-slate-100 min-h-screen">
      {profile.status === 'pending' && (
        <div className="sticky top-[68px] z-40 bg-amber-100 text-amber-800 p-4 text-sm font-bold text-center border-b border-amber-200 shadow-sm">
          ⚠️ {language === 'ar' 
            ? 'حسابك قيد المراجعة من الإدارة. لن تظهر للمرضى حتى تتم الموافقة.' 
            : 'Your account is under review. It will not be visible to patients until approved.'}
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-600 to-indigo-800 text-white p-4 pt-8 pb-12 rounded-b-[40px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">لوحة تحكم الطبيب</h1>
          <div className="flex gap-4">
            <button onClick={() => setIsEditingProfile(true)} className="text-indigo-100 hover:text-white transition">
              <Settings className="w-6 h-6" />
            </button>
            <button onClick={() => signOut(auth)} className="text-indigo-100 hover:text-rose-400 transition">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex justify-center items-center backdrop-blur-sm shadow-sm border-2 border-white/30">
            <UserRound className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">د. {profile.name}</h2>
            <p className="text-indigo-200 text-sm">{profile.specialty}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-[-2rem]">
        {/* Stats */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 flex justify-between mb-6">
          <div className="text-center w-1/3 border-l border-slate-100">
            <span className="block text-slate-400 text-xs mb-1 uppercase tracking-widest">إجمالي الحجوزات</span>
            <div className="font-bold text-slate-800 text-2xl">{appointments.length}</div>
          </div>
          <div className="text-center w-1/3 border-l border-slate-100">
            <span className="block text-slate-400 text-xs mb-1 uppercase tracking-widest">حجوزات اليوم</span>
            <div className="font-bold text-indigo-600 text-2xl">
              {appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length}
            </div>
          </div>
          <div className="text-center w-1/3">
            <span className="block text-slate-400 text-xs mb-1 uppercase tracking-widest">التقييم</span>
            <div className="font-bold text-amber-500 text-2xl flex justify-center items-center">
              <Star className="w-4 h-4 fill-amber-500 mr-0.5" />
              {profile.rating ? profile.rating.toFixed(1) : '--'}
            </div>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex bg-indigo-50/50 rounded-2xl p-1.5 mb-6 border border-indigo-100/50">
          <button 
            onClick={() => setActiveTab('appointments')} 
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition ${activeTab === 'appointments' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-600 hover:bg-indigo-100/50'}`}
          >
            <CalendarCheck className="w-4 h-4" />
            الحجوزات
          </button>
          <button 
            onClick={() => setActiveTab('reviews')} 
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition ${activeTab === 'reviews' ? 'bg-amber-500 text-white shadow-md' : 'text-amber-600 hover:bg-amber-100/50'}`}
          >
            <MessageSquareText className="w-4 h-4" />
            التقييمات ({reviews.length})
          </button>
        </div>

        {activeTab === 'appointments' ? (
          /* Appointments List (Sheet) */
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700 text-lg flex items-center">
                <CalendarCheck className="w-5 h-5 mr-2 text-indigo-500" />
                ورقة الحجوزات
              </h3>
            
            <button 
              onClick={exportToCSV}
              className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition shadow-sm"
            >
              تصدير إلى إكسل 📊
            </button>
          </div>

          {/* Tabs Filter */}
          <div className="flex bg-slate-200/50 rounded-2xl p-1 mb-6 border border-slate-200/60">
            <button onClick={() => setFilter('today')} className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition ${filter === 'today' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>اليوم</button>
            <button onClick={() => setFilter('upcoming')} className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition ${filter === 'upcoming' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>القادمة</button>
            <button onClick={() => setFilter('past')} className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition ${filter === 'past' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>السابقة</button>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm">لا توجد حجوزات في هذا القسم.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map(appt => (
                <div key={appt.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-md">{appt.patientName}</h4>
                      <div className="flex items-center text-xs text-slate-500 mt-1" dir="ltr">
                        <Phone className="w-3 h-3 ml-1 text-slate-400" />
                        {appt.patientPhone}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {appt.status === 'pending' && <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-lg">قيد الانتظار</span>}
                      {appt.status === 'confirmed' && <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-lg">مؤكد</span>}
                      {appt.status === 'cancelled' && <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-1 rounded-lg">ملغي</span>}
                      <button onClick={() => deleteAppointment(appt.id!)} className="text-slate-400 hover:text-rose-600 p-1.5 bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50 rounded-lg transition" title="حذف الحجز نهائياً">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-3 flex justify-between items-center text-xs mb-3 border border-slate-100">
                    <div className="flex items-center text-slate-600 font-bold">
                      <Clock className="w-4 h-4 ml-2 text-indigo-400" />
                      {appt.date} {appt.time && `| ${appt.time}`}
                    </div>
                  </div>

                  {appt.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(appt.id!, 'confirmed')} className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-indigo-700">تأكيد الموعد</button>
                      <button onClick={() => updateStatus(appt.id!, 'cancelled')} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-200 hover:text-rose-600 transition">إلغاء</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        ) : (
          /* Reviews Tab */
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700 text-lg flex items-center">
                <MessageSquareText className="w-5 h-5 mr-2 text-amber-500" />
                آراء المرضى
              </h3>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-sm">لم يقم أي مريض بإضافة تقييم حتى الآن.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-bold text-slate-800 text-md">{review.patientName}</div>
                      <div className="flex text-amber-400 bg-amber-50 px-2 py-1 rounded-lg">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`w-3 h-3 ${review.rating >= star ? 'fill-amber-400' : 'text-amber-100'} mx-0.5`} />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      "{review.comment}"
                    </p>
                    
                    <div className="text-slate-400 text-[10px] mt-3">
                      تم التقييم في {new Date(review.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
