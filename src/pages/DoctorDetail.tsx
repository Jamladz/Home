import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, addDoc, query, where, getDocs, runTransaction } from "firebase/firestore";
import { db } from "../lib/firebase";
import { DoctorProfile, Appointment, Review } from "../types";
import { MapPin, Phone, Star, UserRound, ArrowRight } from "lucide-react";
import { DoctorAvatar } from "../components/DoctorAvatar";
import { useLanguage } from "../contexts/LanguageContext";

export default function DoctorDetail() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shiftedDate, setShiftedDate] = useState<string | null>(null);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);

  // Review System State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchReviews = async () => {
    if (!doctorId) return;
    try {
      const q = query(collection(db, "reviews"), where("doctorId", "==", doctorId));
      const rSnap = await getDocs(q);
      const revs = rSnap.docs.map(d => ({ ...d.data(), id: d.id } as Review));
      revs.sort((a,b) => b.createdAt - a.createdAt);
      setReviews(revs);
    } catch (e) {
      console.error("Error fetching reviews:", e);
    }
  };

  useEffect(() => {
    async function fetchDoctor() {
      if (!doctorId) return;
      try {
        const docSnap = await getDoc(doc(db, "doctors", doctorId));
        if (docSnap.exists()) {
          setDoctor({ ...(docSnap.data() as DoctorProfile), userId: docSnap.id });
        }
      } catch (error) {
        console.error("Error fetching doctor:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctor();
    fetchReviews();
  }, [doctorId]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !doctor) return;
    setBookingLoading(true);
    setShiftedDate(null);

    try {
      const now = new Date();
      const finalDate = now.toISOString().split('T')[0];
      const finalTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const timeStamp = Date.now();

      await addDoc(collection(db, "appointments"), {
        doctorId,
        patientName,
        patientPhone,
        date: finalDate,
        time: finalTime,
        status: "pending",
        createdAt: timeStamp
      });
      
      // We don't increment patientCount in the doctors doc directly since it's hard to 
      // secure atomically without Cloud Functions, and it leaks concurrency issues.
      // But we will update UI purely for optimism.
      if (doctor) {
        setDoctor({ ...doctor, patientCount: (doctor.patientCount || 0) + 1 });
      }

      setSuccess(true);
      setPatientName("");
      setPatientPhone("");
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      alert(`حدث خطأ أثناء الحجز: ${error.message || "يرجى المحاولة مرة أخرى."}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;
    setIsSubmittingReview(true);
    
    try {
      await runTransaction(db, async (transaction) => {
        const doctorRef = doc(db, "doctors", doctorId);
        const doctorDoc = await transaction.get(doctorRef);
        
        if (!doctorDoc.exists()) throw new Error("Doctor not found");
        
        const data = doctorDoc.data();
        const currentRating = data.rating || 0;
        const currentCount = data.reviewCount || 0;
        
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + reviewRating) / newCount;
        
        transaction.update(doctorRef, { 
          rating: newRating, 
          reviewCount: newCount,
          patientCount: data.patientCount || 0
        });
        
        const newReviewRef = doc(collection(db, "reviews"));
        const reviewData: Review = {
          doctorId,
          patientName: reviewName,
          rating: reviewRating,
          comment: reviewComment,
          createdAt: Date.now()
        };
        transaction.set(newReviewRef, reviewData);
      });
      
      setReviewName("");
      setReviewComment("");
      setReviewRating(5);
      
      // Update local state without full reload
      if (doctor) {
        const currentRating = doctor.rating || 0;
        const currentCount = doctor.reviewCount || 0;
        setDoctor({
          ...doctor,
          rating: ((currentRating * currentCount) + reviewRating) / (currentCount + 1),
          reviewCount: currentCount + 1
        });
      }
      
      fetchReviews();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء حفظ التقييم.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="pb-8 animate-pulse">
        <div className="bg-slate-200 p-4 pt-8 pb-16 relative rounded-b-[40px]">
          <div className="flex flex-col items-center mt-6">
            <div className="w-24 h-24 mb-4 bg-slate-300 rounded-full border-4 border-slate-100"></div>
            <div className="h-6 w-1/3 bg-slate-300 rounded mb-2"></div>
            <div className="h-4 w-1/4 bg-slate-300 rounded"></div>
          </div>
        </div>
        <div className="px-4 mt-[-2rem] relative z-10 space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 h-48"></div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 h-64"></div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-4 pt-8 text-center text-slate-500">
        {language === 'ar' ? 'لم يتم العثور على الطبيب.' : 'Médecin introuvable.'}
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-600 to-indigo-800 text-white p-4 pt-8 pb-16 relative rounded-b-[40px] shadow-sm">
        <button onClick={() => navigate(-1)} className={`absolute top-6 ${language === 'ar' ? 'right-4' : 'left-4'} p-2 bg-white/20 rounded-full hover:bg-white/30 transition`}>
          {language === 'ar' ? <ArrowRight className="w-5 h-5" /> : <svg className="w-5 h-5 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
        </button>
        <div className="flex flex-col items-center mt-6">
          <div className="w-24 h-24 mb-4 font-bold relative group">
            <DoctorAvatar gender={doctor.gender} className="w-24 h-24 border-4 border-indigo-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.1)]" />
          </div>
          <h1 className="text-2xl font-bold">{language === 'ar' ? 'د. ' : 'Dr. '}{doctor.name}</h1>
          <p className="text-indigo-100 font-medium mt-1 mb-4 opacity-90">{doctor.specialty}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-lg relative z-20">
            {(doctor.wilaya || doctor.commune) && (
              <div className="flex items-center text-white/90 bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border border-white/10">
                <MapPin className={`w-3.5 h-3.5 opacity-80 ${language === 'ar' ? 'ml-1.5' : 'mr-1.5'}`} />
                <span>
                  {doctor.wilaya ? `${doctor.wilaya} ` : ''} 
                  {doctor.commune ? `- ${doctor.commune}` : ''}
                </span>
              </div>
            )}
            {doctor.clinicAddress && (
              <div className="flex items-center text-white/80 bg-white/5 px-3 py-1.5 rounded-full text-[11px] border border-white/5 shadow-inner max-w-xs">
                 <span className="truncate">{doctor.clinicAddress}</span>
              </div>
            )}
            {doctor.phone && (
              <a href={`tel:${doctor.phone}`} className="flex items-center text-white font-bold bg-indigo-500/50 hover:bg-indigo-500 transition-all px-3 py-1.5 rounded-full text-xs backdrop-blur-md border border-indigo-400/50 shadow-sm transform hover:scale-105 active:scale-95">
                <Phone className={`w-3.5 h-3.5 ${language === 'ar' ? 'ml-1.5' : 'mr-1.5'}`} />
                <span dir="ltr">{doctor.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mt-[-2rem] relative z-20 space-y-4">
        {/* Booking Form */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-100 p-6 relative overflow-hidden" id="bookingForm">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <h2 className="text-lg font-bold text-slate-800 mb-5">{language === 'ar' ? 'احجز موعداً الآن' : 'Prendre un rendez-vous'}</h2>

          {doctor.noticeMessage && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl mb-5 text-sm font-bold shadow-sm flex flex-col gap-1 items-start">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> اشعار لتحديث الموعد:</span>
              <pre className="font-sans whitespace-pre-wrap text-xs text-amber-700/90">{doctor.noticeMessage}</pre>
            </div>
          )}

          {(() => {
            if (doctor.isAcceptingAppointments === false) {
              return (
                 <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl mt-4 text-sm font-bold text-center shadow-[inset_0_2px_10px_rgba(200,0,0,0.05)]">
                   {language === 'ar' 
                     ? 'عذراً! الطبيب لا يستقبل حجوزات جديدة في الوقت الحالي بسبب إجازة أو لظروف أخرى. يرجى المراجعة لاحقاً.'
                     : 'Désolé! Ce médecin n\'accepte pas de nouvelles réservations pour le moment. Veuillez vérifier plus tard.'}
                 </div>
              );
            }

            if (!doctor.isBookingOpenAllDay && doctor.bookingWindow) {
              const now = new Date();
              const currentMinutes = now.getHours() * 60 + now.getMinutes();
              
              const [startH, startM] = doctor.bookingWindow.start.split(':').map(Number);
              const startMinutes = startH * 60 + startM;
              
              const [endH, endM] = doctor.bookingWindow.end.split(':').map(Number);
              let endMinutes = endH * 60 + endM;
              
              let isWithinWindow = false;
              
              if (endMinutes < startMinutes) {
                // Window crosses midnight (e.g., 18:00 to 02:00)
                isWithinWindow = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
              } else {
                // Normal window (e.g., 08:00 to 16:00)
                isWithinWindow = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
              }

              if (!isWithinWindow) {
                return (
                 <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-6 rounded-2xl mt-4 text-sm font-bold text-center shadow-[inset_0_2px_10px_rgba(200,0,0,0.05)]">
                   {language === 'ar' 
                     ? `الحجز غير متاح الآن. يرجى الحجز بين الساعة ${doctor.bookingWindow.start} و ${doctor.bookingWindow.end}.`
                     : `La réservation n'est pas disponible actuellement. Veuillez réserver entre ${doctor.bookingWindow.start} et ${doctor.bookingWindow.end}.`}
                 </div>
                );
              }
            }

            if (success) {
              return (
                <div className="bg-green-50/50 p-6 rounded-2xl text-center border border-green-100 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-100/50 rounded-full blur-2xl"></div>
                  <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-green-100/50 rounded-full blur-2xl"></div>
                  
                  <div className="inline-block p-3 bg-green-500 rounded-full mb-4 shadow-sm shadow-green-200 relative z-10">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h3 className="text-lg font-bold text-green-700 mb-2 relative z-10">{language === 'ar' ? 'تم الحجز بنجاح!' : 'Réservation réussie !'}</h3>
                  
                  <p className="text-xs text-slate-600 max-w-[250px] mx-auto leading-relaxed relative z-10 my-4">
                    {language === 'ar' ? 'سيتم التواصل معك قريباً لتأكيد الموعد.' : 'Vous serez contacté prochainement pour confirmer.'}
                  </p>

                  <button 
                    onClick={() => { setSuccess(false); setQueueNumber(null); }}
                    className="mt-6 px-6 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 hover:border-slate-300 transition-all w-full relative z-10"
                  >
                    {language === 'ar' ? 'حجز موعد آخر' : 'Nouveau rendez-vous'}
                  </button>
                </div>
              );
            }

            return (
              <form onSubmit={handleBooking} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">{language === 'ar' ? 'الاسم الكامل' : 'Nom complet'}</label>
                  <div className="relative">
                    <UserRound className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-3.5 w-5 h-5 text-slate-400`} />
                    <input 
                      type="text" 
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className={`w-full border border-slate-200 bg-slate-50/50 rounded-2xl py-3.5 ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:outline-none focus:bg-white text-sm transition-all`} 
                      placeholder={language === 'ar' ? "مثال: محمد أحمد" : "Ex: Mohamed Ahmed"}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">{language === 'ar' ? 'رقم الهاتف' : 'Numéro de téléphone'}</label>
                  <div className="relative">
                    <Phone className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-3.5 w-5 h-5 text-slate-400`} />
                    <input 
                      type="tel" 
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className={`w-full border border-slate-200 bg-slate-50/50 rounded-2xl py-3.5 ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:outline-none focus:bg-white text-sm text-left transition-all`} 
                      placeholder="05xx xx xx xx"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={bookingLoading}
                  className="w-full bg-indigo-600 text-white font-bold rounded-2xl py-4 mt-2 shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {bookingLoading 
                    ? (language === 'ar' ? "جاري الحجز..." : "Réservation...") 
                    : (language === 'ar' ? "تأكيد الحجز" : "Confirmer le rendez-vous")}
                </button>
              </form>
            );
          })()}

          {/* Working Hours Display */}
          {doctor.workingHours && (
            <div className="mt-5 border-t border-slate-100 pt-4 flex justify-between items-center text-xs text-slate-500">
              <div className="font-medium text-slate-600">
                {language === 'ar' ? 'أوقات العمل:' : 'Heures de travail :'}
              </div>
              <div className="bg-slate-100 px-3 py-1.5 rounded-full font-bold text-slate-700" dir="ltr">
                {doctor.workingHours.start} - {doctor.workingHours.end}
              </div>
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-center">
            <div className="text-center w-1/3">
              <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">{language === 'ar' ? 'التقييم' : 'Note'}</span>
              <div className="flex items-center justify-center text-amber-500 font-bold text-lg cursor-pointer hover:scale-105 transition" onClick={() => document.getElementById('reviewsSection')?.scrollIntoView({ behavior: 'smooth' })}>
                <Star className="w-4 h-4 fill-amber-500 mr-1" />
                {doctor.rating ? doctor.rating.toFixed(1) : '--'}
              </div>
            </div>
            <div className="w-px h-10 bg-slate-100"></div>
            <div className="text-center w-1/3">
              <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">{language === 'ar' ? 'المراجعات' : 'Avis'}</span>
              <div className="font-bold text-slate-700 text-lg">{doctor.reviewCount || 0}</div>
            </div>
            <div className="w-px h-10 bg-slate-100"></div>
            <div className="text-center w-1/3">
              <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">{language === 'ar' ? 'المرضى' : 'Patients'}</span>
              <div className="font-bold text-slate-700 text-lg">{(doctor.patientCount || 0)}</div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviewsSection" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 scroll-mt-24">
          <h2 className="text-lg font-bold text-slate-700 mb-5 flex items-center">
            <Star className={`w-5 h-5 fill-amber-500 text-amber-500 ${language === 'ar' ? 'mr-2' : 'mr-2'}`} />
            {language === 'ar' ? 'آراء وتقييمات المرضى' : 'Avis des patients'}
          </h2>

          <div className="space-y-4 mb-8">
            {reviews.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4 bg-slate-50 rounded-2xl border border-slate-100 items-center justify-center">
                {language === 'ar' ? 'لا توجد تقييمات لهذا الطبيب حتى الآن.' : 'Aucun avis pour le moment.'}
              </p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-slate-800 text-sm">{review.patientName}</div>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`w-3.5 h-3.5 ${review.rating >= star ? 'fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                  <div className="text-slate-400 text-[10px] mt-2">
                    {new Date(review.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'fr-FR')}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100">
            <h3 className="text-md font-bold text-slate-700 mb-4">{language === 'ar' ? 'أضف تقييمك' : 'Ajouter un avis'}</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex justify-center gap-2 py-2" dir="ltr">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    type="button" 
                    onClick={() => setReviewRating(star)} 
                    className="focus:outline-none hover:scale-110 transition cursor-pointer"
                  >
                    <Star className={`w-8 h-8 ${reviewRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
              <div>
                <input 
                  type="text" 
                  required
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none text-sm" 
                  placeholder={language === 'ar' ? "اسمك الكريم" : "Votre nom"}
                />
              </div>
              <div>
                <textarea 
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none text-sm resize-none" 
                  placeholder={language === 'ar' ? "كيف كانت تجربتك مع هذا الطبيب؟" : "Parlez-nous de votre expérience..."}
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmittingReview}
                className="w-full bg-slate-800 text-white font-bold rounded-xl py-3 shadow-sm hover:bg-slate-900 transition disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                {isSubmittingReview 
                  ? (language === 'ar' ? "جاري الإرسال..." : "Envoi en cours...") 
                  : (language === 'ar' ? "نشر التقييم" : "Publier l'avis")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
