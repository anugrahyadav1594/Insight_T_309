"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Check, Crown } from "lucide-react";

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SUBSCRIPTION_DATA = {
    plan: "Pro",
    price: "₹499/month",
    features: [
        "Unlimited AI Queries",
        "Portfolio Analytics",
        "Advanced Risk Score",
        "Explainable AI",
        "Premium Market News",
        "Smart Alerts",
        "Priority Support",
    ],
    billingDate: "August 15, 2026",
};

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="
              relative
              w-full
              max-w-md
              rounded-3xl
              border
              border-white/10
              bg-[#0B1220]
              p-6
              shadow-2xl
              backdrop-blur-3xl
              z-10
            "
                    >
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
                            <Crown className="h-6 w-6 text-cyan-400" />
                            <h3 className="text-xl font-bold text-white">Subscription Plan</h3>
                        </div>

                        <div className="text-center py-4">
                            <div className="text-4xl font-extrabold text-white">{SUBSCRIPTION_DATA.plan}</div>
                            <div className="mt-2 text-2xl font-bold text-cyan-400">{SUBSCRIPTION_DATA.price}</div>
                            <p className="mt-1 text-sm text-slate-400">Billed monthly</p>
                            <p className="mt-1 text-xs text-slate-500">Next billing: {SUBSCRIPTION_DATA.billingDate}</p>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <h4 className="text-sm font-semibold text-slate-400 mb-3">Included Features</h4>
                            <div className="space-y-2">
                                {SUBSCRIPTION_DATA.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                                        <Check className="h-4 w-4 text-cyan-400" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 font-semibold text-slate-300 transition hover:bg-white/10"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => alert("Manage subscription flow goes here")}
                                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2 font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:scale-105"
                            >
                                Manage
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}