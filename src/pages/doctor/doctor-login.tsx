import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { Stethoscope, Mail, Lock } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const {
    language,
    tx: tx
  } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email?.toLowerCase().trim() === 'sekanedrmessaif@gmail.com' || user.email?.toLowerCase().trim() === 'mohamedben.aissa@yahoo.fr') {
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
      setMessage({ type: 'error', text: tx(
        "يرجى إدخال البريد الإلكتروني وكلمة المرور.",
        "Please enter email and password.",
        "Please enter your email and password."
      ) });
      return;
    }
    
    setIsLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage({ type: 'success', text: tx(
          "تم إنشاء الحساب بنجاح! جاري التوجيه...",
          "Account created! Redirecting...",
          "Account created successfully! Redirecting..."
        ) });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage({ type: 'success', text: tx('جاري تسجيل الدخول...', 'Signing in...', "Signing in...") });
      }
    } catch (error: any) {
      console.error("Email Auth Error:", error);
      let errorMessage = tx("حدث خطأ.", "An error occurred.", "An error occurred.");
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = tx(
          "البريد الإلكتروني مستخدم بالفعل، يرجى تسجيل الدخول بدلاً من ذلك.",
          "Email already in use. Please sign in instead.",
          "Email is already in use, please sign in instead."
        );
        setIsRegistering(false); // Switch back to login mode automatically
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errorMessage = tx(
          "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
          "Invalid email or password.",
          "Incorrect email or password."
        );
      } else if (error.code === 'auth/weak-password') {
        errorMessage = tx(
          "كلمة المرور ضعيفة جداً. استخدم 6 أحرف على الأقل.",
          "Password should be at least 6 characters.",
          "Password is too weak. Use at least 6 characters."
        );
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = tx(
          "تسجيل الدخول بالبريد الإلكتروني غير مفعل. يرجى تفعيله من لوحة تحكم Firebase.",
          "Email/Password sign-in is disabled. Please enable it in Firebase console.",
          "Email login is disabled. Please enable it in the Firebase dashboard."
        );
      } else {
        errorMessage += `\n${error.code || error.message}`;
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm">
          <Stethoscope className="w-10 h-10 text-indigo-700" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {tx('بوابة الأطباء', 'Doctor Portal', "Doctor Portal")}
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          {tx(
            'سجل دخولك لإدارة مواعيدك وعيادتك في داويني.',
            'Sign in to manage your clinic and appointments.',
            "Sign in to manage your appointments and clinic in Dawini."
          )}
        </p>

        {message && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-semibold text-start ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6 text-start">
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-1.5">
              {tx('البريد الإلكتروني', 'Email Address', "Email")}
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
              {tx('كلمة المرور', 'Password', "Password")}
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
            className="w-full bg-gradient-to-r from-[#1E6DFF] to-[#18C5B5] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition shadow-sm disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              isRegistering 
                ? (tx('إنشاء حساب جديد', 'Create Account', "Create new account")) 
                : (tx('تسجيل الدخول', 'Sign In', "Sign in"))
            )}
          </button>
        </form>

        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition mx-auto"
          >
            {isRegistering 
              ? (tx(
              'لدي حساب بالفعل؟ تسجيل الدخول',
              'Already have an account? Sign in',
              "Already have an account? Sign in"
            )) 
              : (tx(
              'ليس لدي حساب؟ إنشاء حساب',
              'Need an account? Sign up',
              "Don't have an account? Create one"
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}
