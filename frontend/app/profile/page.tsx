"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Lock,
    Bell,
    CreditCard,
    History,
    Edit2,
    Check,
    X,
    LogOut,
    Eye,
    EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/dashboard/screener/CustomSelect";

// Mock user data (should come from auth context in production)
const USER_DATA = {
    name: "Demo User",
    email: "demo@insight.ai",
    avatar: "DU",
    subscription: "Pro",
    plan: "₹499/month",
    theme: "dark",
    notifications: true,
    activity: [
        { action: "Logged in", time: "Today, 10:32 AM" },
        { action: "Viewed INFY analysis", time: "Today, 09:15 AM" },
        { action: "Added TCS to watchlist", time: "Yesterday, 06:20 PM" },
        { action: "Updated portfolio", time: "2 days ago" },
        { action: "Ran AI Screener", time: "3 days ago" },
    ],
};

// Custom dropdown component with rounded-tip SVG arrow
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

export default function ProfilePage() {
    const router = useRouter();
    const [name, setName] = useState(USER_DATA.name);
    const [email, setEmail] = useState(USER_DATA.email);
    const [theme, setTheme] = useState(USER_DATA.theme);
    const [notifications, setNotifications] = useState(USER_DATA.notifications);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [editingField, setEditingField] = useState<"name" | "email" | null>(null);
    const [tempValue, setTempValue] = useState("");

    // Password visibility states
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleEdit = (field: "name" | "email") => {
        setEditingField(field);
        setTempValue(field === "name" ? name : email);
    };

    const handleSave = () => {
        if (editingField === "name") setName(tempValue);
        if (editingField === "email") setEmail(tempValue);
        setEditingField(null);
        alert("Profile updated successfully!");
    };

    const handleCancel = () => {
        setEditingField(null);
    };

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
        <div className="relative min-h-screen px-6 pt-24 pb-20 text-white">
            {/* Background Glows */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[160px]" />
                <div className="absolute right-1/4 top-60 h-96 w-96 rounded-full bg-blue-600/10 blur-[160px]" />
            </div>

            <div className="mx-auto max-w-4xl px-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl text-white">
                            Profile
                        </h1>
                        <p className="mt-1 text-slate-400">Manage your account settings</p>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/30 hover:bg-white/10 hover:text-white"
                    >
                        Back to Dashboard
                    </button>
                </div>

                <div className="mt-8 space-y-8">
                    {/* Avatar & Name Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-3xl shadow-2xl hover:border-cyan-400/40"
                    >
                        <div className="flex items-center gap-6">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-3xl font-bold text-white">
                                {USER_DATA.avatar}
                            </div>
                            <div className="flex-1">
                                {editingField === "name" ? (
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xl font-bold text-white outline-none focus:border-cyan-400/50"
                                            autoFocus
                                        />
                                        <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300">
                                            <Check className="h-5 w-5" />
                                        </button>
                                        <button onClick={handleCancel} className="text-red-400 hover:text-red-300">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold text-white">{name}</h2>
                                        <button
                                            onClick={() => handleEdit("name")}
                                            className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                                {editingField === "email" ? (
                                    <div className="flex items-center gap-3 mt-2">
                                        <input
                                            type="email"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                                            autoFocus
                                        />
                                        <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300">
                                            <Check className="h-5 w-5" />
                                        </button>
                                        <button onClick={handleCancel} className="text-red-400 hover:text-red-300">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-slate-400">{email}</span>
                                        <button
                                            onClick={() => handleEdit("email")}
                                            className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Account Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-3xl shadow-2xl hover:border-cyan-400/40"
                    >
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                            <Lock className="h-5 w-5 text-cyan-400" />
                            Change Password
                        </h3>
                        <form onSubmit={handlePasswordChange} className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showOldPassword ? "text" : "password"}
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 pr-10 text-white outline-none focus:border-cyan-400/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                    >
                                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 pr-10 text-white outline-none focus:border-cyan-400/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 pr-10 text-white outline-none focus:border-cyan-400/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:scale-105"
                            >
                                Update Password
                            </button>
                        </form>
                    </motion.div>

                    {/* Preferences */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-3xl shadow-2xl hover:border-cyan-400/40"
                    >
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                            <Bell className="h-5 w-5 text-cyan-400" />
                            Preferences
                        </h3>
                        <div className="mt-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-white">Theme</p>
                                    <p className="text-sm text-slate-400">Switch between light and dark mode</p>
                                </div>
                                <ThemeDropdown value={theme} onChange={setTheme} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-white">Notifications</p>
                                    <p className="text-sm text-slate-400">Receive email alerts and updates</p>
                                </div>
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
                    </motion.div>

                    {/* Subscription */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-3xl shadow-2xl hover:border-cyan-400/40"
                    >
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                            <CreditCard className="h-5 w-5 text-cyan-400" />
                            Subscription Plan
                        </h3>
                        <div className="mt-6 flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-white">{USER_DATA.subscription}</p>
                                <p className="text-sm text-slate-400">{USER_DATA.plan} • Billed monthly</p>
                            </div>
                            <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/30 hover:bg-white/10 hover:text-white">
                                Manage
                            </button>
                        </div>
                    </motion.div>

                    {/* Activity Log */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-3xl shadow-2xl hover:border-cyan-400/40"
                    >
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                            <History className="h-5 w-5 text-cyan-400" />
                            Recent Activity
                        </h3>
                        <div className="mt-6 space-y-3">
                            {USER_DATA.activity.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm"
                                >
                                    <span className="text-slate-300">{item.action}</span>
                                    <span className="text-slate-500">{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}