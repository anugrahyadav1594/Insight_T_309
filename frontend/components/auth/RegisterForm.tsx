"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import AuthInput from "./AuthInput";
import Divider from "./Divider";
import GoogleButton from "./GoogleButton";

interface Props {
    switchToLogin: () => void;
    onSuccess: () => void;
}

export default function RegisterForm({
    switchToLogin,
    onSuccess,
}: Props) {
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{
        fullName?: string;
        username?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        form?: string;
    }>({});
    const [isLoading, setIsLoading] = useState(false);

    // Password visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password strength calculation
    const getPasswordStrength = (pass: string) => {
        if (!pass) return { score: 0, label: "", color: "" };
        let score = 0;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;

        switch (score) {
            case 1:
                return { score: 25, label: "Weak", color: "bg-red-500", text: "text-red-400" };
            case 2:
                return { score: 50, label: "Fair", color: "bg-yellow-500", text: "text-yellow-400" };
            case 3:
                return { score: 75, label: "Good", color: "bg-cyan-500", text: "text-cyan-400" };
            case 4:
                return { score: 100, label: "Strong", color: "bg-emerald-500", text: "text-emerald-400" };
            default:
                return { score: 15, label: "Very Weak", color: "bg-red-500", text: "text-red-400" };
        }
    };

    const strength = getPasswordStrength(password);

    const validate = () => {
        const newErrors: typeof errors = {};

        if (!fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (fullName.trim().length < 2) {
            newErrors.fullName = "Name must be at least 2 characters";
        }

        if (!username.trim()) {
            newErrors.username = "Username is required";
        } else if (username.length < 3) {
            newErrors.username = "Username must be at least 3 characters";
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            newErrors.username = "Username can only contain letters, numbers, and underscores";
        }

        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validate()) return;

        setIsLoading(true);

        try {
            // Simulate API call delay
            await new Promise((resolve) => setTimeout(resolve, 1000));
            onSuccess();
        } catch {
            setErrors({ form: "Failed to create account. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1 text-center">
                <h2 className="text-3xl font-bold text-white">
                    Create Account
                </h2>
                <p className="text-gray-400 text-sm">
                    Start investing smarter with Insight.
                </p>
            </div>

            {errors.form && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
                    {errors.form}
                </div>
            )}

            <AuthInput
                label="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                error={errors.fullName}
            />

            <AuthInput
                label="Username"
                placeholder="johndoe"
                value={username}
                onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                }}
                error={errors.username}
            />

            <AuthInput
                label="Email"
                placeholder="john@example.com"
                type="email"
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
            />

            <div>
                <AuthInput
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    error={errors.password}
                    showToggle={true}
                    showPassword={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                />

                {/* Password Strength Indicator */}
                {password && (
                    <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Password strength:</span>
                            <span className={`font-medium ${strength.text}`}>{strength.label}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className={`h-full transition-all duration-300 ${strength.color}`}
                                style={{ width: `${strength.score}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <AuthInput
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                error={errors.confirmPassword}
                showToggle={true}
                showPassword={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <button
                type="submit"
                disabled={isLoading}
                className="
                    mt-2
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-cyan-500
                    py-3
                    font-semibold
                    text-black
                    transition
                    hover:bg-cyan-400
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                "
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin text-black" />
                        <span>Registering...</span>
                    </>
                ) : (
                    "Register"
                )}
            </button>

            <Divider />

            <GoogleButton />

            <p className="text-center text-sm text-gray-400">
                Already have an account?{" "}
                <button
                    type="button"
                    onClick={switchToLogin}
                    className="font-semibold text-cyan-400 hover:underline"
                >
                    Sign In
                </button>
            </p>
        </form>
    );
}