// This file will act as a module to provide Wilayas and Communes for Algeria.
// Currently focusing on Wilaya 43 (Mila) as requested, which can be expanded later.

export const algeriaData = [
  {
    wilaya_id: "43",
    wilaya_name: "ميلة",
    communes: [
      "فرجيوة"
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
