"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Shield } from "lucide-react";
import { useAuthStore } from "@/lib/auth";

interface FullProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FullProfileModal({ isOpen, onClose }: FullProfileModalProps) {
    const user = useAuthStore((s) => s.user);

    const [name, setName] = useState(user?.full_name || "Account User");
    const [email, setEmail] = useState(user?.email || "user@insight.com");

    useEffect(() => {
        if (user) {
            setName(user.full_name || "Account User");
            setEmail(user.email || "user@insight.com");
        }
    }, [user]);

    const picture = (user as any)?.picture || null;
    const avatar = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
    const subscription = "Pro Tier";
    const plan = "₹499/month";

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
              max-h-[90vh]
              overflow-y-auto
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

                        <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4 mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-cyan-400" />
                            Profile Details
                        </h3>

                        <div className="flex flex-col items-center gap-4">
                            {picture ? (
                                <img
                                    src={picture}
                                    alt={name}
                                    className="h-24 w-24 rounded-full object-cover ring-3 ring-cyan-400/40 shadow-lg shadow-cyan-500/20"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-3xl font-bold text-white">
                                    {avatar}
                                </div>
                            )}

                            <div className="w-full space-y-3">
                                {/* Name field — read-only from Google */}
                                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-400 text-sm">Name</span>
                                    </div>
                                    <span className="text-white font-medium">{name}</span>
                                </div>

                                {/* Email field — read-only from Google */}
                                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-400 text-sm">Email</span>
                                    </div>
                                    <span className="text-white font-medium">{email}</span>
                                </div>

                                {/* Auth provider */}
                                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-400 text-sm">Sign-in</span>
                                    </div>
                                    <span className="text-cyan-400 font-medium text-sm">Google Account</span>
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                    <span className="text-slate-400 text-sm">Subscription</span>
                                    <span className="text-cyan-400 font-medium">{subscription}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                    <span className="text-slate-400 text-sm">Plan</span>
                                    <span className="text-white font-medium">{plan}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={onClose}
                                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:scale-105"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}