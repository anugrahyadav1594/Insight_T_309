"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MessageCircle, ArrowRight } from "lucide-react";

const faqs = [
    {
        question: "What is Insight?",
        answer:
            "Insight is an Explainable AI platform that analyzes financial statements, technical indicators, company fundamentals and market data to help investors make informed decisions.",
    },
    {
        question: "How does the AI generate recommendations?",
        answer:
            "Insight combines company fundamentals, technical indicators, valuation metrics, risk models and market sentiment to generate transparent investment insights.",
    },
    {
        question: "Can I trust the AI's recommendations?",
        answer:
            "Insight does not provide financial advice. Instead, it explains the reasoning behind every recommendation so investors can make their own informed decisions.",
    },
    {
        question: "Which markets are supported?",
        answer:
            "• Indian Equities\n• Future Global Expansion",
    },
    {
        question: "Is my data secure?",
        answer:
            "Yes. Insight encrypts user information and never shares personal financial data with third parties.",
    },
    {
        question: "Is Insight suitable for beginners?",
        answer:
            "Absolutely. Insight explains complex financial concepts in plain English so both beginners and experienced investors can understand investment opportunities.",
    },
];

// Same curve used across Features.tsx and HowItWorks.tsx — kept identical
// so every section on the page decelerates the same way.
const EASE = [0.16, 1, 0.3, 1] as const;

// Same gentle, well-damped spring used for hover lifts/scales elsewhere.
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section
            id="faq"
            className="relative overflow-hidden py-16 text-white"
        >
            {/* Background Glow */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-32 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[140px]" />
                <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            <div className="mx-auto max-w-5xl px-6">
                {/* Section Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: EASE }}
                    viewport={{ once: true, amount: 0.4 }}
                    className="mb-16 text-center"
                >
                    <span className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-6 py-2 text-lg font-medium text-cyan-300 backdrop-blur-xl">
                        Frequently Asked Questions
                    </span>

                    <h2 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
                        Everything you need to know
                        <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            before making smarter investment decisions.
                        </span>
                    </h2>

                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-400">
                        Learn how Insight works, how your data is protected, and why our
                        explainable AI helps investors make more informed decisions.
                    </p>
                </motion.div>

                {/* FAQ Cards */}
                <div className="space-y-5">
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;

                        return (
                            <motion.div
                                key={faq.question}
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{
                                    duration: 0.6,
                                    delay: index * 0.06,
                                    ease: EASE,
                                    layout: { duration: 0.4, ease: EASE },
                                }}
                                className={`overflow-hidden rounded-3xl border backdrop-blur-3xl transition-colors duration-500 ease-out ${isOpen
                                    ? "border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.08)]"
                                    : "border-white/10 bg-white/5 hover:border-cyan-400/30"
                                    }`}
                            >
                                <button
                                    onClick={() =>
                                        setOpenIndex(isOpen ? null : index)
                                    }
                                    className="flex w-full items-center justify-between px-7 py-6 text-left"
                                >
                                    <h3 className="text-lg font-semibold md:text-xl">
                                        {faq.question}
                                    </h3>

                                    <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.4, ease: EASE }}
                                        whileHover={{ scale: 1.08, transition: HOVER_SPRING }}
                                        className="ml-6 rounded-full border border-white/10 bg-white/5 p-2"
                                    >
                                        <ChevronDown className="h-5 w-5 text-cyan-300" />
                                    </motion.div>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            key="content"
                                            initial={{
                                                opacity: 0,
                                                height: 0,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                height: "auto",
                                            }}
                                            exit={{
                                                opacity: 0,
                                                height: 0,
                                            }}
                                            transition={{
                                                duration: 0.4,
                                                ease: EASE,
                                            }}
                                            className="overflow-hidden"
                                        >
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    y: 8,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: 8,
                                                }}
                                                transition={{
                                                    duration: 0.35,
                                                    ease: EASE,
                                                }}
                                                className="border-t border-white/10 px-7 pb-7 pt-5"
                                            >
                                                <p className="whitespace-pre-line text-base font-medium leading-relaxed text-slate-300">
                                                    {faq.answer}
                                                </p>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.7, ease: EASE }}
                    viewport={{ once: true, amount: 0.4 }}
                    className="mt-20"
                >
                    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-3xl">
                        <motion.div
                            whileHover={{ rotate: 8, transition: { duration: 0.4, ease: EASE } }}
                            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10"
                        >
                            <MessageCircle className="h-8 w-8 text-cyan-300" />
                        </motion.div>

                        <h3 className="mt-6 text-3xl font-bold">
                            Still have questions?
                        </h3>

                        <p className="mx-auto mt-4 max-w-xl text-gray-400">
                            Contact our team or explore the dashboard to discover how Insight
                            helps you make smarter, explainable investment decisions.
                        </p>

                        <motion.a
                            href="#contact"
                            whileHover={{ scale: 1.04, transition: HOVER_SPRING }}
                            whileTap={{ scale: 0.96, transition: { duration: 0.15, ease: EASE } }}
                            className="group mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3 font-medium text-white transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]"
                        >
                            Contact Us
                            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                        </motion.a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}