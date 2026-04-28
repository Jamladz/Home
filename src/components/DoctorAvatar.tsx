import React from "react";

interface DoctorAvatarProps {
  gender?: "male" | "female" | "";
  className?: string;
}

export function DoctorAvatar({
  gender,
  className = "w-8 h-8",
}: DoctorAvatarProps) {
  const isFemale = gender === "female";
  
  const imgUrl = isFemale 
    ? "https://i.suar.me/V9XW0/l" 
    : "https://i.suar.me/g498K/l";

  return (
    <img 
      src={imgUrl} 
      alt={isFemale ? "Female doctor" : "Male doctor"} 
      className={`rounded-full object-cover bg-indigo-50 border-2 border-indigo-100 ${className}`} 
      referrerPolicy="no-referrer"
    />
  );
}
