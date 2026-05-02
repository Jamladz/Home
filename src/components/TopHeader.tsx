
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Globe, ChevronDown, Check, QrCode, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";

export function TopHeader() {
  const {
    language,
    setLanguage,
    dir,
    tx: tx
  } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
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
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center h-16 px-4 sm:px-6 w-full max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img 
              src="https://i.suar.me/ng97w/l" 
              alt="Dawini Logo" 
              className="w-10 h-10 object-cover rounded-full shadow-sm border-2 border-white ring-1 ring-slate-100"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#1E6DFF] to-[#18C5B5] bg-clip-text text-transparent tracking-tight">
               Dawini - داويني
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Global QR Code Button */}
            <button
              onClick={() => setShowQRModal(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 flex items-center gap-2 group"
              title={tx("مشاركة التطبيق", "Partager l'application", "Share App")}
            >
              <QrCode className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
              <span className="hidden sm:block text-sm font-semibold text-slate-700">{tx("التطبيق", "L'App", "App")}</span>
            </button>

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
                    className={`absolute top-full mt-2 w-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden ${dir === 'rtl' ? 'left-0' : 'right-0'}`}
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
                          <span className={`font-medium ${language === lang.code ? 'text-[#1E6DFF]' : 'text-slate-600'}`}>
                            {lang.native}
                          </span>
                          {language === lang.code && (
                            <Check className="w-4 h-4 text-[#1E6DFF]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Global QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-[320px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 relative text-center flex flex-col items-center">
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 end-4 p-2 bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-12 h-12 bg-[#1E6DFF]/10 text-[#1E6DFF] rounded-2xl flex items-center justify-center mb-3">
                <QrCode className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {tx("تطبيق داويني", "Application Dawini", "Dawini App")}
              </h3>
              
              <p className="text-slate-500 text-xs mb-4 leading-relaxed px-2">
                {tx(
                  "امسح الرمز للوصول المباشر للمنصة من أي جهاز.",
                  "Scannez le code pour accéder directement à la plateforme depuis n'importe quel appareil.",
                  "Scan the code to access the platform directly from any device."
                )}
              </p>

              <div className="bg-white p-3 rounded-xl border-2 border-indigo-50 shadow-sm mb-5 inline-flex justify-center w-auto">
                <QRCodeSVG 
                  value="https://www.dawini.cc" 
                  size={160}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  imageSettings={{
                    src: "https://i.suar.me/ng97w/l",
                    x: undefined,
                    y: undefined,
                    height: 32,
                    width: 32,
                    excavate: true,
                  }}
                />
              </div>

              <div className="bg-slate-50 w-full p-3 rounded-xl border border-slate-100">
                <span className="block text-xs font-semibold text-slate-800">www.dawini.cc</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
