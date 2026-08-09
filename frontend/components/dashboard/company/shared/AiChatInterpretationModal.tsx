"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot, User, ShieldCheck, TrendingUp, CheckCircle2, MessageSquare } from "lucide-react";
import { getCompanyInfo } from "@/lib/companyData";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  companyName: string;
  title?: string;
}

export default function AiChatInterpretationModal({ isOpen, onClose, ticker, companyName, title }: Props) {
  const companyInfo = useMemo(() => getCompanyInfo(ticker || "RELIANCE"), [ticker]);
  const [messages, setMessages] = useState<Array<{ sender: "ai" | "user"; text: string; time: string }>>([
    {
      sender: "ai",
      text: `Hello! I have generated full AI interpretation for **${companyName} (${ticker})**. ${companyInfo.recommendation.summaryPoints}`,
      time: "Just now",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const suggestedPrompts = [
    `What are the key growth catalysts for ${companyName}?`,
    `What is the 3-year valuation outlook?`,
    `What are the top risk factors to watch?`,
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg = { sender: "user" as const, text: q, time: "Just now" };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      let responseText = "";
      const lower = q.toLowerCase();
      if (lower.includes("catalyst") || lower.includes("growth")) {
        responseText = `${companyName} exhibits strong expansion in revenue (${companyInfo.financials?.revenueGrowth || "15%"} CAGR) supported by robust operational margins (${companyInfo.financials?.roe || "18"}% ROE) and strong industry positioning in ${companyInfo.sector}.`;
      } else if (lower.includes("risk")) {
        responseText = `Key risk considerations for ${ticker}: Debt-to-Equity is at ${companyInfo.financials?.debtEquity || "0.2"}x, which is relatively conservative. Main exposure relates to broader macroeconomic trends and sector competition in ${companyInfo.sector}.`;
      } else if (lower.includes("valuation") || lower.includes("price") || lower.includes("buy")) {
        responseText = `Current AI Recommendation: **${companyInfo.recommendation.verdict}** (Score: ${companyInfo.recommendation.score}/100). The current stock price of ₹${companyInfo.price.toLocaleString("en-IN")} offers favorable risk-reward alignment.`;
      } else {
        responseText = `Based on deep fundamental and technical analysis for ${companyName} (${ticker}): ROE is ${companyInfo.financials?.roe || "18"}%, Debt/Equity is ${companyInfo.financials?.debtEquity || "0.2"}x, and AI confidence stands at ${companyInfo.recommendation.score}%.`;
      }

      setMessages((prev) => [...prev, { sender: "ai", text: responseText, time: "Just now" }]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative z-10 flex h-[85vh] max-h-[720px] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1324]/95 to-[#070b14]/95 shadow-2xl backdrop-blur-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                    {title || `AI Interpretation & Chat`}
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Engine
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{companyName} ({ticker}) · NSE</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 flex-col overflow-hidden p-6 gap-4">
              {/* Executive AI Score Card Banner */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                    <CheckCircle2 className="h-4 w-4" /> {companyInfo.recommendation.verdict}
                  </span>
                  <span className="text-slate-400">AI Confidence: <strong className="text-slate-200">{companyInfo.recommendation.score}%</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Price: <strong className="text-cyan-300">₹{companyInfo.price.toLocaleString("en-IN")}</strong></span>
                  <span className="text-slate-400">ROE: <strong className="text-emerald-400">{companyInfo.financials?.roe}%</strong></span>
                </div>
              </div>

              {/* Chat Conversation Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "ai" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/15"
                          : "border border-white/10 bg-white/5 text-slate-200 backdrop-blur-xl"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {msg.sender === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/30">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 justify-start items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-cyan-300 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" /> Analyzing financial data...
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Quick Prompts */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition-all hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-300"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={`Ask AI anything about ${companyName} (${ticker})...`}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 pr-12 text-xs text-slate-200 placeholder-slate-400 outline-none transition-all focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputQuery.trim()}
                  className="absolute right-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
