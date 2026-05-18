// This file will act as a module to provide Wilayas and Communes for Algeria.
// Currently focusing on Wilaya 43 (Mila) as requested, which can be expanded later.

export const algeriaData = [
  {
    wilaya_id: "43",
    wilaya_name: "ميلة",
    communes: [
      "ميلة",
      "فرجيوة",
      "شلغوم العيد",
      "وادي العثمانية",
      "التلاغمة",
      "تاجنانت",
      "عين الملوك",
      "ترعي باينان",
      "وادي النجاء",
      "زغاية",
      "الرواشد",
      "سيدي مروان",
      "القرارم قوقة",
      "باينان",
      "وادي سقان",
      "المشيرة",
      "تسالة لمطاعي",
      "عين التين",
      "الشيقارة",
      "سيدي خليفة",
      "يحيى بني قشة",
      "مينار زارزة",
      "بوحاتم",
      "العياضي برباس",
      "تسدان حدادة",
      "أولاد خلوف",
      "حمالة",
      "دراحي بوصلاح",
      "تيبرقنت",
      "زارزة",
      "عميرة عرّاس",
      "بن يحيى عبد الرحمان"
    ]
  }
];

export function getWilayas() {
  return algeriaData.map(w => ({ id: w.wilaya_id, name: w.wilaya_name }));
}

export function getCommunesByWilaya(wilayaId: string) {
  const wilaya = algeriaData.find(w => w.wilaya_id === wilayaId);
  return wilaya ? wilaya.communes : [];
}
