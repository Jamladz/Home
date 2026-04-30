import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Prevent scrolling while splash screen is active
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    // Advance progress over 7 seconds
    const duration = 7000;
    const intervalTime = 50;
    const steps = duration / intervalTime;
    let stepCount = 0;

    const interval = setInterval(() => {
      stepCount++;
      const currentProgress = (stepCount / steps) * 100;
      setProgress(currentProgress);
      if (stepCount >= steps) {
        clearInterval(interval);
        setTimeout(() => onComplete(), 500); // Wait a little after 100%
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6"
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <img 
            src="https://i.suar.me/Ep1l7/l" 
            alt="شعار التطبيق" 
            className="w-72 md:w-96 h-auto object-contain drop-shadow-2xl"
          />
          <div className="absolute inset-0 bg-[#1E6DFF] blur-[100px] opacity-10 -z-10 rounded-full"></div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-sm space-y-4 px-6 md:px-0"
        >
          <div className="flex justify-between items-center text-sm font-medium text-slate-500 px-1">
            <span>جاري التحميل...</span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#1E6DFF] to-[#18C5B5] rounded-full relative overflow-hidden flex items-center justify-center p-0"
              style={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            >
              <div className="absolute inset-0 w-[200%] animate-[pulse_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
