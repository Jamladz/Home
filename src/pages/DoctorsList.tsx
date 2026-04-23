import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { DoctorProfile } from "../types";
import { Link } from "react-router-dom";
import { MapPin, Star, UserRound, Search, Filter } from "lucide-react";
import { getWilayas, getCommunesByWilaya } from "../lib/algeria_data";

export default function DoctorsList() {
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

  return (
    <div className="p-4 pt-8 pb-20">
      <h1 className="text-2xl font-bold text-slate-700 mb-4">قائمة الأطباء</h1>

      {/* Search and Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <input 
            type="text" 
            placeholder="ابحث بالاسم أو التخصص..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-11 py-3.5 rounded-2xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm border border-slate-200"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        </div>

        <div className="flex gap-2">
          <select 
            value={selectedWilaya} 
            onChange={(e) => { setSelectedWilaya(e.target.value); setSelectedCommune(""); }}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">كل الولايات</option>
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
            <option value="">كل البلديات</option>
            {selectedWilaya && getCommunesByWilaya(selectedWilaya).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center mt-20 text-slate-500">
          <UserRound className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p>لا يوجد أطباء مطابِقين لبحثك حالياً.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoctors.map(doctor => (
            <Link 
              key={doctor.userId} 
              to={`/doctors/${doctor.userId}`}
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex items-center gap-4 transition hover:border-indigo-300"
            >
              <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center shrink-0 font-bold">
                <UserRound className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-700 text-sm">د. {doctor.name}</h3>
                <p className="text-slate-500 text-[10px] mb-1">{doctor.specialty}</p>
                <div className="flex items-center text-slate-500 text-[10px] mb-1">
                  <MapPin className="w-3 h-3 mr-1 text-indigo-400" />
                  <span>
                    {doctor.wilaya ? `${doctor.wilaya} ` : ''} 
                    {doctor.commune ? `- ${doctor.commune}` : ''}
                  </span>
                </div>
                <div className="text-slate-400 text-[9px] mr-4 truncate max-w-[150px]">
                  {doctor.clinicAddress}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-slate-50 p-2 rounded-xl border border-slate-100 min-w-[50px]">
                <div className="flex items-center text-amber-500 font-bold text-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                  {doctor.rating ? doctor.rating.toFixed(1) : '--'}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  ({doctor.reviewCount || 0} تقييم)
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
