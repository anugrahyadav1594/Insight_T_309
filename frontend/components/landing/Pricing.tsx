"use client";

import { motion } from "framer-motion";
import {
    Check,
    ArrowRight,
    Sparkles,
    ShieldCheck,
} from "lucide-react";

const plans = [
    {
        name: "Free",
        price: "₹0",
        period: "/month",
        description: "Perfect for exploring AI-powered investing.",
        features: [
            "5 AI Queries / day",
            "Basic Dashboard",
            "Watchlist",
            "Market News",
            "AI Stock Insights",
        ],
        button: "Get Started",
        popular: false,
    },
    {
        name: "Pro",
        price: "₹499",
        period: "/month",
        description: "Unlock the full power of Insight AI.",
        features: [
            "Unlimited AI Queries",
            "Portfolio Analytics",
            "Advanced Risk Score",
            "Explainable AI",
            "Premium Market News",
            "Smart Alerts",
            "Priority Support",
        ],
        button: "Start Pro",
        popular: true,
    },
];

// Same curve used across Hero.tsx, Features.tsx, HowItWorks.tsx and
// FAQSection.tsx — kept identical so the whole page decelerates the
// same way.
const EASE = [0.16, 1, 0.3, 1] as const;

// Same gentle, well-damped spring used for hover lifts/scales elsewhere.
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

export default function Pricing({
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
            id="pricing"
            className="relative overflow-hidden py-16 text-white"
        >
            {/* Background Glow — same cyan/blue pairing as Features/HowItWorks/FAQ */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-1/2 top-32 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[140px]" />
                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-600/10 blur-[120px]" />
            </div>

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                {/* Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.8, ease: EASE }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-6 py-2 text-lg font-medium text-cyan-300 backdrop-blur-xl">
                        <Sparkles className="h-5 w-5" />
                        Pricing
                    </span>

                    <h2 className="mt-6 text-4xl font-bold md:text-5xl">
                        Simple,{" "}
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Transparent
                        </span>{" "}
                        Pricing
                    </h2>

                    <p className="mt-5 text-lg leading-8 text-slate-400">
                        Start for free and upgrade whenever you're ready to unlock
                        unlimited AI-powered investment insights.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="mt-16 grid gap-8 lg:grid-cols-2">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{
                                duration: 0.7,
                                delay: index * 0.12,
                                ease: EASE,
                            }}
                            whileHover={{
                                y: -8,
                                scale: 1.02,
                                transition: HOVER_SPRING,
                            }}
                            className={`group relative overflow-hidden rounded-[32px] border backdrop-blur-3xl backdrop-saturate-150 shadow-[0_8px_40px_rgba(0,0,0,0.35)] transition-colors duration-500 ease-out transform-gpu will-change-transform
              ${plan.popular
                                    ? "border-cyan-400/40 bg-white/[0.08] shadow-[0_0_50px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/20"
                                    : "border-white/10 bg-white/5 hover:border-cyan-400/30"
                                }`}
                        >
                            {/* Glow */}
                            {plan.popular && (
                                <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-500/20 blur-[100px]" />
                            )}

                            {/* Hover Glow (non-popular card) */}
                            {!plan.popular && (
                                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
                                    <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[100px]" />
                                </div>
                            )}

                            {/* Popular Badge */}
                            {plan.popular && (
                                <motion.div
                                    whileHover={{ scale: 1.06, transition: HOVER_SPRING }}
                                    className="absolute right-6 top-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1 text-xs font-semibold shadow-lg shadow-cyan-500/30"
                                >
                                    ⭐ Most Popular
                                </motion.div>
                            )}

                            <div className="relative p-8">
                                <h3 className="text-2xl font-bold">{plan.name}</h3>

                                <div className="mt-5 flex items-end gap-1">
                                    <span
                                        className={`text-5xl font-extrabold ${plan.popular
                                                ? "bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
                                                : ""
                                            }`}
                                    >
                                        {plan.price}
                                    </span>
                                    <span className="mb-1 text-slate-400">
                                        {plan.period}
                                    </span>
                                </div>

                                <p className="mt-4 text-slate-400">
                                    {plan.description}
                                </p>

                                <button
                                    onClick={isAuthenticated ? onDashboard : onRegister}
                                    className={`group/btn mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-colors duration-300 ease-out
                  ${plan.popular
                                            ? "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30"
                                            : "border border-white/10 bg-white/10 hover:bg-white/20"
                                        }`}
                                >
                                    {plan.button}
                                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                                </button>

                                <div className="my-8 h-px bg-white/10" />

                                <ul className="space-y-4">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-center gap-3 text-slate-300"
                                        >
                                            <Check className="h-5 w-5 text-cyan-400" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Trust Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
                    className="mt-16 flex flex-col items-center justify-center gap-6 text-slate-400 md:flex-row"
                >
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-cyan-300" />
                        No hidden fees
                    </div>

                    <div className="hidden h-5 w-px bg-white/10 md:block" />

                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-cyan-300" />
                        Cancel anytime
                    </div>

                    <div className="hidden h-5 w-px bg-white/10 md:block" />

                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-cyan-300" />
                        Secure payments
                    </div>
                </motion.div>
            </div>
        </section>
    );
}