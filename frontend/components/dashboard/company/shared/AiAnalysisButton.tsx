"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import AiChatInterpretationModal from "./AiChatInterpretationModal";

interface AiAnalysisButtonProps {
  label: string;
  ticker?: string;
  companyName?: string;
  onClick?: () => void | Promise<void>;
}

export default function AiAnalysisButton({ label, ticker = "RELIANCE", companyName = "Company", onClick }: AiAnalysisButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = async () => {
    if (onClick) {
      await onClick();
    }
    setIsOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-cyan-500/20 px-6 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur-2xl transition-all duration-300 hover:scale-[1.01] hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(34,211,238,0.35)]"
      >
        <Sparkles className="h-5 w-5 text-cyan-300 transition-transform duration-300 group-hover:rotate-12" />
        <span>{label}</span>
      </button>

      <AiChatInterpretationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ticker={ticker}
        companyName={companyName}
        title={label}
      />
    </>
  );
}