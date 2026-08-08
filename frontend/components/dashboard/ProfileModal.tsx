"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, User, Settings, CreditCard, ArrowRight } from "lucide-react";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenProfile: () => void;
    onOpenSettings: () => void;
    onOpenSubscription: () => void;
}

const USER_DATA = {
    name: "Demo User",
    email: "demo@insight.ai",
    avatar: "DU",
    subscription: "Pro",
};

export default function ProfileModal({
    isOpen,
    onClose,
    onOpenProfile,
    onOpenSettings,
    onOpenSubscription,
}: ProfileModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal */}
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
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                        >
                            <X size={18} />
                        </button>

                        {/* User Info */}
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-2xl font-bold text-white">
                                {USER_DATA.avatar}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{USER_DATA.name}</h3>
                                <p className="text-sm text-slate-400">{USER_DATA.email}</p>
                                <span className="mt-1 inline-block rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                                    {USER_DATA.subscription}
                                </span>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenProfile();
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-slate-300 transition hover:bg-white/5 hover:text-white"
                            >
                                <User className="h-5 w-5 text-cyan-400" />
                                <span>View Full Profile</span>
                                <ArrowRight className="ml-auto h-4 w-4 text-slate-500" />
                            </button>

                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenSettings();
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-slate-300 transition hover:bg-white/5 hover:text-white"
                            >
                                <Settings className="h-5 w-5 text-slate-400" />
                                <span>Settings</span>
                                <ArrowRight className="ml-auto h-4 w-4 text-slate-500" />
                            </button>

                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenSubscription();
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-slate-300 transition hover:bg-white/5 hover:text-white"
                            >
                                <CreditCard className="h-5 w-5 text-slate-400" />
                                <span>Subscription</span>
                                <ArrowRight className="ml-auto h-4 w-4 text-slate-500" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}