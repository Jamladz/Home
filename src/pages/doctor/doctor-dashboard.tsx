import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { DoctorProfile, Appointment, Review } from "../../types";
import {
  UserRound,
  LogOut,
  CalendarCheck,
  MapPin,
  Clock,
  Phone,
  Settings,
  Trash2,
  Star,
  MessageSquareText,
  QrCode,
  X,
  Check,
  BadgeCheck,
} from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import { getWilayas, getCommunesByWilaya } from "../../lib/algeria_data";
import { medicalSpecialties } from "../../lib/medical_specialties";
import { useLanguage } from "../../contexts/LanguageContext";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<"appointments" | "reviews">(
    "appointments",
  );

  // Registration Form State
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [specialty, setSpecialty] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [phone, setPhone] = useState("");
  const [maxPatientsPerDay, setMaxPatientsPerDay] = useState<number>(20);
  const [workingHoursStart, setWorkingHoursStart] = useState("08:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("16:00");
  const [workingDays, setWorkingDays] = useState<string[]>(["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"]);
  const [bookingWindowStart, setBookingWindowStart] = useState("18:00");
  const [bookingWindowEnd, setBookingWindowEnd] = useState("00:00");
  const [isBookingOpenAllDay, setIsBookingOpenAllDay] = useState(true);
  const [isAcceptingAppointments, setIsAcceptingAppointments] = useState(true);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [filter, setFilter] = useState<"today" | "upcoming" | "past">("today");
  const [expandedApptId, setExpandedApptId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeAppointments: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/doctor/login");
        return;
      }
      if (user.email?.toLowerCase().trim() === "sekanedrmessaif@gmail.com") {
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
          setGender(profileData.gender || "");
          setSpecialty(profileData.specialty || "");
          setClinicAddress(profileData.clinicAddress || "");
          setWilaya(profileData.wilaya || "");
          setCommune(profileData.commune || "");
          setPhone(profileData.phone || "");
          if (profileData.maxPatientsPerDay) {
            setMaxPatientsPerDay(profileData.maxPatientsPerDay);
          }
          if (profileData.workingHours) {
            setWorkingHoursStart(profileData.workingHours.start);
            setWorkingHoursEnd(profileData.workingHours.end);
          }
          if (profileData.workingDays) {
            setWorkingDays(profileData.workingDays);
          }
          if (profileData.bookingWindow) {
            setBookingWindowStart(profileData.bookingWindow.start);
            setBookingWindowEnd(profileData.bookingWindow.end);
          }
          if (profileData.isBookingOpenAllDay !== undefined) {
            setIsBookingOpenAllDay(profileData.isBookingOpenAllDay);
          }
          if (profileData.isAcceptingAppointments !== undefined) {
            setIsAcceptingAppointments(profileData.isAcceptingAppointments);
          }
          setNoticeMessage(profileData.noticeMessage || "");

          // Real-time listener for appointments
          const q = query(
            collection(db, "doctors", user.uid, "appointments")
          );
          unsubscribeAppointments = onSnapshot(q, (apptSnap) => {
            const appts = apptSnap.docs.map(
              (d) => ({ ...d.data(), id: d.id }) as Appointment,
            );
            // Sort ascending (First to book is first)
            appts.sort((a, b) => a.createdAt - b.createdAt);
            setAppointments(appts);
          });

          // Fetch reviews
          const reviewQ = query(
            collection(db, "reviews"),
            where("doctorId", "==", user.uid),
          );
          getDocs(reviewQ)
            .then((rSnap) => {
              const revs = rSnap.docs.map(
                (d) => ({ ...d.data(), id: d.id }) as Review,
              );
              revs.sort((a, b) => b.createdAt - a.createdAt);
              setReviews(revs);
            })
            .catch((err) => console.error("Error fetching reviews", err));
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
        gender: gender as "male" | "female",
        specialty,
        clinicAddress,
        wilaya,
        commune,
        phone,
        maxPatientsPerDay,
        rating: profile?.rating ?? 5,
        reviewCount: profile?.reviewCount ?? 0,
        patientCount: profile?.patientCount ?? 0,
        status: profile?.status ?? "pending",
        workingHours: {
          start: workingHoursStart,
          end: workingHoursEnd
        },
        workingDays,
        bookingWindow: {
          start: bookingWindowStart,
          end: bookingWindowEnd
        },
        isBookingOpenAllDay,
        isAcceptingAppointments,
        noticeMessage
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

  const updateStatus = async (apptId: string, status: string) => {
    try {
      if (!auth.currentUser?.uid) return;
      await updateDoc(doc(db, "doctors", auth.currentUser.uid, "appointments", apptId), { status });
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status } : a)),
      );
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const deleteAppointment = async (apptId: string) => {
    if (
      window.confirm(
        "هل أنت متأكد من حذف هذا الحجز نهائياً؟ سيفيدك هذا في إخلاء القائمة من الحجوزات القديمة.",
      )
    ) {
      try {
        if (!auth.currentUser?.uid) return;
        await deleteDoc(doc(db, "doctors", auth.currentUser.uid, "appointments", apptId));
        setAppointments((prev) => prev.filter((a) => a.id !== apptId));
      } catch (error) {
        console.error("Error deleting appointment:", error);
        alert("حدث خطأ أثناء محاولة حذف الحجز.");
      }
    }
  };

  const exportToCSV = () => {
    // Adding BOM \uFEFF to ensure Arabic characters render perfectly in Excel
    const headers = [
      "تاريخ الحجز",
      "الوقت",
      "اسم المريض",
      "رقم الهاتف",
      "حالة الحجز",
      "تاريخ التسجيل",
    ];
    const csvRows = [headers.join(",")];

    appointments.forEach((appt) => {
      const statusMap: Record<string, string> = {
        completed: "تم الفحص",
        pending: "في الانتظار",
        no_show: "لم يأتي المريض",
      };
      const dateStr = new Date(appt.createdAt).toLocaleString("ar-EG");
      const row = [
        appt.date,
        appt.time || "غير محدد",
        `"${appt.patientName}"`,
        `="${appt.patientPhone}"`, // prepend = to force excel to respect leading zeros in phone
        statusMap[appt.status] || appt.status,
        `"${dateStr}"`,
      ];
      csvRows.push(row.join(","));
    });

    const csvString = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `حجوزات_${profile?.name}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const filteredAppointments = appointments.filter((appt) => {
    if (filter === "today") return appt.date === todayStr;
    if (filter === "upcoming") return appt.date > todayStr;
    if (filter === "past") return appt.date < todayStr;
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
              {profile
                ? "قم بتحديث بيانات العيادة بما يتناسب معك."
                : "لكي يتمكن المرضى من العثور عليك، يرجى إدخال بيانات العيادة."}
            </p>
          </div>
          {profile && (
            <button
              onClick={() => setIsEditingProfile(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              إلغاء
            </button>
          )}
        </div>

        <form
          onSubmit={handleRegisterProfile}
          className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              الاسم الكامل (مع اللقب)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              الجنس
            </label>
            <select
              required
              value={gender}
              onChange={(e) =>
                setGender(e.target.value as "male" | "female" | "")
              }
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              <option value="">اختر الجنس</option>
              <option value="male">ذكر (طبيب)</option>
              <option value="female">أنثى (طبيبة)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              التخصص
            </label>
            <select
              required
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              <option value="">اختر التخصص</option>
              {medicalSpecialties.map((s) => (
                <option key={s.id} value={language === "ar" ? s.ar : s.fr}>
                  {language === "ar" ? s.ar : s.fr}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              الولاية
            </label>
            <select
              required
              value={wilaya}
              onChange={(e) => {
                setWilaya(e.target.value);
                setCommune("");
              }}
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              <option value="">اختر الولاية</option>
              {getWilayas().map((w) => (
                <option key={w.id} value={w.id}>
                  {w.id} - {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              البلدية
            </label>
            <select
              required
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              disabled={!wilaya}
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none disabled:opacity-50"
            >
              <option value="">اختر البلدية</option>
              {getCommunesByWilaya(wilaya).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              عنوان العيادة
            </label>
            <input
              type="text"
              required
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              رقم الهاتف للحجوزات
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none text-left"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              الحد الأقصى للمرضى في اليوم
            </label>
            <input
              type="number"
              required
              min="1"
              value={maxPatientsPerDay}
              onChange={(e) =>
                setMaxPatientsPerDay(parseInt(e.target.value) || 20)
              }
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none text-left"
              dir="ltr"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                بداية الدوام
              </label>
              <input
                type="time"
                value={workingHoursStart}
                onChange={(e) => setWorkingHoursStart(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none text-left"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                نهاية الدوام
              </label>
              <input
                type="time"
                value={workingHoursEnd}
                onChange={(e) => setWorkingHoursEnd(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              أيام العمل
            </label>
            <div className="flex flex-wrap gap-2">
              {["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    if (workingDays.includes(day)) {
                      setWorkingDays(workingDays.filter(d => d !== day));
                    } else {
                      setWorkingDays([...workingDays, day]);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${workingDays.includes(day) ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">نافذة الحجوزات</h3>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="bookingOpenAllDay"
                checked={isBookingOpenAllDay}
                onChange={(e) => setIsBookingOpenAllDay(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="bookingOpenAllDay" className="text-sm font-medium text-slate-700 select-none">
                مفتوح طوال اليوم (24/7)
              </label>
            </div>
            
            {!isBookingOpenAllDay && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                    <span>من الساعة</span>
                  </label>
                  <input
                    type="time"
                    value={bookingWindowStart}
                    onChange={(e) => setBookingWindowStart(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                    <span>إلى الساعة</span>
                  </label>
                  <input
                    type="time"
                    value={bookingWindowEnd}
                    onChange={(e) => setBookingWindowEnd(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
            <input
              type="checkbox"
              id="acceptingAppointments"
              checked={isAcceptingAppointments}
              onChange={(e) => setIsAcceptingAppointments(e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="acceptingAppointments" className="text-sm font-medium text-slate-700 select-none">
              استقبال الحجوزات مفتوح (قم بإلغاء التحديد في حال الإجازة)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              رسالة أو إشعار للمرضى (اختياري)
            </label>
            <textarea
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              placeholder="مثال: أنا في عطلة حتى الأسبوع القادم، أو العيادة تستقبل الحالات المستعجلة فقط..."
              className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none resize-none h-24 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#1E6DFF] to-[#18C5B5] text-white font-bold rounded-[20px] py-4 mt-6 shadow-[0_8px_20px_rgba(24,197,181,0.25)] hover:shadow-[0_12px_25px_rgba(30,109,255,0.35)] hover:-translate-y-0.5 transition-all duration-300"
          >
            حفظ البيانات
          </button>
        </form>
      </div>
    );
  }

  // Dashboard / Sheet
  return (
    <div className="pb-8 bg-slate-100 min-h-screen">
      {profile.status === "pending" && (
        <div className="sticky top-[68px] z-40 bg-amber-100 text-amber-800 p-4 text-sm font-bold text-center border-b border-amber-200 shadow-sm">
          ⚠️{" "}
          {language === "ar"
            ? "حسابك قيد المراجعة من الإدارة. لن تظهر للمرضى حتى تتم الموافقة."
            : "Your account is under review. It will not be visible to patients until approved."}
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1E6DFF] to-[#18C5B5] text-white p-4 pt-8 pb-12 rounded-b-[40px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">لوحة تحكم الطبيب</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowQRModal(true)}
              className="text-indigo-100 hover:text-white transition"
              title={language === "ar" ? "رمز QR" : "Code QR"}
            >
              <QrCode className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsEditingProfile(true)}
              className="text-indigo-100 hover:text-white transition"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button
              onClick={() => signOut(auth)}
              className="text-indigo-100 hover:text-rose-400 transition"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex justify-center items-center backdrop-blur-sm shadow-sm border-2 border-white/30">
            <UserRound className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              د. {profile.name}
              {profile.isVerified && (
                <BadgeCheck className="w-5 h-5 text-blue-400 shrink-0" title={language === 'ar' ? 'حساب موثق' : 'Compte vérifié'} />
              )}
            </h2>
            <p className="text-indigo-200 text-sm">{profile.specialty}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-[-2rem]">
        {/* Stats */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 flex justify-between mb-6">
          <div className="text-center w-1/3 border-l border-slate-100">
            <span className="block text-slate-400 text-xs mb-1 uppercase tracking-widest">
              إجمالي الحجوزات
            </span>
            <div className="font-bold text-slate-800 text-2xl">
              {appointments.length}
            </div>
          </div>
          <div className="text-center w-1/3 border-l border-slate-100">
            <span className="block text-slate-400 text-xs mb-1 uppercase tracking-widest">
              حجوزات اليوم
            </span>
            <div className="font-bold text-indigo-600 text-2xl">
              {
                appointments.filter(
                  (a) => a.date === new Date().toISOString().split("T")[0],
                ).length
              }
            </div>
          </div>
          <div className="text-center w-1/3">
            <span className="block text-slate-400 text-xs mb-1 uppercase tracking-widest">
              التقييم
            </span>
            <div className="font-bold text-amber-500 text-2xl flex justify-center items-center">
              <Star className="w-4 h-4 fill-amber-500 mr-0.5" />
              {profile.rating ? profile.rating.toFixed(1) : "--"}
            </div>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex bg-indigo-50/50 rounded-2xl p-1.5 mb-6 border border-indigo-100/50">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition ${activeTab === "appointments" ? "bg-indigo-600 text-white shadow-md" : "text-indigo-600 hover:bg-indigo-100/50"}`}
          >
            <CalendarCheck className="w-4 h-4" />
            الحجوزات
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition ${activeTab === "reviews" ? "bg-amber-500 text-white shadow-md" : "text-amber-600 hover:bg-amber-100/50"}`}
          >
            <MessageSquareText className="w-4 h-4" />
            التقييمات ({reviews.length})
          </button>
        </div>

        {activeTab === "appointments" ? (
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
              <button
                onClick={() => setFilter("today")}
                className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition ${filter === "today" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                اليوم
              </button>
              <button
                onClick={() => setFilter("upcoming")}
                className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition ${filter === "upcoming" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                القادمة
              </button>
              <button
                onClick={() => setFilter("past")}
                className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition ${filter === "past" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                السابقة
              </button>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-sm">
                  لا توجد حجوزات في هذا القسم.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appt, index) => {
                  const isExpanded = expandedApptId === appt.id;
                  return (
                    <div
                      key={appt.id}
                      className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300"
                    >
                      <div
                        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isExpanded ? "bg-indigo-50/50" : "hover:bg-slate-50"}`}
                        onClick={() =>
                          setExpandedApptId(isExpanded ? null : appt.id || null)
                        }
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${isExpanded ? "bg-green-600 text-white shadow-md shadow-green-200" : "bg-green-100 text-green-700"}`}
                          >
                            <span className="absolute inset-0 rounded-full border-2 border-green-500 animate-[ping_2.5s_ease-in-out_infinite] opacity-75"></span>
                            <span className="relative z-10 border-2 border-green-500 rounded-full w-full h-full flex items-center justify-center">{index + 1}</span>
                          </div>
                          <div>
                            <h4
                              className={`font-bold text-md transition-colors flex items-center gap-2 ${isExpanded ? "text-indigo-900" : "text-slate-800"}`}
                            >
                              {appt.patientName}
                              {appt.status === "confirmed" && (
                                <span className="text-white flex items-center justify-center bg-green-500 rounded-full p-0.5 shadow-sm" title="تم التأكيد">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </h4>
                            <span className="text-xs text-slate-500 font-medium">
                              {appt.status === "confirmed" && (
                                <span className="text-green-600">
                                  تم التأكيد ✅
                                </span>
                              )}
                              {appt.status === "pending" && (
                                <span className="text-amber-500">
                                  في الانتظار ⏳
                                </span>
                              )}
                              {appt.status === "completed" && (
                                <span className="text-emerald-500">
                                  تم الفحص ✅
                                </span>
                              )}
                              {appt.status === "no_show" && (
                                <span className="text-rose-500">
                                  لم يأتي ❌
                                </span>
                              )}
                              {(!appt.status ||
                                (appt.status !== "pending" &&
                                  appt.status !== "confirmed" &&
                                  appt.status !== "completed" &&
                                  appt.status !== "no_show")) && (
                                <span className="text-slate-500">
                                  {appt.status}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-left hidden sm:block">
                            <div className="text-xs font-bold text-slate-700">
                              {appt.time ? appt.time : "--:--"}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {appt.date}
                            </div>
                          </div>
                          <div
                            className={`transform transition-transform text-slate-400 ${isExpanded ? "rotate-180" : "rotate-0"}`}
                          >
                            ▼
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-white animate-in slide-in-from-top-2 fade-in duration-200">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <a
                              href={`tel:${appt.patientPhone}`}
                              className="flex items-center justify-center gap-2 flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm hover:text-indigo-600 hover:border-indigo-200 transition shadow-sm"
                              dir="ltr"
                            >
                              <Phone className="w-4 h-4" />
                              {appt.patientPhone}
                            </a>
                            <div className="flex items-center justify-center gap-2 flex-1 text-xs text-slate-600 font-bold sm:hidden">
                              <Clock className="w-4 h-4 text-indigo-400" />
                              {appt.date} {appt.time && `| ${appt.time}`}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(appt.id!, "confirmed");
                              }}
                              className={`font-bold py-2.5 rounded-xl text-xs transition border ${appt.status === "confirmed" ? "bg-green-100 text-green-800 border-green-300 shadow-sm ring-2 ring-green-500/20" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                            >
                              تم التأكيد ✅
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(appt.id!, "pending");
                              }}
                              className={`font-bold py-2.5 rounded-xl text-xs transition border ${appt.status === "pending" ? "bg-amber-100 text-amber-800 border-amber-300 shadow-sm ring-2 ring-amber-500/20" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                            >
                              في الانتظار ⏳
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(appt.id!, "completed");
                              }}
                              className={`font-bold py-2.5 rounded-xl text-xs transition border ${appt.status === "completed" ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm ring-2 ring-emerald-500/20" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                            >
                              تم الفحص ✅
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(appt.id!, "no_show");
                              }}
                              className={`font-bold py-2.5 rounded-xl text-xs transition border ${appt.status === "no_show" ? "bg-rose-100 text-rose-800 border-rose-300 shadow-sm ring-2 ring-rose-500/20" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                            >
                              لم يأتي ❌
                            </button>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAppointment(appt.id!);
                              }}
                              className="flex items-center gap-2 text-rose-500 hover:text-white px-4 py-2 bg-white border border-rose-200 hover:bg-rose-500 hover:border-rose-500 rounded-xl transition text-xs font-bold shadow-sm"
                              title="حذف الحجز نهائياً"
                            >
                              <Trash2 className="w-4 h-4" />
                              حذف الحجز
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                <p className="text-slate-500 text-sm">
                  لم يقم أي مريض بإضافة تقييم حتى الآن.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-bold text-slate-800 text-md">
                        {review.patientName}
                      </div>
                      <div className="flex text-amber-400 bg-amber-50 px-2 py-1 rounded-lg">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${review.rating >= star ? "fill-amber-400" : "text-amber-100"} mx-0.5`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      "{review.comment}"
                    </p>

                    <div className="text-slate-400 text-[10px] mt-3">
                      تم التقييم في{" "}
                      {new Date(review.createdAt).toLocaleDateString("ar-EG")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showQRModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[1.5rem] w-full max-w-[320px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 relative text-center flex flex-col items-center">
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-3 right-3 p-2 bg-slate-100 text-slate-500 hover:text-slate-700 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
                <QrCode className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {language === "ar" ? "رمز الحجز الخاص بك" : "Votre code de réservation"}
              </h3>
              
              <p className="text-slate-500 text-xs mb-4 leading-relaxed px-2">
                {language === "ar" 
                  ? "دع مرضاك يمسحون هذا الرمز للوصول لصفحة الحجز." 
                  : "Mettez ce code à disposition de vos patients pour accéder à la réservation."}
              </p>

              <div className="bg-white p-3 rounded-xl border-2 border-indigo-50 shadow-sm mb-5 inline-flex justify-center w-auto">
                <QRCodeSVG 
                  value={`${window.location.origin}/doctor/${uid}`} 
                  size={160}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#4f46e5"
                />
              </div>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/doctor/${uid}`);
                  alert(language === 'ar' ? 'تم نسخ الرابط بنجاح!' : 'Lien copié avec succès !');
                }}
                className="w-full bg-slate-100 text-indigo-600 font-bold text-sm py-3 rounded-xl transition hover:bg-slate-200"
              >
                {language === 'ar' ? 'نسخ الرابط المباشر' : 'Copier le lien direct'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
