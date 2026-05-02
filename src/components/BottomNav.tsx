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
                  isActive ? "text-[#1E6DFF] bg-[#1E6DFF]/10" : "text-slate-400 hover:text-[#1E6DFF]"
                )}
              >
                <item.icon className={cn("w-6 h-6 mb-1", isActive && "fill-[#1E6DFF]/20")} />
                <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
