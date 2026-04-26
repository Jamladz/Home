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

  return (
    <div className="p-4 pt-8">
      <h1 className="text-2xl font-bold text-slate-700 mb-6">المناوبات الطبية</h1>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 rounded-2xl p-1 mb-6 border border-slate-200">
        <button 
          onClick={() => setActiveTab('pharmacy')}
          className={`flex-1 flex justify-center items-center py-3 rounded-xl text-xs font-bold transition ${activeTab === 'pharmacy' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Cross className="w-4 h-4 mr-2" />
          الصيدليات
        </button>
        <button 
          onClick={() => setActiveTab('laboratory')}
          className={`flex-1 flex justify-center items-center py-3 rounded-xl text-xs font-bold transition ${activeTab === 'laboratory' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
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
          {filteredList.map(item => (
            <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-slate-700">{item.name}</h3>
                <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-lg">مفتوح الآن</span>
              </div>
              
              <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center text-slate-500 text-xs">
                  <MapPin className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <span>{item.address}</span>
                </div>
                
                {item.phone && (
                  <div className="flex items-center text-slate-500 text-xs">
                    <Phone className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <span dir="ltr">{item.phone}</span>
                  </div>
                )}
                
                {item.openUntil && (
                  <div className="flex items-center text-slate-500 text-xs mt-2 border-t border-slate-200 pt-2">
                    <Clock className="w-4 h-4 mr-2 text-slate-400" />
                    <span>مفتوح حتى: <span className="font-bold text-slate-700">{item.openUntil}</span></span>
                  </div>
                )}
              </div>
            </div>
          ))}
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
