import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { DoctorProfile, DirectoryDoctor } from "../types";
import { Link, useLocation } from "react-router-dom";
import { MapPin, Star, UserRound, Search, Filter, QrCode, X, BadgeCheck, BookUser } from "lucide-react";
import { getWilayas, getCommunesByWilaya } from "../lib/algeria_data";
import { medicalSpecialties } from "../lib/medical_specialties";
import { DoctorAvatar } from "../components/DoctorAvatar";
import { useLanguage } from "../contexts/LanguageContext";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-hot-toast";

type UnifiedDoctor = {
  type: 'platform';
  data: DoctorProfile;
} | {
  type: 'directory';
  data: DirectoryDoctor;
};

export default function DoctorsList() {
  const { language } = useLanguage();
  const location = useLocation();
  const [unifiedDoctors, setUnifiedDoctors] = useState<UnifiedDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDoctorId, setQrDoctorId] = useState<string | null>(null);
  
  // Filtering state
  const [selectedSpecialty, setSelectedSpecialty] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('specialty') || "";
  });
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [selectedCommune, setSelectedCommune] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'platform' | 'directory'>('platform');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const specialtyFromUrl = params.get('specialty');
    if (specialtyFromUrl !== null && specialtyFromUrl !== selectedSpecialty) {
      setSelectedSpecialty(specialtyFromUrl);
    }
  }, [location.search]);

  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      try {
        let q = collection(db, "doctors") as any;
        
        // Add pending check
        q = query(q, where("status", "==", "approved"));
        
        if (selectedWilaya) {
          q = query(q, where("wilaya", "==", selectedWilaya));
        }
        if (selectedCommune) {
          q = query(q, where("commune", "==", selectedCommune));
        }

        const querySnapshot = await getDocs(q);
        const platformDocs = querySnapshot.docs.map(doc => ({
          type: 'platform' as const,
          data: { ...(doc.data() as DoctorProfile), userId: doc.id }
        }));

        let dirQ = collection(db, "directory_doctors") as any;
        if (selectedWilaya) {
          dirQ = query(dirQ, where("wilaya", "==", selectedWilaya));
        }
        if (selectedCommune) {
          dirQ = query(dirQ, where("commune", "==", selectedCommune));
        }

        const dirSnapshot = await getDocs(dirQ);
        const directoryDocs = dirSnapshot.docs.map(doc => ({
          type: 'directory' as const,
          data: { ...(doc.data() as DirectoryDoctor), id: doc.id }
        }));

        setUnifiedDoctors([...platformDocs, ...directoryDocs]);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, [selectedWilaya, selectedCommune]);

  // Client side filtering for specialty and search
  const filteredDoctors = unifiedDoctors.filter(item => {
    if (item.type !== viewMode) return false;

    const doc = item.data;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
                          
    let matchesSpecialty = true;
    if (selectedSpecialty) {
      // Find the specialty label, doc.specialty might be the string in AR or FR.
      const spec = medicalSpecialties.find(s => s.id === selectedSpecialty);
      if (spec) {
         matchesSpecialty = doc.specialty === spec.ar || doc.specialty === spec.fr || doc.specialty === selectedSpecialty;
      }
    }
    
    return matchesSearch && matchesSpecialty;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.05 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="pb-20">
      {/* View Mode Toggle - Sticky right below the top header */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 mb-6 shadow-sm -mx-0">
        <div className="flex p-1.5 bg-slate-100/80 shadow-inner rounded-xl border border-slate-200/50 w-full max-w-md mx-auto relative">
          <button
            onClick={() => setViewMode('platform')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 relative z-10 ${
              viewMode === 'platform' 
                ? 'text-indigo-600' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            {viewMode === 'platform' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200/50"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <BadgeCheck className={`w-4 h-4 ${viewMode === 'platform' ? 'text-indigo-500' : 'opacity-70'}`} />
              {language === 'ar' ? 'أطباء معتمدين' : 'Médecins vérifiés'}
            </span>
          </button>
          <button
            onClick={() => setViewMode('directory')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 relative z-10 ${
              viewMode === 'directory' 
                ? 'text-emerald-600' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            {viewMode === 'directory' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200/50"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <BookUser className={`w-4 h-4 ${viewMode === 'directory' ? 'text-emerald-500' : 'opacity-70'}`} />
              {language === 'ar' ? 'دليل الأطباء' : 'Annuaire Médical'}
            </span>
          </button>
        </div>
      </div>

      <div className="px-4">
        <h1 className="text-2xl font-bold text-slate-700 mb-4">{language === 'ar' ? 'قائمة الأطباء' : 'Liste des Médecins'}</h1>

        {/* Search and Filters */}
        <div className="mb-6 space-y-3 relative z-30">
        <div className="relative">
          <input 
            type="text" 
            placeholder={language === 'ar' ? "ابحث بالاسم أو التخصص..." : "Chercher par nom ou spécialité..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-3.5 rounded-2xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm border border-slate-200 ${language === 'ar' ? 'pl-4 pr-11' : 'pl-11 pr-4'}`}
          />
          <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5`} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <select 
            value={selectedSpecialty} 
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full bg-[#1E6DFF]/5 border border-[#1E6DFF]/30 rounded-xl px-2 py-2.5 text-xs font-semibold text-[#1E6DFF] focus:outline-none focus:ring-2 focus:ring-[#1E6DFF]/40 focus:border-[#1E6DFF]/50 hover:bg-[#1E6DFF]/10 transition-colors cursor-pointer"
          >
            <option value="">{language === 'ar' ? 'التخصص' : 'Spécialité'}</option>
            {medicalSpecialties.map(spec => (
              <option key={spec.id} value={spec.id}>
                {language === 'ar' ? spec.ar : spec.fr}
              </option>
            ))}
          </select>
          
          <select 
            value={selectedWilaya} 
            onChange={(e) => { setSelectedWilaya(e.target.value); setSelectedCommune(""); }}
            className="w-full bg-[#18C5B5]/5 border border-[#18C5B5]/30 rounded-xl px-2 py-2.5 text-xs font-semibold text-[#18C5B5] focus:outline-none focus:ring-2 focus:ring-[#18C5B5]/40 focus:border-[#18C5B5]/50 hover:bg-[#18C5B5]/10 transition-colors cursor-pointer"
          >
            <option value="">{language === 'ar' ? 'الولاية' : 'Wilaya'}</option>
            {getWilayas().map(w => (
              <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
            ))}
          </select>
          
          <select 
            value={selectedCommune} 
            onChange={(e) => setSelectedCommune(e.target.value)}
            disabled={!selectedWilaya}
            className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-2 py-2.5 text-xs font-semibold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/50 hover:bg-indigo-100/50 transition-colors cursor-pointer disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <option value="">{language === 'ar' ? 'البلدية' : 'Commune'}</option>
            {selectedWilaya && getCommunesByWilaya(selectedWilaya).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex items-center gap-4 animate-pulse">
              <div className="w-16 h-16 bg-slate-200 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-2.5">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                <div className="h-3 bg-slate-100 rounded w-1/4 mt-2"></div>
              </div>
              <div className="w-[50px] h-12 bg-slate-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mt-20 text-slate-500">
          <UserRound className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p>{language === 'ar' ? 'لا يوجد أطباء مطابِقين لبحثك حالياً.' : 'Aucun médecin ne correspond à votre recherche.'}</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filteredDoctors.map(item => {
            if (item.type === 'platform') {
              const doc = item.data as DoctorProfile;
              return (
                <motion.div variants={itemVariants} key={doc.userId} className="relative">
                  <Link 
                    to={`/doctors/${doc.userId}`}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex items-center gap-4 transition hover:border-indigo-300 hover:shadow-md group block relative overflow-hidden"
                  >
                    <div className="w-16 h-16 shrink-0 relative">
                      <DoctorAvatar gender={doc.gender} className="w-16 h-16 group-hover:scale-105 transition-transform" />
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                        <div className="bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1">
                        {language === 'ar' ? 'د. ' : 'Dr. '}{doc.name}
                        {doc.isVerified && (
                          <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" title={language === 'ar' ? 'حساب موثق' : 'Compte vérifié'} />
                        )}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="inline-flex text-[10px] items-center px-2 py-0.5 rounded-md font-bold bg-[#1E6DFF]/10 text-[#1E6DFF]">
                          {doc.specialty}
                        </span>
                        
                        {(doc.wilaya || doc.commune) && (
                          <span className="inline-flex text-[10px] items-center px-2 py-0.5 rounded-md font-bold bg-[#18C5B5]/10 text-[#18C5B5]">
                            <MapPin className={`w-3 h-3 ${language === 'ar' ? 'ml-0.5' : 'mr-0.5'}`} />
                            <span className="truncate max-w-[120px]">
                              {doc.wilaya ? `${doc.wilaya} ` : ''} 
                              {doc.commune ? `- ${doc.commune}` : ''}
                            </span>
                          </span>
                        )}
                      </div>
                      
                      <div className={`text-slate-400 text-[9px] truncate max-w-[150px] ${language === 'ar' ? 'mr-4' : 'ml-4'}`}>
                        {doc.clinicAddress}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-amber-50 p-2.5 rounded-xl border border-amber-100 min-w-[55px]">
                      <div className="flex items-center text-amber-500 font-black text-sm">
                        {doc.rating ? doc.rating.toFixed(1) : '--'}
                      </div>
                      <div className="flex items-center text-amber-400 mt-0.5 whitespace-nowrap">
                        <Star className={`w-3 h-3 fill-amber-400 ${language === 'ar' ? 'ml-0.5' : 'mr-0.5'}`} />
                        <span className="text-[10px] text-amber-600/80 font-bold ml-0.5">
                          ({doc.reviewCount || 0})
                        </span>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQrDoctorId(doc.userId!);
                    }}
                    className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} p-2.5 bg-white/80 backdrop-blur text-[#1E6DFF] rounded-full shadow-sm hover:scale-110 transition-transform hover:bg-slate-50`}
                  >
                    <QrCode className="w-5 h-5 flex-shrink-0" />
                  </button>
                </motion.div>
              );
            } else {
              const doc = item.data as DirectoryDoctor;
              return (
                <motion.div variants={itemVariants} key={doc.id} className="relative">
                  <div 
                    onClick={() => {
                      toast(language === 'ar' ? 'هذا الطبيب لم ينضم بعد إلى التطبيق، سيتوفر قريباً إن شاء الله' : 'Ce médecin n\'a pas encore rejoint l\'application, il sera bientôt disponible Insha\'Allah', {
                        icon: '⏳',
                        style: {
                          borderRadius: '16px',
                          background: '#f8fafc',
                          color: '#334155',
                          fontSize: '13px',
                          fontWeight: '600'
                        }
                      });
                    }}
                    className="bg-slate-50 opacity-90 rounded-3xl p-4 shadow-sm border border-slate-200/60 flex items-center gap-4 relative overflow-hidden cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-14 h-14 shrink-0 relative bg-indigo-100/50 rounded-full flex items-center justify-center">
                       <BookUser className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1.5">
                        <h3 className="font-bold text-slate-700 text-sm mb-0.5">
                          {language === 'ar' ? 'د. ' : 'Dr. '}{doc.name}
                        </h3>
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                          <UserRound className="w-3 h-3" />
                          {language === 'ar' ? 'غير معتمد' : 'Non vérifié'}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="inline-flex text-[10px] items-center px-2 py-0.5 rounded-md font-bold bg-slate-200 text-slate-600">
                          {doc.specialty}
                        </span>
                        
                        {(doc.wilaya || doc.commune) && (
                          <span className="inline-flex text-[10px] items-center px-2 py-0.5 rounded-md font-bold bg-slate-200 text-slate-600">
                            <MapPin className={`w-3 h-3 ${language === 'ar' ? 'ml-0.5' : 'mr-0.5'}`} />
                            <span className="truncate max-w-[200px]">
                              {doc.wilaya ? `${doc.wilaya} ` : ''} 
                              {doc.commune ? `- ${doc.commune}` : ''}
                            </span>
                          </span>
                        )}
                      </div>
                      
                      <div className={`text-slate-400 text-[9px] truncate max-w-[220px] ${language === 'ar' ? 'mr-4' : 'ml-4'}`}>
                        {doc.address}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }
          })}
        </motion.div>
      )}

      {qrDoctorId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[1.5rem] w-full max-w-[320px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 relative text-center flex flex-col items-center">
              <button
                onClick={() => setQrDoctorId(null)}
                className="absolute top-3 right-3 p-2 bg-slate-100 text-slate-500 hover:text-slate-700 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-12 h-12 bg-[#1E6DFF]/10 text-[#1E6DFF] rounded-2xl flex items-center justify-center mb-3">
                <QrCode className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {language === "ar" ? "تبادل صفحة الحجز" : "Partager la page"}
              </h3>
              
              <p className="text-slate-500 text-xs mb-4 leading-relaxed px-2">
                {language === "ar" 
                  ? "امسح الرمز للوصول لصفحة الحجز الخاصة بهذا الطبيب." 
                  : "Scannez ce code pour accéder à la page de réservation de ce médecin."}
              </p>

              <div className="bg-white p-3 rounded-xl border-2 border-indigo-50 shadow-sm mb-5 inline-flex justify-center w-auto">
                <QRCodeSVG 
                  value={`${window.location.origin}/doctor/${qrDoctorId}`} 
                  size={160}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/doctor/${qrDoctorId}`);
                  alert(language === 'ar' ? 'تم نسخ الرابط بنجاح!' : 'Lien copié avec succès !');
                }}
                className="w-full bg-slate-100 text-[#1E6DFF] font-bold text-sm py-3 rounded-xl transition hover:bg-slate-200"
              >
                {language === 'ar' ? 'نسخ الرابط المباشر' : 'Copier le lien direct'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
