import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Stethoscope,
  HeartPulse,
  Eye,
  Baby,
  Syringe,
  Activity,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { DoctorProfile } from "../types";
import { DoctorAvatar } from "../components/DoctorAvatar";
import { medicalSpecialties } from "../lib/medical_specialties";

export default function Home() {
  const navigate = useNavigate();
  const {
    t,
    language,
    tx: tx
  } = useLanguage();
  const [topDoctors, setTopDoctors] = useState<DoctorProfile[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);

  useEffect(() => {
    async function fetchTopDoctors() {
      try {
        const q = query(
          collection(db, "doctors"),
          where("status", "==", "approved"),
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map(
          (d) => (({
            ...d.data(),
            userId: d.id
          }) as DoctorProfile),
        );
        // Sort and limit in memory
        docs.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setTopDoctors(docs.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch top doctors:", err);
      } finally {
        setLoadingTop(false);
      }
    }
    fetchTopDoctors();
  }, []);

  const getSpecialtyLabel = (id: string) => {
    const spec = medicalSpecialties.find((s) => s.id === id);
    if (!spec) return "";
    return tx(spec.ar, spec.fr, spec.fr);
  };

  const categories = [
    {
      title: getSpecialtyLabel("general_practice"),
      icon: Stethoscope,
      color: "bg-indigo-100 text-indigo-700",
      id: "general_practice",
    },
    {
      title: getSpecialtyLabel("dentistry"),
      icon: Syringe,
      color: "bg-emerald-100 text-emerald-700",
      id: "dentistry",
    },
    {
      title: getSpecialtyLabel("pediatrics"),
      icon: Baby,
      color: "bg-rose-100 text-rose-700",
      id: "pediatrics",
    },
    {
      title: getSpecialtyLabel("ophthalmology"),
      icon: Eye,
      color: "bg-blue-100 text-blue-700",
      id: "ophthalmology",
    },
    {
      title: getSpecialtyLabel("cardiology"),
      icon: HeartPulse,
      color: "bg-red-100 text-red-700",
      id: "cardiology",
    },
    {
      title: getSpecialtyLabel("gastroenterology"),
      icon: Activity,
      color: "bg-amber-100 text-amber-700",
      id: "gastroenterology",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="pb-8"
    >
      {/* Header / Hero */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-[#1E6DFF] to-[#18C5B5] rounded-b-[40px] p-6 pt-16 pb-20 text-white shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-400 opacity-10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        <div className="relative z-10 text-start">
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">{t("home.title")}</h1>
          <p className="text-indigo-100/90 mb-6 text-base max-w-sm font-medium leading-relaxed">
            {t("home.subtitle")}
          </p>
        </div>
      </motion.div>
      {/* Categories */}
      <div className="mt-[-2rem] px-4 relative z-10">
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {categories.map((cat, idx) => (
            <motion.div
              variants={itemVariants}
              key={idx}
            >
              <Link
                to={`/doctors?specialty=${cat.id}`}
                className="flex-shrink-0 bg-white rounded-3xl p-4 shadow-sm border border-slate-200/60 w-28 flex flex-col items-center justify-center gap-3 hover:border-indigo-200 transition-colors block"
              >
                <div className={`p-4 rounded-2xl ${cat.color}`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-700 text-sm whitespace-nowrap">
                  {cat.title}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Quick Access sections */}
      <motion.div variants={itemVariants} className="px-4 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-700">
            {tx(
              "أفضل الأطباء المتاحين",
              "Meilleurs Médecins Disponibles",
              "Best Available Doctors"
            )}
          </h2>
          <Link
            to="/doctors"
            className="text-[#1E6DFF] text-sm font-bold flex items-center bg-[#1E6DFF]/10 px-3 py-1.5 rounded-full hover:bg-[#1E6DFF]/20 transition-colors"
          >
            {t("home.view_all")}
            {tx(
              (<ChevronLeft className="w-4 h-4 ml-1" />),
              (<ChevronRight className="w-4 h-4 ml-1" />),
              (<ChevronRight className="w-4 h-4 ml-1" />)
            )}
          </Link>
        </div>

        {loadingTop ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-500"></div>
          </div>
        ) : topDoctors.length > 0 ? (
          <div className="space-y-4">
            {topDoctors.map((doctor) => (
              <div
                key={doctor.userId}
                onClick={() => navigate(`/doctors/${doctor.userId}`)}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 flex items-center gap-4 transition hover:border-indigo-300 hover:shadow-md cursor-pointer"
              >
                <div className="w-16 h-16 shrink-0 relative">
                  <DoctorAvatar gender={doctor.gender} className="w-16 h-16" />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                    <div className="bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm mb-0.5">
                    د. {doctor.name}
                  </h3>
                  <p className="text-slate-500 text-[11px] mb-1.5 font-medium">
                    {doctor.specialty}
                  </p>
                  <div className="flex items-center text-slate-400 text-[10px]">
                    <MapPin className="w-3 h-3 mr-1 text-slate-300" />
                    <span className="truncate max-w-[120px]">
                      {doctor.wilaya ? `${doctor.wilaya} ` : ""}
                      {doctor.commune ? `- ${doctor.commune}` : ""}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-amber-50 p-2.5 rounded-xl border border-amber-100 min-w-[55px]">
                  <div className="flex items-center text-amber-500 font-black text-sm">
                    {doctor.rating ? doctor.rating.toFixed(1) : "--"}
                  </div>
                  <div className="flex items-center text-amber-400 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 text-center border border-slate-200/60 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-[#1E6DFF]/10 rounded-2xl flex items-center justify-center mb-4">
              <Stethoscope className="w-8 h-8 text-[#1E6DFF]" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              {t("home.browse_doctors")}
            </h3>
            <p className="text-slate-500 text-sm mb-5 max-w-xs">
              {t("home.browse_doctors_desc")}
            </p>
            <Link
              to="/doctors"
              className="inline-flex justify-center items-center bg-gradient-to-r from-[#1E6DFF] to-[#18C5B5] text-white px-8 py-4 rounded-[20px] font-bold shadow-[0_8px_20px_rgba(24,197,181,0.25)] hover:shadow-[0_12px_25px_rgba(30,109,255,0.35)] hover:-translate-y-0.5 transition-all duration-300 w-full md:w-auto"
            >
              {t("home.browse_doctors")}
            </Link>
          </div>
        )}
      </motion.div>
      <motion.div variants={itemVariants} className="px-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-700">
            {t("home.permanences")}{" "}
            <span className="text-xs text-slate-400 font-normal">
              {tx("صيدليات ومخابر", "Pharmacies et laboratoires", "Pharmacies and Labs")}
            </span>
          </h2>
          <Link
            to="/permanence"
            className="text-[#1E6DFF] text-sm font-bold flex items-center"
          >
            {t("home.view_all")}
            {tx(
              (<ChevronLeft className="w-4 h-4 ml-1" />),
              (<ChevronRight className="w-4 h-4 ml-1" />),
              (<ChevronRight className="w-4 h-4 ml-1" />)
            )}
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm overflow-hidden text-start">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-700">
              {t("home.pharmacies_labs")}
            </h3>
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Cross className="w-5 h-5" />
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-5">
            {t("home.permanences_desc")}
          </p>
          <Link
            to="/permanence"
            className="block text-center border-2 border-slate-200 bg-slate-50 rounded-[20px] py-4 text-slate-600 text-sm font-bold hover:border-[#1E6DFF]/30 hover:text-[#1E6DFF] hover:bg-[#1E6DFF]/5 hover:shadow-sm transition-all duration-300"
          >
            {t("home.view_permanences")}
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Quick component for Cross
function Cross({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2v20M2 12h20" />
    </svg>
  );
}
