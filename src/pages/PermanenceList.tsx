import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Permanence } from "../types";
import { MapPin, Microscope, Phone, Clock } from "lucide-react";

export default function PermanenceList() {
  const [permanences, setPermanences] = useState<Permanence[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pharmacy' | 'laboratory'>('pharmacy');

  useEffect(() => {
    async function fetchPermanences() {
      try {
        const querySnapshot = await getDocs(collection(db, "permanences"));
        const docsData = querySnapshot.docs.map(doc => ({
          ...doc.data() as Permanence,
          id: doc.id
        }));
        setPermanences(docsData);
      } catch (error) {
        console.error("Error fetching permanences:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPermanences();
  }, []);

  const filteredList = permanences.filter(p => p.type === activeTab);

  const isCurrentlyOpen = (workingHours?: { start: string, end: string }) => {
    if (!workingHours?.start || !workingHours?.end) return true; // defaults to true if no hours specified
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = workingHours.start.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    
    const [endH, endM] = workingHours.end.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    
    if (endMinutes > startMinutes) {
       return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
       // Passes midnight
       return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  };

  return (
    <div className="p-4 pt-8 pb-20">
      <h1 className="text-2xl font-bold text-slate-700 mb-6">المناوبات الطبية</h1>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 rounded-2xl p-1 mb-6 border border-slate-200 snap-x overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('pharmacy')}
          className={`shrink-0 flex-1 flex justify-center items-center px-4 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'pharmacy' ? 'bg-white shadow-sm text-[#1E6DFF]' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Cross className="w-4 h-4 mr-2" />
          الصيدليات
        </button>
        <button 
          onClick={() => setActiveTab('laboratory')}
          className={`shrink-0 flex-1 flex justify-center items-center px-4 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'laboratory' ? 'bg-white shadow-sm text-[#1E6DFF]' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Microscope className="w-4 h-4 mr-2" />
          المخابر
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center mt-20 text-slate-500">
          <p>لا توجد مناوبات مسجلة حالياً بهذا القسم.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map(item => {
            const isDuty = item.isOnDuty;
            const openStatus = isDuty ? isCurrentlyOpen(item.workingHours) : true;
            return (
            <div key={item.id} className={`bg-white rounded-3xl p-5 shadow-sm border ${isDuty ? 'border-red-200' : 'border-slate-200'} relative overflow-hidden ${!openStatus ? 'opacity-80 grayscale-[20%]' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isDuty && (
                    <div className="w-10 h-10 bg-red-50 flex items-center justify-center rounded-xl text-2xl shrink-0">
                      ⚕️
                    </div>
                  )}
                  <h3 className={`font-bold ${isDuty ? 'text-red-700' : 'text-slate-700'}`}>{item.name}</h3>
                </div>
                {isDuty ? (
                  <span className={`${openStatus ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'} text-xs font-bold px-3 py-1 rounded-lg shrink-0`}>
                    {openStatus ? 'مناوبة مفتوحة' : 'مغلق'}
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-lg shrink-0">
                    مفتوح الآن
                  </span>
                )}
              </div>
              
              <div className={`space-y-3 p-3 rounded-2xl border ${isDuty ? 'bg-red-50/30 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center text-slate-500 text-xs">
                  <MapPin className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <span>{item.wilaya} - {item.commune} - {item.address}</span>
                </div>
                
                {item.phone && (
                  <a href={`tel:${item.phone}`} className={`flex items-center text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${isDuty ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)]' : 'bg-gradient-to-r from-[#18C5B5] to-[#1E6DFF] hover:shadow-[0_4px_12px_rgba(24,197,181,0.3)]'}`}>
                    <Phone className="w-4 h-4 mr-2 shrink-0 text-white" />
                    <span dir="ltr">{item.phone}</span>
                  </a>
                )}
                
                {(item.workingDays || item.workingHours) ? (
                  <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
                    {item.workingDays && item.workingDays.length > 0 && item.workingDays[0] && (
                       <div className="flex flex-wrap items-center text-slate-600 text-xs bg-white px-3 py-2 rounded-lg border border-slate-100">
                         <Clock className="w-4 h-4 ml-2 text-indigo-400" />
                         <span className="font-semibold text-slate-700">{item.workingDays[0]}</span>
                       </div>
                    )}
                    {item.workingHours && item.workingHours.start && (
                       <div className="flex flex-wrap items-center text-slate-600 text-xs bg-white px-3 py-2 rounded-lg border border-slate-100">
                         <span className="ml-2 font-bold text-slate-500">من</span>
                         <span className="font-bold text-indigo-600 ml-3" dir="ltr">{item.workingHours.start}</span>
                         <span className="ml-2 font-bold text-slate-500">إلى</span>
                         <span className="font-bold text-indigo-600" dir="ltr">{item.workingHours.end}</span>
                       </div>
                    )}
                  </div>
                ) : item.openUntil && (
                  <div className="flex items-center text-slate-500 text-xs mt-2 border-t border-slate-200 pt-2">
                    <Clock className="w-4 h-4 mr-2 text-slate-400" />
                    <span>مفتوح حتى: <span className="font-bold text-slate-700">{item.openUntil}</span></span>
                  </div>
                )}

                {isDuty && item.dutyDate && (
                  <div className="mt-2 bg-red-50 text-red-700 border border-red-100 rounded-lg p-2 text-xs font-semibold">
                    <div className="flex flex-wrap items-center">
                      <span className="mb-1 ml-3">تاريخ المناوبة: {item.dutyDate}</span>
                      <span className="mb-1">المدة: {item.dutyHours}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Ensure the local Cross icon fallback is identical
function Cross({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v20M2 12h20" />
    </svg>
  );
}
