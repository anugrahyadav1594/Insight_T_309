"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Bell, Moon, Eye, EyeOff, Settings as SettingsIcon } from "lucide-react";
import CustomSelect from "./screener/CustomSelect";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Theme dropdown component reused
function ThemeDropdown({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) {
    const options = [
        { label: "Dark", value: "dark" },
        { label: "Light", value: "light" },
    ];

    return (
        <div className="w-32">
            <CustomSelect
                value={value}
                onChange={onChange}
                options={options}
                placeholder="Theme"
            />
        </div>
    );
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [theme, setTheme] = useState("dark");
    const [notifications, setNotifications] = useState(true);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Password visibility states
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        alert("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
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
              max-w-lg
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
                            <SettingsIcon className="h-5 w-5 text-cyan-400" />
                            Settings
                        </h3>

                        <div className="space-y-6">
                            {/* Change Password */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-3">
                                    <Lock className="h-4 w-4" />
                                    Change Password
                                </h4>
                                <form onSubmit={handlePasswordChange} className="space-y-3">
                                    {/* Current Password */}
                                    <div className="relative">
                                        <input
                                            type={showOldPassword ? "text" : "password"}
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            placeholder="Current password"
                                            required
                                            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 pr-10 text-sm text-white outline-none focus:border-cyan-400/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                        >
                                            {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {/* New Password */}
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="New password"
                                            required
                                            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 pr-10 text-sm text-white outline-none focus:border-cyan-400/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {/* Confirm New Password */}
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            required
                                            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 pr-10 text-sm text-white outline-none focus:border-cyan-400/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:scale-105"
                                    >
                                        Update Password
                                    </button>
                                </form>
                            </div>

                            {/* Preferences */}
                            <div className="border-t border-white/10 pt-4">
                                <h4 className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-3">
                                    <Bell className="h-4 w-4" />
                                    Preferences
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-300">Theme</span>
                                        <ThemeDropdown value={theme} onChange={setTheme} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-300">Notifications</span>
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                checked={notifications}
                                                onChange={(e) => setNotifications(e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-600 transition after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-white/10 after:bg-white after:transition-all peer-checked:bg-cyan-500 peer-checked:after:translate-x-full"></div>
                                        </label>
                                    </div>
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

function Settings({ className }: { className?: string }) {
    return <Moon className={className} />;
}