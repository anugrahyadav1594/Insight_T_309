"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Edit2, Check, X as Cancel } from "lucide-react";

interface FullProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FullProfileModal({ isOpen, onClose }: FullProfileModalProps) {
    // User data state (mock, can be replaced with global state)
    const [name, setName] = useState("Demo User");
    const [email, setEmail] = useState("demo@insight.ai");
    const [avatar] = useState("DU");
    const [subscription] = useState("Pro");
    const [plan] = useState("₹499/month");

    // Editing state
    const [editingField, setEditingField] = useState<"name" | "email" | null>(null);
    const [tempValue, setTempValue] = useState("");

    const handleEdit = (field: "name" | "email") => {
        setEditingField(field);
        setTempValue(field === "name" ? name : email);
    };

    const handleSave = () => {
        if (editingField === "name") setName(tempValue);
        if (editingField === "email") setEmail(tempValue);
        setEditingField(null);
        // Optional: show a success toast or alert
        alert("Profile updated successfully!");
    };

    const handleCancel = () => {
        setEditingField(null);
    };

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
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-3xl font-bold text-white">
                                {avatar}
                            </div>

                            <div className="w-full space-y-4">
                                {/* Name field */}
                                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                    <span className="text-slate-400">Name</span>
                                    {editingField === "name" ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={tempValue}
                                                onChange={(e) => setTempValue(e.target.value)}
                                                className="rounded-lg bg-black/40 px-3 py-1 text-sm text-white outline-none border border-white/10 focus:border-cyan-400/50"
                                                autoFocus
                                            />
                                            <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300">
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button onClick={handleCancel} className="text-red-400 hover:text-red-300">
                                                <Cancel className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-white font-medium">{name}</span>
                                            <button
                                                onClick={() => handleEdit("name")}
                                                className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Email field */}
                                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                    <span className="text-slate-400">Email</span>
                                    {editingField === "email" ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="email"
                                                value={tempValue}
                                                onChange={(e) => setTempValue(e.target.value)}
                                                className="rounded-lg bg-black/40 px-3 py-1 text-sm text-white outline-none border border-white/10 focus:border-cyan-400/50"
                                                autoFocus
                                            />
                                            <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300">
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button onClick={handleCancel} className="text-red-400 hover:text-red-300">
                                                <Cancel className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-white font-medium">{email}</span>
                                            <button
                                                onClick={() => handleEdit("email")}
                                                className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                    <span className="text-slate-400">Subscription</span>
                                    <span className="text-cyan-400 font-medium">{subscription}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                    <span className="text-slate-400">Plan</span>
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