"use client";

import { Eye, EyeOff } from "lucide-react";

interface AuthInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    showToggle?: boolean;        // whether to show the eye toggle
    showPassword?: boolean;      // current visibility state
    onToggle?: () => void;       // toggle handler
}

export default function AuthInput({
    label,
    error,
    showToggle = false,
    showPassword = false,
    onToggle,
    ...props
}: AuthInputProps) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300">{label}</label>

            <div className="relative">
                <input
                    {...props}
                    className={`
                        w-full
                        rounded-xl
                        border
                        ${error ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/30" : "border-white/10 focus:border-cyan-500 focus:ring-cyan-500/30"}
                        bg-white/5
                        px-4
                        py-3
                        text-white
                        placeholder:text-gray-500
                        outline-none
                        transition
                        focus:ring-2
                        ${showToggle ? "pr-10" : ""}
                    `}
                />
                {showToggle && onToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>

            {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
        </div>
    );
}