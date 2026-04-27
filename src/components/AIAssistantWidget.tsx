import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Loader2, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { useLanguage } from "../contexts/LanguageContext";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../lib/firebase";
import { DoctorProfile } from "../types";

export function AIAssistantWidget() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "model"; text: string; image?: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [errorError, setError] = useState<string | null>(null);
  const [globalApiKey, setGlobalApiKey] = useState("");
  const [doctorsList, setDoctorsList] = useState<DoctorProfile[]>([]);

  // Image Upload states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchGlobalKeyAndDoctors = async () => {
      try {
        const snap = await getDoc(doc(db, "config", "settings"));
        if (snap.exists()) {
          setGlobalApiKey(snap.data().geminiApiKey || "");
        }
        
        const docsQuery = await getDocs(collection(db, "doctors"));
        const docsData = docsQuery.docs
          .map(doc => doc.data() as DoctorProfile)
          .filter(d => d.status === "approved");
          
        setDoctorsList(docsData);
      } catch (err) {
        // Ignore read errors
      }
    };
    fetchGlobalKeyAndDoctors();
  }, []);

  // Initialize with a welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "model",
          text:
            language === "ar"
              ? "مرحباً بك! أنا مساعدك الطبي الذكي. واش نقدر نعاونك اليوم بخصوص صحتك؟"
              : "Bonjour ! Je suis votre assistant médical intelligent. Comment puis-je vous aider aujourd'hui ?",
        },
      ]);
    }
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert(language === "ar" ? "الرجاء اختيار صورة صالحة." : "Veuillez sélectionner une image valide.");
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userText = input.trim();
    const currentImage = selectedImage;
    const currentFile = imageFile;
    
    setInput("");
    removeImage();
    
    setMessages((prev) => [...prev, { role: "user", text: userText, image: currentImage || undefined }]);
    setIsLoading(true);
    setError(null);

    let apiKey = globalApiKey;
    if (!apiKey) {
      try {
        // Try Vite env first
        if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
          apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        } else {
          // Fallback to process.env for preview environment
          apiKey = process.env.GEMINI_API_KEY || "";
        }
      } catch (e) {}
    }

    if (!apiKey) {
      const errorText = language === "ar"
        ? "عذراً، المساعد الذكي غير متوفر حالياً. يرجى مراجعة الإدارة للتحقق من إعدادات الذكاء الاصطناعي."
        : "Désolé, l'assistant est indisponible. Veuillez vérifier les paramètres avec l'administration.";
      
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: errorText,
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      // Build conversation history for context
      const chatHistory = messages
        .map(
          (msg) =>
            `${msg.role === "user" ? "Patient" : "Assistant"}: ${msg.text}${msg.image ? ' [Image Uploaded]' : ''}`,
        )
        .join("\n");
        
      const doctorsContext = doctorsList.length > 0 
        ? `\nAVAILABLE DOCTORS IN OUR CLINIC PLATFORM:\n${doctorsList.map(d => `- Dr. ${d.name} (Specialty: ${d.specialty}, Phone: ${d.phone}, Address: ${d.commune || ""} ${d.wilaya || ""})`).join("\n")}\nIf the patient's symptoms or questions match a specific doctor's specialty, highly recommend they book an appointment with them from our platform and mention their name and specialty.` 
        : "\nNo doctors currently available in the system. Tell patient to consult a local primary care doctor.";

      const promptText = `
System Instruction: You are a professional, empathetic, and highly knowledgeable AI medical assistant designed for Algerian patients. 
You must communicate naturally in Algerian Darja (الدارجة الجزائرية) if the user speaks in Arabic/Darja, or in Algerian French if they use French. Be professional, warm, and highly realistic.

CRITICAL RULES:
1. You MUST ONLY answer questions related to medicine, health, biology, and healthcare.
2. If the user asks anything outside of the medical domain, politely inform them that you are a medical assistant and cannot answer non-medical questions.
3. IF AN IMAGE IS UPLOADED: YOU MUST ANALYZE IT IF AND ONLY IF IT IS MEDICAL (e.g., X-ray, MRI, blood tests report, physical symptoms like a lesion, medical prescription, radiography). Provide a detailed and professional interpretation, but CLEARLY state that this is for guidance only and does NOT replace a doctor's diagnosis.
4. If an image is uploaded that is CLEARLY NOT MEDICAL (e.g., an animal, a car, landscape, food), politely decline to analyze it and state you can only analyze medical images and documents.
5. Do not provide definitive medical diagnoses or prescribe specific medication. 
6. Keep your answers concise, well-structured, and easy to understand when read aloud. Avoid complex markdown formatting.
7. YOU MUST RECOMMEND A DOCTOR if the user's condition requires it. Use the available doctors list below to recommend a specific, relevant doctor if one matches the required specialty.
${doctorsContext}

Conversation history:
${chatHistory}

Patient: ${userText}
Assistant:`;

      let requestContents: any = promptText;
      
      if (currentImage && currentFile) {
        const base64Data = currentImage.split(",")[1];
        requestContents = [
          {
            role: "user",
            parts: [
              { text: promptText },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: currentFile.type,
                },
              },
            ],
          },
        ];
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: requestContents,
      });

      if (response.text) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: response.text ?? "" },
        ]);
      } else {
        setError(
          language === "ar"
            ? "عذراً، حدث خطأ ما حاول مجدداً."
            : "Désolé, une erreur s'est produite. Veuillez réessayer.",
        );
      }
    } catch (error: any) {
      console.error("Error generating response:", error);
      
      const isQuotaError = error?.message?.includes('exceeded') || error?.status === 429;
      
      const errorMsg = isQuotaError 
        ? (language === "ar" ? "المعذرة، يوجد ضغط كبير على الخدمة حالياً. حاول بعد قليل." : "Le service est saturé. Veuillez réessayer plus tard.")
        : (language === "ar"
          ? "عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً."
          : "Désolé, une erreur de connexion s'est produite. Veuillez réessayer plus tard.");
          
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-20 ${language === "ar" ? "left-6" : "right-6"} z-[9990] bg-indigo-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-indigo-700 transition flex items-center justify-center border-4 border-white`}
            aria-label="Open Medical Assistant"
          >
            <Bot className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-20 ${language === "ar" ? "left-4 md:left-6" : "right-4 md:right-6"} z-[9995] w-[calc(100vw-32px)] md:w-[380px] h-[550px] max-h-[85vh] bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.15)] overflow-hidden flex flex-col border border-slate-200`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {language === "ar"
                      ? "المساعد الطبي المباشر"
                      : "Assistant Médical"}
                  </h3>
                  <p className="text-indigo-100 text-[10px] flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 inline-block"></span>
                    {language === "ar" ? "متصل الآن" : "En ligne"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-indigo-100 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? (language === "ar" ? "justify-end" : "justify-end") : language === "ar" ? "justify-start" : "justify-start"}`}
                  dir={
                    msg.role === "model" && language === "ar"
                      ? "rtl"
                      : undefined
                  }
                >
                  <div
                    className={`max-w-[85%] flex flex-col gap-2 rounded-2xl p-3.5 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-bl-sm"
                        : "bg-white text-slate-700 border border-slate-100 shadow-sm rounded-br-sm"
                    }`}
                  >
                    {msg.image && (
                      <div className="rounded-xl overflow-hidden bg-black/10 flex-shrink-0">
                        <img src={msg.image} alt="Uploaded" className="w-full h-auto max-h-48 object-cover" />
                      </div>
                    )}
                    {msg.text && <span>{msg.text}</span>}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div
                  className={`flex ${language === "ar" ? "justify-start" : "justify-start"}`}
                >
                  <div className="bg-white text-slate-500 border border-slate-100 shadow-sm rounded-2xl rounded-br-sm p-4 flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    ></span>
                  </div>
                </div>
              )}
              {errorError && (
                <div className="text-center text-red-500 text-xs my-2">
                  {errorError}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-white border-t border-slate-100 shrink-0"
            >
              <div className="flex flex-col gap-2">
                {selectedImage && (
                  <div className="relative inline-block self-end mt-1 mb-1 shadow-sm rounded-xl overflow-hidden border border-slate-200 h-24">
                    <img src={selectedImage} alt="Preview" className="h-full w-auto object-cover" />
                    <button 
                      type="button" 
                      onClick={removeImage} 
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 rounded-2xl px-2 py-2 transition-all">
                  <textarea
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                    }}
                    placeholder={
                      language === "ar" ? "أرفق صورة، أو اكتب سؤالك هنا..." : "Joignez une image ou écrivez votre question..."
                    }
                    className="w-full max-h-32 min-h-[40px] bg-transparent resize-none outline-none text-sm px-2 py-2.5 text-slate-700 placeholder:text-slate-400"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  
                  <div className="flex gap-1 items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition"
                      title={language === "ar" ? "أرفق صورة طبية" : "Joindre une image"}
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    
                    <button
                      type="submit"
                      disabled={(!input.trim() && !selectedImage) || isLoading}
                      className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send
                        className={`w-4 h-4 ${language === "ar" ? "-scale-x-100" : ""}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-[9px] text-center text-slate-400 mt-2 flex justify-center items-center gap-1">
                <span>⚠️ {language === "ar"
                  ? "المساعد للإرشاد فقط ولا يغني عن الطبيب المختص."
                  : "Résultats à titre indicatif, consultez un médecin."}</span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
