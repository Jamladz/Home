import React from 'react';
import { Settings } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function MaintenancePage() {
  const {
    language,
    tx: tx
  } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" dir={tx('rtl', 'ltr', "ltr")}>
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-sm border border-slate-200/50 p-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="relative mb-8 inline-block">
          <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl opacity-60 animate-pulse"></div>
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-50 to-white rounded-full flex items-center justify-center border-4 border-white shadow-lg relative z-10">
            <Settings className="w-12 h-12 text-indigo-600 animate-[spin_4s_linear_infinite]" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
          {tx('الموقع تحت الصيانة', 'Under Maintenance', "Site Under Maintenance")}
        </h1>
        
        <p className="text-slate-500 mb-10 leading-relaxed font-medium">
          {tx(
            'نحن نقوم ببعض التحسينات الاحترافية على منصة داويني لتوفير تجربة أفضل لكم. سنعود في أقرب وقت ممكن. شكراً لتفهمكم وصبركم.',
            'We are performing some professional improvements on Dawini to provide you with a better experience. We will be back shortly.',
            "We are making some professional improvements to the Dawini platform. We will be back as soon as possible."
          )}
        </p>
        
        <div className="inline-flex items-center gap-2 bg-slate-50 text-slate-600 px-6 py-3 rounded-full text-sm font-bold border border-slate-200">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          {tx('جاري العمل...', 'Work in progress...', "Work in progress...")}
        </div>
      </div>
      <div className="mt-12 text-center text-slate-400 text-sm font-medium">
        <p>© {new Date().getFullYear()} Dawini - داويني. {tx('جميع الحقوق محفوظة.', 'All rights reserved.', "All rights reserved.")}</p>
      </div>
    </div>
  );
}
