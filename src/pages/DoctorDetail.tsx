import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, addDoc, query, where, getDocs, runTransaction } from "firebase/firestore";
import { db } from "../lib/firebase";
import { DoctorProfile, Appointment, Review } from "../types";
import { MapPin, Phone, Star, UserRound, ArrowRight } from "lucide-react";

export default function DoctorDetail() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shiftedDate, setShiftedDate] = useState<string | null>(null);

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
      let finalDate = date;
      
      // Auto-shift date logic if max patients per day is reached
      if (doctor.maxPatientsPerDay) {
        let isFull = true;
        let currentDateToCheck = new Date(date);
        
        while (isFull) {
          const checkDateStr = currentDateToCheck.toISOString().split('T')[0];
          const q = query(
            collection(db, "appointments"), 
            where("doctorId", "==", doctorId),
            where("date", "==", checkDateStr)
          );
          const apptSnap = await getDocs(q);
          
          if (apptSnap.docs.length >= doctor.maxPatientsPerDay) {
            // Day is full, shift to next day
            currentDateToCheck.setDate(currentDateToCheck.getDate() + 1);
          } else {
            // Found a day with available slots
            finalDate = checkDateStr;
            if (finalDate !== date) {
              setShiftedDate(finalDate);
            }
            isFull = false;
          }
        }
      }

      // 1. Save to Firebase Database within a transaction to increment patientCount
      await runTransaction(db, async (transaction) => {
        const doctorRef = doc(db, "doctors", doctorId);
        const doctorDoc = await transaction.get(doctorRef);
        
        if (doctorDoc.exists()) {
          const currentPatientCount = doctorDoc.data().patientCount || 0;
          transaction.update(doctorRef, {
            patientCount: currentPatientCount + 1
          });
        }
        
        const newApptRef = doc(collection(db, "appointments"));
        transaction.set(newApptRef, {
          doctorId,
          patientName,
          patientPhone,
          date: finalDate,
          time,
          status: "pending",
          createdAt: Date.now()
        });
      });
      
      // Update local state for patient count
      if (doctor) {
        setDoctor({ ...doctor, patientCount: (doctor.patientCount || 0) + 1 });
      }

      setSuccess(true);
      setPatientName("");
      setPatientPhone("");
      setDate("");
      setTime("");
    } catch (error) {
      console.error("Error booking appointment:", error);
      alert("حدث خطأ أثناء الحجز. يرجى المحاولة مرة أخرى.");
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
          reviewCount: newCount 
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
      <div className="flex justify-center mt-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-4 pt-8 text-center text-slate-500">
        لم يتم العثور على الطبيب.
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-600 to-indigo-800 text-white p-4 pt-8 pb-16 relative rounded-b-[40px] shadow-sm">
        <button onClick={() => navigate(-1)} className="absolute top-6 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center mt-6">
          <div className="w-24 h-24 bg-white text-indigo-700 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.1)] border-4 border-indigo-500/30 mb-4 font-bold">
            <UserRound className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold">د. {doctor.name}</h1>
          <p className="text-indigo-100 font-medium mt-1 opacity-90">{doctor.specialty}</p>
        </div>
      </div>

      <div className="px-4 mt-[-2rem] relative z-10 space-y-4">
        {/* Info Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-center pb-5 border-b border-slate-100">
            <div className="text-center w-1/3">
              <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">التقييم</span>
              <div className="flex items-center justify-center text-amber-500 font-bold text-lg cursor-pointer hover:scale-105 transition" onClick={() => document.getElementById('reviewsSection')?.scrollIntoView({ behavior: 'smooth' })}>
                <Star className="w-4 h-4 fill-amber-500 mr-1" />
                {doctor.rating ? doctor.rating.toFixed(1) : '--'}
              </div>
            </div>
            <div className="w-px h-10 bg-slate-100"></div>
            <div className="text-center w-1/3">
              <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">المراجعات</span>
              <div className="font-bold text-slate-700 text-lg">{doctor.reviewCount || 0}</div>
            </div>
            <div className="w-px h-10 bg-slate-100"></div>
            <div className="text-center w-1/3">
              <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">المرضى</span>
              <div className="font-bold text-slate-700 text-lg">{(doctor.patientCount || 0)}</div>
            </div>
          </div>

          <div className="mt-5 space-y-3 px-2">
            {(doctor.wilaya || doctor.commune) && (
              <div className="flex items-center text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <MapPin className="w-5 h-5 text-indigo-500 mr-3 shrink-0" />
                <span className="text-xs font-medium">
                  {doctor.wilaya ? `${doctor.wilaya} ` : ''} 
                  {doctor.commune ? `- ${doctor.commune}` : ''}
                </span>
              </div>
            )}
            <div className="flex items-center text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <MapPin className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
              <span className="text-[10px] text-slate-500">{doctor.clinicAddress}</span>
            </div>
            {doctor.phone && (
              <div className="flex items-center text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Phone className="w-5 h-5 text-indigo-500 mr-3 shrink-0" />
                <span className="text-xs font-medium" dir="ltr">{doctor.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-700 mb-5">احجز موعداً</h2>
          
          {success ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center border border-green-100">
              <div className="inline-block p-2 bg-green-100 rounded-full mb-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="font-bold">تم الحجز بنجاح!</h3>
              {shiftedDate && (
                <div className="mt-3 p-3 bg-amber-100 text-amber-800 rounded-lg border border-amber-200 text-sm">
                  <span className="font-bold block mb-1">تنبيه حصة اليوم ممتلئة:</span>
                  بما أن حصة الطبيب لهذا اليوم ممتلئة، تم تسجيل الحجز تلقائياً في أول يوم متاح: <strong className="block mt-1 text-base" dir="ltr">{shiftedDate}</strong>
                </div>
              )}
              <p className="text-sm mt-3">سيتم التواصل معك لتأكيد الموعد.</p>
              <button 
                onClick={() => { setSuccess(false); setShiftedDate(null); }}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
              >
                حجز موعد آخر
              </button>
            </div>
          ) : (
            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل</label>
                <input 
                  type="text" 
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none focus:bg-white text-sm" 
                  placeholder="محمد أحمد"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                <input 
                  type="tel" 
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none focus:bg-white text-sm text-left" 
                  placeholder="05xx xx xx xx"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none focus:bg-white text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الوقت (اختياري)</label>
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none focus:bg-white text-sm" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={bookingLoading}
                className="w-full bg-indigo-600 text-white font-bold rounded-2xl py-3.5 mt-2 shadow-sm hover:bg-indigo-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {bookingLoading ? "جاري الحجز..." : "تأكيد الحجز"}
              </button>
            </form>
          )}
        </div>

        {/* Reviews Section */}
        <div id="reviewsSection" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 scroll-mt-24">
          <h2 className="text-lg font-bold text-slate-700 mb-5 flex items-center">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500 mr-2" />
            آراء وتقييمات المرضى
          </h2>

          <div className="space-y-4 mb-8">
            {reviews.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4 bg-slate-50 rounded-2xl border border-slate-100 items-center justify-center">
                لا توجد تقييمات لهذا الطبيب حتى الآن.
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
                    {new Date(review.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100">
            <h3 className="text-md font-bold text-slate-700 mb-4">أضف تقييمك</h3>
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
                  placeholder="اسمك الكريم"
                />
              </div>
              <div>
                <textarea 
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none text-sm resize-none" 
                  placeholder="كيف كانت تجربتك مع هذا الطبيب؟"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmittingReview}
                className="w-full bg-slate-800 text-white font-bold rounded-xl py-3 shadow-sm hover:bg-slate-900 transition disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                {isSubmittingReview ? "جاري الإرسال..." : "نشر التقييم"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
