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

// Inner App component to use location
function AppContent() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const { language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (
        user &&
        user.email?.toLowerCase().trim() === "sekanedrmessaif@gmail.com"
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
      dir={language === "ar" ? "rtl" : "ltr"}
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

      {/* Fixed Navigation for Mobile */}
      <BottomNav />
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
