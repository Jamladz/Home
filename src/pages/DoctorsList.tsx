import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { DoctorProfile } from "../types";
import { Link } from "react-router-dom";
import { MapPin, Star, UserRound, Search, Filter } from "lucide-react";
import { getWilayas, getCommunesByWilaya } from "../lib/algeria_data";
import { DoctorAvatar } from "../components/DoctorAvatar";
import { useLanguage } from "../contexts/LanguageContext";
import { motion } from "motion/react";

export default function DoctorsList() {
  const { language } = useLanguage();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering state
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [selectedCommune, setSelectedCommune] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
        const docsData = querySnapshot.docs.map(doc => ({
          ...(doc.data() as DoctorProfile),
          userId: doc.id
        }));
        setDoctors(docsData);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, [selectedWilaya, selectedCommune]);

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="p-4 pt-8 pb-20">
      <h1 className="text-2xl font-bold text-slate-700 mb-4">{language === 'ar' ? 'قائمة الأطباء' : 'Liste des Médecins'}</h1>

      {/* Search and Filters */}
      <div className="mb-6 space-y-3">
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

        <div className="flex gap-2">
          <select 
            value={selectedWilaya} 
            onChange={(e) => { setSelectedWilaya(e.target.value); setSelectedCommune(""); }}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">{language === 'ar' ? 'كل الولايات' : 'Toutes les wilayas'}</option>
            {getWilayas().map(w => (
              <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
            ))}
          </select>
          
          <select 
            value={selectedCommune} 
            onChange={(e) => setSelectedCommune(e.target.value)}
            disabled={!selectedWilaya}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:bg-slate-50"
          >
            <option value="">{language === 'ar' ? 'كل البلديات' : 'Toutes les communes'}</option>
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
      ) : doctors.length === 0 ? (
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
          {filteredDoctors.map(doctor => (
            <motion.div variants={itemVariants} key={doctor.userId}>
              <Link 
                to={`/doctors/${doctor.userId}`}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex items-center gap-4 transition hover:border-indigo-300 hover:shadow-md group block"
              >
                <div className="w-16 h-16 shrink-0 relative">
                  <DoctorAvatar gender={doctor.gender} className="w-16 h-16 group-hover:scale-105 transition-transform" />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                    <div className="bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm mb-0.5">{language === 'ar' ? 'د. ' : 'Dr. '}{doctor.name}</h3>
                  <p className="text-slate-500 text-[11px] mb-1.5 font-medium">{doctor.specialty}</p>
                  <div className="flex items-center text-slate-400 text-[10px] mb-1">
                    <MapPin className={`w-3 h-3 text-indigo-400 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                    <span className="truncate max-w-[120px]">
                      {doctor.wilaya ? `${doctor.wilaya} ` : ''} 
                      {doctor.commune ? `- ${doctor.commune}` : ''}
                    </span>
                  </div>
                  <div className={`text-slate-300 text-[9px] truncate max-w-[150px] ${language === 'ar' ? 'mr-4' : 'ml-4'}`}>
                    {doctor.clinicAddress}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-amber-50 p-2.5 rounded-xl border border-amber-100 min-w-[55px]">
                  <div className="flex items-center text-amber-500 font-black text-sm">
                    {doctor.rating ? doctor.rating.toFixed(1) : '--'}
                  </div>
                  <div className="flex items-center text-amber-400 mt-0.5 whitespace-nowrap">
                    <Star className={`w-3 h-3 fill-amber-400 ${language === 'ar' ? 'ml-0.5' : 'mr-0.5'}`} />
                    <span className="text-[10px] text-amber-600/80 font-bold ml-0.5">
                      ({doctor.reviewCount || 0})
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
