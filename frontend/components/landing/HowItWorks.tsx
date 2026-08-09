"use client";

import { motion } from "framer-motion";
import { Search, Database, BrainCircuit, Sparkles } from "lucide-react";

const steps = [
    {
        icon: Search,
        title: "Search Any Company",
        description:
            "Search by company name or stock ticker to begin your analysis.",
        points: ["Company Search", "Ticker Support", "Instant Lookup"],
    },
    {
        icon: Database,
        title: "Gather Financial Data",
        description:
            "Insight aggregates all the information required for investment analysis.",
        points: [
            "Annual Reports",
            "Quarterly Results",
            "Financial Statements",
            "Technical Indicators",
            "Market News",
        ],
    },
    {
        icon: BrainCircuit,
        title: "AI Analysis Engine",
        description:
            "Our explainable AI evaluates every company across multiple dimensions.",
        points: [
            "Fundamentals",
            "Technical Trends",
            "Risk Assessment",
            "Growth",
            "Valuation",
            "AI Reasoning",
        ],
        featured: true,
    },
    {
        icon: Sparkles,
        title: "Explainable Investment Report",
        description:
            "Receive transparent recommendations backed by clear reasoning.",
        points: [
            "Investment Score",
            "BUY / HOLD / SELL",
            "Pros & Cons",
            "Risk Score",
            "Natural Language Insights",
        ],
    },
];

// Same curve used in Features.tsx — kept identical so the whole page
// decelerates consistently instead of feeling like different components
// with different motion "personalities".
const EASE = [0.16, 1, 0.3, 1] as const;

// Same gentle, well-damped spring used for the Features card hover lift.
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

export default function HowItWorks({
    onRegister,
    onDashboard,
    isAuthenticated = false,
}: {
    onRegister?: () => void;
    onDashboard?: () => void;
    isAuthenticated?: boolean;
}) {
    return (
        <section
            id="how-it-works"
            suppressHydrationWarning
            className="relative overflow-hidden px-6 py-16"
        >
            <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
            <div className="mx-auto max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.8, ease: EASE }}
                    className="mx-auto mb-20 max-w-3xl text-center"
                >
                    <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-6 py-2 text-lg font-medium text-cyan-300">
                        How It Works
                    </span>
                    <h2 className="mt-6 text-5xl font-bold text-white">
                        From Raw Data to Explainable Intelligence
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-slate-400">
                        Insight transforms scattered financial information into AI-powered,
                        transparent investment insights through a simple four-step pipeline.
                    </p>
                </motion.div>

                <div className="relative">
                    <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-cyan-400/30 via-cyan-400/10 to-transparent lg:block" />

                    <div className="space-y-16">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const reverse = index % 2 === 1;

                            return (
                                <motion.div
                                    key={step.title}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.25 }}
                                    transition={{
                                        duration: 0.7,
                                        delay: index * 0.08,
                                        ease: EASE,
                                    }}
                                    className={`grid items-center gap-10 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""
                                        }`}
                                >
                                    <div className="hidden lg:flex justify-center">
                                        <motion.div
                                            whileHover={{ rotate: 8 }}
                                            transition={{ duration: 0.4, ease: EASE }}
                                            className="flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-500/10 backdrop-blur-2xl"
                                        >
                                            <Icon className="h-9 w-9 text-cyan-300" />
                                        </motion.div>
                                    </div>

                                    <motion.div
                                        whileHover={{
                                            y: -8,
                                            scale: 1.01,
                                            transition: HOVER_SPRING,
                                        }}
                                        className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.08] p-8 backdrop-blur-3xl backdrop-saturate-150 shadow-[0_8px_40px_rgba(0,0,0,0.35)] transition-colors duration-500 ease-out transform-gpu will-change-transform hover:border-cyan-400/40 ${step.featured ? "ring-1 ring-cyan-400/20" : ""
                                            }`}
                                    >
                                        {/* Hover Glow */}
                                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
                                            <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
                                        </div>

                                        <div className="relative">
                                            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 lg:hidden">
                                                <Icon className="h-8 w-8 text-cyan-300" />
                                            </div>

                                            <div className="mb-3 text-sm font-semibold text-cyan-300">
                                                Step {index + 1}
                                            </div>

                                            <h3 className="text-3xl font-bold text-white">
                                                {step.title}
                                            </h3>

                                            <p className="mt-4 text-slate-400">
                                                {step.description}
                                            </p>

                                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                                {step.points.map((point) => (
                                                    <div
                                                        key={point}
                                                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"
                                                    >
                                                        ✓ {point}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Bottom Accent — same treatment as Features cards */}
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            whileHover={{ scaleX: 1 }}
                                            transition={{ duration: 0.45, ease: EASE }}
                                            className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
                                        />
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
                    className="mt-24 text-center"
                >
                    <motion.button
                        onClick={isAuthenticated ? onDashboard : onRegister}
                        whileHover={{ scale: 1.05, transition: HOVER_SPRING }}
                        whileTap={{ scale: 0.97, transition: { duration: 0.15, ease: EASE } }}
                        className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-semibold text-white shadow-lg shadow-cyan-500/30"
                    >
                        Experience Insight
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
}