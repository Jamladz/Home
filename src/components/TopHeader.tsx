
import { useLanguage } from "../contexts/LanguageContext";

export function TopHeader() {
  const { language } = useLanguage();
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="flex justify-center items-center">
        <h1 className="text-xl font-bold text-indigo-700">
           Dawini - داويني
        </h1>
      </div>
    </header>
  );
}
