"use client";

import { motion } from "framer-motion";
import {
    BrainCircuit,
    TrendingUp,
    FileText,
    ShieldCheck,
    LayoutDashboard,
} from "lucide-react";

const features = [
    {
        title: "AI Explainability",
        description:
            "Ask questions in plain English and receive transparent, AI-generated investment reasoning.",
        icon: BrainCircuit,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "Real-Time Analysis",
        description:
            "Track technical indicators, price action and momentum as markets move.",
        icon: TrendingUp,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "Company Intelligence",
        description:
            "Transform annual reports, earnings calls and financial statements into concise, actionable insights powered by AI.",
        icon: FileText,
        className: "md:col-span-2 md:row-span-1",
    },
    {
        title: "Risk Engine",
        description:
            "Evaluate investment risk using AI-driven financial and market signals.",
        icon: ShieldCheck,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "Unified Dashboard",
        description:
            "Fundamental, technical and risk analysis together in one intelligent workspace.",
        icon: LayoutDashboard,
        className: "md:col-span-1 md:row-span-1",
    },
];

// A single "expo-out" style curve used everywhere so every animation on
// this page decelerates the same way — that consistency is most of what
// reads as "smooth" (mixing spring-bounce with linear/ease-in-out is what
// makes motion feel janky).
const EASE = [0.16, 1, 0.3, 1] as const;

// One shared, gentle spring for the hover lift — tuned low-stiffness /
// well-damped so it glides to rest instead of overshooting and bouncing.
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

export default function Features() {
    return (
        <section id="features"
            className="relative overflow-hidden px-6 py-16"
        >
            {/* Background Glow */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[170px]" />
                <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[150px]" />
            </div>

            <div className="mx-auto max-w-7xl px-6">
                {/* Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: EASE }}
                    viewport={{ once: true, amount: 0.4 }}
                    className="mx-auto mb-20 max-w-3xl text-center"
                >
                    <h2 className="text-4xl font-black leading-tight md:text-6xl">
                        Everything You Need to{" "}
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Invest Smarter
                        </span>
                    </h2>

                    <p className="mt-6 text-lg leading-8 text-slate-400">
                        Replace scattered research with one AI-powered platform that
                        explains every investment decision with clarity and confidence.
                    </p>
                </motion.div>

                {/* Grid */}
                <div className="grid gap-8 md:grid-cols-2">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;

                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{
                                    duration: 0.7,
                                    delay: index * 0.08,
                                    ease: EASE,
                                }}
                                whileHover={{
                                    y: -8,
                                    scale: 1.02,
                                    transition: HOVER_SPRING,
                                }}
                                className={`${feature.className}
                  group
                  relative
                  overflow-hidden
                  rounded-[32px]
                  border
                  border-white/10
                  bg-white/5
                  p-8
                  backdrop-blur-3xl
                  transition-colors
                  duration-500
                  ease-out
                  transform-gpu
                  will-change-transform
                  hover:border-cyan-400/40
                `}
                            >
                                {/* Hover Glow */}
                                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
                                    <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
                                </div>

                                <motion.div
                                    whileHover={{ rotate: 8 }}
                                    transition={{ duration: 0.4, ease: EASE }}
                                    className="relative mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400"
                                >
                                    <Icon size={32} />
                                </motion.div>

                                <div className="relative">
                                    <h3 className="text-2xl font-bold">
                                        {feature.title}
                                    </h3>

                                    <p className="mt-4 leading-8 text-slate-400">
                                        {feature.description}
                                    </p>
                                </div>

                                {/* Bottom Accent */}
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    whileHover={{ scaleX: 1 }}
                                    transition={{ duration: 0.45, ease: EASE }}
                                    className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
                                />
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}