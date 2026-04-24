import { Link } from "react-router-dom";
import { Search, Stethoscope, HeartPulse, Microscope, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { motion } from "motion/react";

export default function Home() {
  const { t, language } = useLanguage();

  const categories = [
    { title: language === 'ar' ? "طب عام" : "General", icon: Stethoscope, color: "bg-indigo-100 text-indigo-700" },
    { title: language === 'ar' ? "طب أسنان" : "Dentist", icon: HeartPulse, color: "bg-amber-100 text-amber-600" },
    { title: language === 'ar' ? "أطفال" : "Pediatrician", icon: HeartPulse, color: "bg-rose-100 text-rose-600" },
    { title: language === 'ar' ? "مخابر" : "Laboratory", icon: Microscope, color: "bg-emerald-100 text-emerald-600" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="pb-8"
    >
      {/* Header / Hero */}
      <motion.div variants={itemVariants} className="bg-gradient-to-l from-indigo-600 to-indigo-800 rounded-b-[40px] p-6 pt-12 pb-16 text-white shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 text-start">
          <h1 className="text-3xl font-bold mb-2">{t('home.title')}</h1>
          <p className="text-indigo-100 mb-6 opacity-90 max-w-sm">{t('home.subtitle')}</p>
        </div>
      </motion.div>

      {/* Categories */}
      <div className="mt-[-2rem] px-4 relative z-10">
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {categories.map((cat, idx) => (
            <motion.div 
              variants={itemVariants} 
              key={idx} 
              className="flex-shrink-0 bg-white rounded-3xl p-4 shadow-sm border border-slate-200/60 w-28 flex flex-col items-center justify-center gap-3 hover:border-indigo-200 transition-colors"
            >
              <div className={`p-4 rounded-2xl ${cat.color}`}>
                <cat.icon className="w-6 h-6" />
              </div>
              <span className="font-bold text-slate-700 text-sm whitespace-nowrap">{cat.title}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Access sections */}
      <motion.div variants={itemVariants} className="px-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-700">{t('home.new_doctors')}</h2>
          <Link to="/doctors" className="text-indigo-600 text-sm font-bold flex items-center">
            {t('home.view_all')}
            {language === 'ar' ? <ChevronLeft className="w-4 h-4 ml-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
          </Link>
        </div>
        
        <div className="bg-white rounded-3xl p-6 text-center border border-slate-200/60 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <Stethoscope className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">{t('home.browse_doctors')}</h3>
          <p className="text-slate-500 text-sm mb-5 max-w-xs">{t('home.browse_doctors_desc')}</p>
          <Link to="/doctors" className="inline-block bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all w-full md:w-auto">
            {t('home.browse_doctors')}
          </Link>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="px-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-700">{t('home.permanences')} <span className="text-xs text-slate-400 font-normal">{language === 'ar' ? 'صيدليات ومخابر' : 'Pharmacies'}</span></h2>
          <Link to="/permanence" className="text-indigo-600 text-sm font-bold flex items-center">
            {t('home.view_all')}
            {language === 'ar' ? <ChevronLeft className="w-4 h-4 ml-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
          </Link>
        </div>
        
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm overflow-hidden text-start">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-700">{t('home.pharmacies_labs')}</h3>
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Cross className="w-5 h-5" />
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-5">{t('home.permanences_desc')}</p>
          <Link to="/permanence" className="block text-center border-2 border-dashed border-slate-200 rounded-2xl py-3.5 text-slate-500 text-sm font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
            {t('home.view_permanences')}
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Quick component for Cross
function Cross({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v20M2 12h20" />
    </svg>
  );
}
