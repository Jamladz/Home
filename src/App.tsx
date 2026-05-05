import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import { TopHeader } from "./components/TopHeader";
import Home from "./pages/Home";
import DoctorsList from "./pages/DoctorsList";
import DoctorDetail from "./pages/DoctorDetail";
import PermanenceList from "./pages/PermanenceList";
import DoctorLogin from "./pages/doctor/doctor-login";
import DoctorDashboard from "./pages/doctor/doctor-dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MaintenancePage from "./pages/MaintenancePage";
import React, { useEffect, useState } from "react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import { AnimatePresence, motion } from "motion/react";
import { SplashScreen } from "./components/SplashScreen";
import { Toaster, toast } from "react-hot-toast";

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

import { AIAssistantWidget } from "./components/AIAssistantWidget";
import { SupportWidget } from "./components/SupportWidget";

// Inner App component to use location
function AppContent() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const {
    language,
    tx: tx
  } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    // Show non-intrusive welcome message on load
    const timer = setTimeout(() => {
      toast('نسأل الله أن يديم عليك الصحة والعافية', {
        icon: '🤲',
        style: {
          borderRadius: '20px',
          background: '#f8fafc',
          color: '#1e293b',
          fontSize: '14px',
          fontWeight: '500',
        },
        duration: 4000,
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (
        user &&
        (user.email?.toLowerCase().trim() === "sekanedrmessaif@gmail.com" ||
         user.email?.toLowerCase().trim() === "mohamedben.aissa@yahoo.fr")
      ) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsubConfig = onSnapshot(
      doc(db, "config", "maintenance"),
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().active) {
          setIsMaintenance(true);
        } else {
          setIsMaintenance(false);
        }
      },
    );
    return () => unsubConfig();
  }, []);

  const showMaintenance =
    isMaintenance &&
    !isAdmin &&
    location.pathname !== "/doctor/login" &&
    location.pathname !== "/admin";

  if (showMaintenance) {
    return <MaintenancePage />;
  }

  return (
    <div
      className="font-sans min-h-screen bg-slate-50 pb-16 lg:pb-0 text-slate-800 transition-colors duration-300"
      dir={tx("rtl", "ltr", "ltr")}
    >
      <TopHeader />
      {/* Admin floating button */}
      {isAdmin && (
        <Link
          to="/admin"
          className="fixed top-24 left-4 z-50 bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-900 hover:scale-110 transition border-2 border-indigo-500"
        >
          <LayoutDashboard className="w-5 h-5" />
        </Link>
      )}
      <AnimatePresence mode="wait">
        {/* @ts-ignore */}
        <Routes location={location} key={location.pathname}>
          {/* Patient Routes */}
          <Route
            path="/"
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path="/doctors"
            element={
              <PageTransition>
                <DoctorsList />
              </PageTransition>
            }
          />
          <Route
            path="/doctors/:doctorId"
            element={
              <PageTransition>
                <DoctorDetail />
              </PageTransition>
            }
          />
          <Route
            path="/permanence"
            element={
              <PageTransition>
                <PermanenceList />
              </PageTransition>
            }
          />

          {/* Doctor Area */}
          <Route
            path="/doctor/login"
            element={
              <PageTransition>
                <DoctorLogin />
              </PageTransition>
            }
          />
          <Route
            path="/doctor/dashboard"
            element={
              <PageTransition>
                <DoctorDashboard />
              </PageTransition>
            }
          />

          {/* Admin Area */}
          <Route
            path="/admin"
            element={
              <PageTransition>
                <AdminDashboard />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
      {/* AI Assistant Widget */}
      <AIAssistantWidget />
      {/* Support Widget */}
      <SupportWidget />
      <Toaster position="bottom-center" />
      {/* Fixed Navigation for Mobile */}
      <BottomNav />
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
