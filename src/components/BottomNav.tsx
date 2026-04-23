import { Link, useLocation } from "react-router-dom";
import { Home, Stethoscope, Cross, User, Globe } from "lucide-react";
import { cn } from "../lib/utils";
import { useLanguage } from "../contexts/LanguageContext";

export function BottomNav() {
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();

  const navItems = [
    { to: "/", icon: Home, label: t('nav.home') },
    { to: "/doctors", icon: Stethoscope, label: t('nav.doctors') },
    { to: "/permanence", icon: Cross, label: t('nav.permanences') },
    { to: "/doctor/dashboard", icon: User, label: t('nav.my_account') },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 lg:hidden">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center p-2 rounded-xl transition-all duration-300",
                  isActive ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-indigo-600"
                )}
              >
                <item.icon className={cn("w-6 h-6 mb-1", isActive && "fill-indigo-100")} />
                <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Floating Language Toggle */}
      <button 
        onClick={() => setLanguage(language === 'ar' ? 'fr' : 'ar')}
        className="fixed bottom-20 left-4 z-40 bg-white/90 backdrop-blur border border-slate-200 text-slate-600 p-3 rounded-full shadow-lg hover:bg-slate-50 transition flex items-center justify-center font-bold text-sm"
      >
        <Globe className="w-5 h-5 mr-1 text-indigo-500" />
        {language === 'ar' ? 'FR' : 'AR'}
      </button>
    </>
  );
}
