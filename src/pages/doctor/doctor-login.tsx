import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../lib/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { Stethoscope, Mail, Lock } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email?.toLowerCase().trim() === 'sekanedrmessaif@gmail.com') {
          navigate("/admin");
        } else {
          navigate("/doctor/dashboard");
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!email || !password) {
      setMessage({ type: 'error', text: language === 'ar' ? "يرجى إدخال البريد الإلكتروني وكلمة المرور." : "Please enter email and password." });
      return;
    }
    
    setIsLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage({ type: 'success', text: language === 'ar' ? "تم إنشاء الحساب بنجاح! جاري التوجيه..." : "Account created! Redirecting..." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage({ type: 'success', text: language === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...' });
      }
    } catch (error: any) {
      console.error("Email Auth Error:", error);
      let errorMessage = language === 'ar' ? "حدث خطأ." : "An error occurred.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = language === 'ar' ? "البريد الإلكتروني مستخدم بالفعل، يرجى تسجيل الدخول بدلاً من ذلك." : "Email already in use. Please sign in instead.";
        setIsRegistering(false); // Switch back to login mode automatically
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errorMessage = language === 'ar' ? "البريد الإلكتروني أو كلمة المرور غير صحيحة. هل قمت بالتسجيل عبر جوجل مسبقاً؟" : "Invalid email or password. Did you sign up with Google previously?";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = language === 'ar' ? "كلمة المرور ضعيفة جداً. استخدم 6 أحرف على الأقل." : "Password should be at least 6 characters.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = language === 'ar' 
          ? "تسجيل الدخول بالبريد الإلكتروني غير مفعل. يرجى تفعيله من لوحة تحكم Firebase." 
          : "Email/Password sign-in is disabled. Please enable it in Firebase console.";
      } else {
        errorMessage += `\n${error.code || error.message}`;
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setMessage(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login Error:", error);
      let errorMessage = language === 'ar' ? "حدث خطأ أثناء تسجيل الدخول." : "An error occurred during sign in.";
      
      if (error.code) {
        if (error.code === 'auth/popup-blocked') {
          errorMessage = language === 'ar' ? "تم حظر النافذة المنبثقة! المتصفح يمنع تسجيل الدخول. يرجى فتح التطبيق في نافذة جديدة أو السماح بالنوافذ المنبثقة." : "Popup blocked. Please open in a new window or allow popups.";
        } else if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = language === 'ar' ? "لقد قمت بإغلاق نافذة تسجيل الدخول قبل اكتمال العملية." : "Popup was closed by user.";
        } else if (error.code === 'auth/unauthorized-domain') {
          errorMessage = language === 'ar' ? "هذا النطاق غير مصرح له بتسجيل الدخول. تأكد من إعدادات Firebase." : "Unauthorized domain. Check Firebase settings.";
        } else {
          errorMessage += `\nالرمز: ${error.code}`;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm">
          <Stethoscope className="w-10 h-10 text-indigo-700" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {language === 'ar' ? 'بوابة الأطباء' : 'Doctor Portal'}
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          {language === 'ar' ? 'سجل دخولك لإدارة مواعيدك وعيادتك في دكتوري.' : 'Sign in to manage your clinic and appointments.'}
        </p>

        {message && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-semibold text-start ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6 text-start">
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-1.5">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-10 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                placeholder="doctor@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-1.5">
              {language === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                required
                minLength={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-10 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition shadow-sm disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              isRegistering 
                ? (language === 'ar' ? 'إنشاء حساب جديد' : 'Create Account') 
                : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')
            )}
          </button>
        </form>

        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition mx-auto"
          >
            {isRegistering 
              ? (language === 'ar' ? 'لدي حساب بالفعل؟ تسجيل الدخول' : 'Already have an account? Sign in') 
              : (language === 'ar' ? 'ليس لدي حساب؟ إنشاء حساب' : 'Need an account? Sign up')}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-xs text-slate-400 font-medium font-sans">
            {language === 'ar' ? 'أو' : 'OR'}
          </span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>
        
        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-slate-200/80 text-slate-700 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 ml-2" />
          {language === 'ar' ? 'المتابعة بحساب جوجل' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
}
