
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Globe, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function TopHeader() {
  const { language, setLanguage, dir } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: 'ar', name: 'العربية', native: 'العربية' },
    { code: 'en', name: 'English', native: 'English' },
    { code: 'fr', name: 'Français', native: 'Français' },
  ] as const;

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 w-full max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img 
            src="https://i.suar.me/ng97w/l" 
            alt="Dawini Logo" 
            className="w-10 h-10 object-cover rounded-full shadow-sm border-2 border-white ring-1 ring-slate-100"
          />
          <h1 className="text-xl font-bold text-indigo-700 tracking-tight">
             Dawini - داويني
          </h1>
        </div>

        {/* Language Switcher */}
        <div 
          className="relative z-50 flex-shrink-0" 
          ref={dropdownRef}
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 group"
          >
            <Globe className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
            <span className="text-sm font-semibold text-slate-700 hidden sm:block">{currentLang.native}</span>
            <span className="text-sm font-semibold text-slate-700 sm:hidden">{currentLang.code.toUpperCase()}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`absolute top-full mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden ${dir === 'rtl' ? 'left-0' : 'right-0'}`}
              >
                <div className="py-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        // Type assertion to 'ar' | 'fr' | 'en' is safe here since we know the codes
                        setLanguage(lang.code as any);
                        setIsOpen(false);
                      }}
                      className="w-full text-start px-4 py-2.5 text-sm flex items-center justify-between hover:bg-indigo-50 transition-colors"
                    >
                      <span className={`font-medium ${language === lang.code ? 'text-indigo-600' : 'text-slate-600'}`}>
                        {lang.native}
                      </span>
                      {language === lang.code && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}
