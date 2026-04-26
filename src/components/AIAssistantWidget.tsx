import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { useLanguage } from "../contexts/LanguageContext";

export function AIAssistantWidget() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "model"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [errorError, setError] = useState<string | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Initialize with a welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "model",
          text:
            language === "ar"
              ? "مرحباً بك! أنا مساعدك الطبي الذكي. واش نقدر نعاونك اليوم بخصوص صحتك؟ (ملاحظة: أنا هنا نجاوبك على أسئلتك الطبية العامة وما نعوضش استشارة الطبيب المختص)."
              : "Bonjour ! Je suis votre assistant médical intelligent. Comment puis-je vous aider avec votre santé aujourd'hui ? (Note: Je fournis des informations médicales générales et je ne remplace pas une consultation chez un médecin).",
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history for context
      const chatHistory = messages
        .map(
          (msg) =>
            `${msg.role === "user" ? "Patient" : "Assistant"}: ${msg.text}`,
        )
        .join("\n");

      const prompt = `
System Instruction: You are a professional, empathetic, and highly knowledgeable AI medical assistant designed for Algerian patients. 
You must communicate naturally in Algerian Darja (الدارجة الجزائرية) if the user speaks in Arabic/Darja, or in Algerian French if they use French. Be professional, warm, and highly realistic.

CRITICAL RULES:
1. You MUST ONLY answer questions related to medicine, health, biology, and healthcare.
2. If the user asks anything outside of the medical domain, you must politely inform them in Algerian Darja (or French, depending on context) that you are a medical assistant and can only answer questions related to medicine and health.
3. Do not provide definitive medical diagnoses or prescribe specific medication. Always advise them to consult a doctor for serious or persistent symptoms.
4. Keep your answers concise, well-structured, and easy to understand. Numbered or bulleted lists are good for clarity.
5. Use recognizable Algerian medical terms where appropriate (e.g., سبيطار، طبيب، دواء، برا، مسوس).

Conversation history:
${chatHistory}

Patient: ${userText}
Assistant:`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (response.text) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: response.text },
        ]);
      } else {
        setError(
          language === "ar"
            ? "عذراً، حدث خطأ ما حاول مجدداً."
            : "Désolé, une erreur s'est produite. Veuillez réessayer.",
        );
      }
    } catch (error) {
      console.error("Error generating response:", error);
      setError(
        language === "ar"
          ? "عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً."
          : "Désolé, une erreur de connexion s'est produite. Veuillez réessayer plus tard.",
      );
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
            className={`fixed bottom-20 ${language === "ar" ? "left-6" : "right-6"} z-50 bg-indigo-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-indigo-700 transition flex items-center justify-center border-4 border-white`}
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
            className={`fixed bottom-20 ${language === "ar" ? "left-4 md:left-6" : "right-4 md:right-6"} z-50 w-[calc(100vw-32px)] md:w-[380px] h-[500px] max-h-[80vh] bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.15)] overflow-hidden flex flex-col border border-slate-200`}
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
                      ? "المساعد الطبي الذكي"
                      : "Assistant Médical Intelligent"}
                  </h3>
                  <p className="text-indigo-100 text-[10px] flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 inline-block"></span>
                    {language === "ar" ? "متصل الآن" : "En ligne"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-indigo-100 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
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
                    className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-bl-sm"
                        : "bg-white text-slate-700 border border-slate-100 shadow-sm rounded-br-sm"
                    }`}
                  >
                    {msg.text}
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

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-white border-t border-slate-100 shrink-0"
            >
              <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-2 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    language === "ar"
                      ? "اكتب سؤالك الطبي المباشر هنا..."
                      : "Posez votre question médicale..."
                  }
                  className="w-full max-h-32 min-h-[40px] bg-transparent resize-none outline-none text-sm px-2 py-2.5 text-slate-700"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send
                    className={`w-4 h-4 ${language === "ar" ? "-scale-x-100" : ""}`}
                  />
                </button>
              </div>
              <div className="text-[9px] text-center text-slate-400 mt-2">
                {language === "ar"
                  ? "هذا الذكاء الاصطناعي مخصص للإرشاد فقط ولا يعد بديلاً لاستشارة الطبيب."
                  : "Cette IA est à titre indicatif et ne remplace pas l'avis d'un médecin."}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
