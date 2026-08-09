"use client";

import { motion } from "framer-motion";
import { Newspaper, Calendar, ExternalLink } from "lucide-react";
import type { CompanyAnalysisData } from "@/lib/companyData";

const EASE = [0.16, 1, 0.3, 1] as const;

interface CompanyNewsProps {
  data: CompanyAnalysisData;
}

export default function CompanyNews({ data }: CompanyNewsProps) {
  const { news } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
      whileHover={{
        y: -6,
        scale: 1.01,
        transition: { type: "spring", stiffness: 260, damping: 24, mass: 0.9 },
      }}
      className="
        group relative mt-8 overflow-hidden rounded-[32px] border border-white/10
        bg-white/5 p-8 backdrop-blur-3xl shadow-2xl transition-colors duration-500
        ease-out hover:border-cyan-400/40
      "
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-cyan-400" />
            Recent News & Corporate Action
          </h3>
          <span className="text-xs text-slate-400">Chronological feed</span>
        </div>

        {/* Timeline list */}
        <div className="relative border-l border-white/10 pl-6 ml-3 space-y-6">
          {news.map((item, index) => {
            const href = (item as any).url || `https://www.google.com/search?q=${encodeURIComponent(item.title)}`;
            return (
              <a
                key={index}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group/item block relative rounded-2xl p-3 -ml-3 border border-transparent transition-all duration-300 hover:border-cyan-500/30 hover:bg-cyan-500/10"
              >
                {/* Dot */}
                <div className="absolute -left-[20px] top-4 h-3.5 w-3.5 rounded-full border-2 border-[#0B1220] bg-cyan-400 group-hover/item:scale-125 transition-transform" />

                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                    <Calendar className="h-3 w-3" />
                    <span>{item.time}</span>
                    <span>•</span>
                    <span className="text-cyan-400/80 font-mono">{item.source}</span>
                  </div>
                  <h4 className="mt-1 text-sm font-bold text-white group-hover/item:text-cyan-300 transition-colors flex items-center justify-between gap-2">
                    <span>{item.title}</span>
                    <ExternalLink className="h-4 w-4 shrink-0 text-cyan-400 opacity-70 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-all" />
                  </h4>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
      />
    </motion.div>
  );
}
