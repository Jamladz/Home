import React from "react";

interface DoctorAvatarProps {
  gender?: "male" | "female" | "";
  className?: string;
}

const MaleDoctorIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="maleBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0E7FF" />
        <stop offset="100%" stopColor="#C7D2FE" />
      </linearGradient>
      <linearGradient id="coat" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F1F5F9" />
      </linearGradient>
    </defs>

    <circle cx="50" cy="50" r="50" fill="url(#maleBg)" />

    {/* Shoulders / Coat */}
    <path d="M15 100 C 15 65, 85 65, 85 100" fill="url(#coat)" />
    {/* Inner Shirt */}
    <path d="M35 70 L50 90 L65 70" fill="#818CF8" />
    <path d="M40 70 L50 82 L60 70" fill="#EEF2FF" />

    {/* Stethoscope */}
    <path
      d="M30 65 V 75 C 30 90, 70 90, 70 75 V 65"
      fill="none"
      stroke="#475569"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="30" cy="65" r="3.5" fill="#475569" />
    <circle cx="70" cy="65" r="3.5" fill="#475569" />
    <path d="M50 88 V 98" fill="none" stroke="#475569" strokeWidth="3" />
    <circle
      cx="50"
      cy="98"
      r="5"
      fill="#94A3B8"
      stroke="#475569"
      strokeWidth="2"
    />

    {/* Neck */}
    <path d="M40 55 H 60 V 68 C 60 72, 40 72, 40 68 Z" fill="#FCD34D" />
    {/* Face */}
    <rect x="35" y="32" width="30" height="34" rx="15" fill="#FDE68A" />

    {/* Hair */}
    <path
      d="M33 40 C 33 20, 67 20, 67 40 C 65 25, 35 25, 33 40"
      fill="#1E293B"
    />
    <path
      d="M30 40 C 30 25, 70 25, 70 40 C 70 20, 30 20, 30 40"
      fill="#0F172A"
    />

    {/* Eyes */}
    <circle cx="43" cy="45" r="2.5" fill="#334155" />
    <circle cx="57" cy="45" r="2.5" fill="#334155" />

    {/* Glasses */}
    <rect
      x="38"
      y="42"
      width="10"
      height="6"
      rx="2"
      fill="none"
      stroke="#475569"
      strokeWidth="1.5"
    />
    <rect
      x="52"
      y="42"
      width="10"
      height="6"
      rx="2"
      fill="none"
      stroke="#475569"
      strokeWidth="1.5"
    />
    <path d="M 48 45 H 52" fill="none" stroke="#475569" strokeWidth="1.5" />

    {/* Smile */}
    <path
      d="M46 54 Q 50 57 54 54"
      fill="none"
      stroke="#D97706"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const FemaleDoctorIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="femaleBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCE7F3" />
        <stop offset="100%" stopColor="#FBCFE8" />
      </linearGradient>
    </defs>

    <circle cx="50" cy="50" r="50" fill="url(#femaleBg)" />

    {/* Hair Background */}
    <path
      d="M25 45 C 20 80, 40 95, 50 95 C 60 95, 80 80, 75 45"
      fill="#451A03"
    />

    {/* Shoulders / Coat */}
    <path d="M15 100 C 15 65, 85 65, 85 100" fill="url(#coat)" />
    {/* Inner Shirt */}
    <path d="M35 70 L50 90 L65 70" fill="#F472B6" />
    <path d="M40 70 L50 82 L60 70" fill="#FDF2F8" />

    {/* Stethoscope */}
    <path
      d="M30 65 V 75 C 30 90, 70 90, 70 75 V 65"
      fill="none"
      stroke="#475569"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="30" cy="65" r="3.5" fill="#475569" />
    <circle cx="70" cy="65" r="3.5" fill="#475569" />
    <path d="M50 88 V 98" fill="none" stroke="#475569" strokeWidth="3" />
    <circle
      cx="50"
      cy="98"
      r="5"
      fill="#94A3B8"
      stroke="#475569"
      strokeWidth="2"
    />

    {/* Neck */}
    <path d="M42 55 H 58 V 68 C 58 72, 42 72, 42 68 Z" fill="#FCD34D" />

    {/* Face */}
    <rect x="36" y="34" width="28" height="32" rx="14" fill="#FDE68A" />

    {/* Hair Top */}
    <path
      d="M30 45 C 30 15, 70 15, 70 45 C 65 25, 45 20, 30 45"
      fill="#451A03"
    />

    {/* Eyes */}
    <circle cx="43" cy="46" r="2.5" fill="#334155" />
    <circle cx="57" cy="46" r="2.5" fill="#334155" />
    <path
      d="M 40 43 Q 43 41 46 44"
      fill="none"
      stroke="#451A03"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M 60 43 Q 57 41 54 44"
      fill="none"
      stroke="#451A03"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    {/* Smile */}
    <path
      d="M46 55 Q 50 58 54 55"
      fill="none"
      stroke="#D97706"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export function DoctorAvatar({
  gender,
  className = "w-8 h-8",
}: DoctorAvatarProps) {
  if (gender === "male" || gender === "") {
    return <MaleDoctorIcon className={className} />;
  } else if (gender === "female") {
    return <FemaleDoctorIcon className={className} />;
  } else {
    return <MaleDoctorIcon className={className} />;
  }
}
