// This file will act as a module to provide Wilayas and Communes for Algeria.
// Currently focusing on Wilaya 43 (Mila) as requested, which can be expanded later.

export const algeriaData = [
  {
    wilaya_id: "43",
    wilaya_name: "ميلة",
    communes: [
      "ميلة",
      "القرارم قوقة",
      "سيدي مروان",
      "الشيقارة",
      "حمالة",
      "الرواشد",
      "تيجيت",
      "وادي النجاء",
      "زغاية",
      "بين الويدان",
      "تسدان حدادة",
      "مينار زارزة",
      "فرجيوة",
      "يحيى بني قشة",
      "عميرة حرّاس",
      "بوحاتم",
      "دراع قبيلة",
      "بني عزيز",
      "وادي العثمانية",
      "عين الملوك",
      "شلغوم العيد",
      "تاجنانت",
      "بن يحيى عبد الرحمان",
      "التلاغمة",
      "وادي سقان",
      "المشيرة"
      // Added common communes in Mila, this can be expanded with a full accurate list.
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
