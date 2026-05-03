import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string; // styles for the button
  dropdownClassName?: string; // styles for the dropdown panel
  disabled?: boolean;
}

export function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = 'اختر...', 
  className = '', 
  dropdownClassName = '',
  disabled = false 
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full outline-none transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className || 'bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'}`}
      >
        <span className="block truncate pl-1 pr-1">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${selectedOption ? 'opacity-80' : 'opacity-40'}`} />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-[999] w-full mt-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/60 max-h-60 overflow-y-auto custom-scrollbar ${dropdownClassName}`}
          >
            <div className="p-1.5 flex flex-col gap-0.5 relative z-[999]">
              {/* Optional clear/placeholder option inside dropdown */}
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className={`w-full text-start px-2.5 py-2 flex items-center justify-between rounded-lg text-xs font-semibold transition-colors ${
                  value === ""
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{placeholder}</span>
                {value === "" && <Check className="w-4 h-4 text-slate-600" />}
              </button>
              
              {options.length === 0 ? (
                <div className="px-2.5 py-2 text-xs text-slate-400 text-center">لا توجد خيارات</div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-start px-2.5 py-2 flex items-center justify-between rounded-lg text-xs font-semibold transition-colors ${
                      value === option.value
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {value === option.value && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
