import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { AnimatePresence, motion } from "motion/react";
import { Headset, X, Facebook, Instagram, HeartPulse } from "lucide-react";

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { tx } = useLanguage();

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-20 ${tx("right-6", "left-6", "left-6")} z-[9990] bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_40px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center border-2 border-white`}
            aria-label="Open Support"
          >
            <Headset className="w-7 h-7 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-20 ${tx("right-4 md:right-6", "left-4 md:left-6", "left-4 md:left-6")} z-[9995] w-[calc(100vw-32px)] md:w-[360px] h-auto max-h-[85vh] bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.15)] overflow-hidden flex flex-col border border-slate-200`}
          >
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                  <Headset className="w-5 h-5 text-[#1E6DFF]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {tx("الدعم ونبذة عنا", "Support & À propos", "Support & About Us")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {tx("اكتشف المزيد عن تطبيق داويني", "Découvrez l'application Dawini", "Discover the Dawini App")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white rounded-full hover:bg-slate-100 transition border border-transparent hover:border-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 pb-6 custom-scrollbar text-slate-700 space-y-6">
              
              {/* About Us */}
              <div>
                <h4 className="flex items-center gap-2 font-bold mb-3 text-slate-800 text-sm">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  {tx("نبذة عنا", "À propos", "About Us")}
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm leading-relaxed">
                  {tx(
                    "تطبيق داويني هو منصتك الطبية المتكاملة في الجزائر. نهدف لتسهيل وصول المرضى للأطباء، العيادات، الصيدليات، والمخابر. رؤيتنا هي تحسين القطاع الصحي وتقديم تجربة سلسة تخدم المريض والطبيب على حد سواء.",
                    "L'application Dawini est votre plateforme médicale intégrée en Algérie. Nous visons à faciliter l'accès des patients aux médecins, cliniques, pharmacies et laboratoires. Notre vision est d'améliorer le secteur de la santé au profit de tous.",
                    "The Dawini App is your integrated medical platform in Algeria. We aim to ease patients' access to doctors, clinics, pharmacies, and laboratories. Our vision is to improve the healthcare sector for both patients and healthcare providers."
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h4 className="font-bold mb-3 text-slate-800 text-sm">
                  {tx("تابعنا على منصات التواصل", "Suivez-nous sur les réseaux", "Follow us on social media")}
                </h4>
                
                <div className="space-y-3">
                  <a
                    href="https://www.facebook.com/share/1bTEoYEuCQ/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-2xl transition border border-blue-100 hover:border-blue-200 group"
                  >
                    <div className="bg-white p-2 rounded-xl group-hover:scale-110 transition shrink-0 shadow-sm">
                      <Facebook className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-blue-900 mx-3 text-sm flex-1">Facebook</span>
                  </a>

                  <a
                    href="https://www.instagram.com/dawini.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-pink-50 hover:bg-pink-100 rounded-2xl transition border border-pink-100 hover:border-pink-200 group"
                  >
                    <div className="bg-white p-2 rounded-xl group-hover:scale-110 transition shrink-0 shadow-sm">
                      <Instagram className="w-5 h-5 text-pink-600" />
                    </div>
                    <span className="font-medium text-pink-900 mx-3 text-sm flex-1">Instagram</span>
                  </a>

                  <a
                    href="https://www.tiktok.com/@dawini.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition border border-slate-200 group"
                  >
                    <div className="bg-white p-2 rounded-xl group-hover:scale-110 transition shrink-0 shadow-sm">
                      {/* Custom TikTok SVG since standard lucide-react doesn't have it natively */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 448 512"
                        className="w-5 h-5 fill-slate-800"
                      >
                        <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                      </svg>
                    </div>
                    <span className="font-medium text-slate-900 mx-3 text-sm flex-1">TikTok</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
