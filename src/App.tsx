import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import Home from "./pages/Home";
import DoctorsList from "./pages/DoctorsList";
import DoctorDetail from "./pages/DoctorDetail";
import PermanenceList from "./pages/PermanenceList";
import DoctorLogin from "./pages/doctor/DoctorLogin";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { useEffect, useState } from "react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'sekanedrmessaif@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <div className="font-sans min-h-screen bg-slate-50 pb-16 lg:pb-0 text-slate-800">
        {/* Admin floating button */}
        {isAdmin && (
          <Link to="/admin" className="fixed top-24 left-4 z-50 bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-900 hover:scale-110 transition border-2 border-indigo-500">
            <LayoutDashboard className="w-5 h-5" />
          </Link>
        )}

        <Routes>
          {/* Patient Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<DoctorsList />} />
          <Route path="/doctors/:doctorId" element={<DoctorDetail />} />
          <Route path="/permanence" element={<PermanenceList />} />
          
          {/* Doctor Area */}
          <Route path="/doctor/login" element={<DoctorLogin />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />

          {/* Admin Area */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
        
        {/* Fixed Navigation for Mobile */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
