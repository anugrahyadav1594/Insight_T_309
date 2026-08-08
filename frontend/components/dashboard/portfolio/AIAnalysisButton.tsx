"use client";

import { motion } from "framer-motion";
import { BrainCircuit, ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

interface AIAnalysisButtonProps {
    onClick: () => void;
}

export default function AIAnalysisButton({ onClick }: AIAnalysisButtonProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
            className="mt-8 flex justify-center"
        >
            <motion.button
                onClick={onClick}
                whileHover={{ scale: 1.04, transition: HOVER_SPRING }}
                whileTap={{ scale: 0.96 }}
                className="
          group
          flex
          items-center
          gap-3
          rounded-2xl
          border
          border-cyan-400/30
          bg-gradient-to-r
          from-cyan-500/20
          to-blue-600/20
          px-8
          py-4
          font-semibold
          text-white
          backdrop-blur-xl
          transition-all
          duration-300
          hover:border-cyan-400/60
          hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]
        "
            >
                <BrainCircuit className="h-5 w-5 text-cyan-400" />
                <span>AI Portfolio Analysis</span>
                <ArrowRight className="h-4 w-4 text-cyan-400 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
        </motion.div>
    );
}