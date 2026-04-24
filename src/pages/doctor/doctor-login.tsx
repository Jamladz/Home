import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../lib/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { Stethoscope } from "lucide-react";

export default function DoctorLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/doctor/dashboard");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Auto redirects via onAuthStateChanged
    } catch (error) {
      console.error("Login Error:", error);
      alert("حدث خطأ أثناء تسجيل الدخول");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm">
          <Stethoscope className="w-10 h-10 text-indigo-700" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">بوابة الأطباء</h1>
        <p className="text-slate-500 text-sm mb-8">سجل دخولك لإدارة مواعيدك وعيادتك في دكتوري.</p>
        
        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition hover:border-indigo-300"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 ml-3" />
          الدخول بحساب جوجل
        </button>
      </div>
    </div>
  );
}
