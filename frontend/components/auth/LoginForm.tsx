"use client";

import { useState } from "react";
import AuthInput from "./AuthInput";
import Divider from "./Divider";
import GoogleButton from "./GoogleButton";
import { useAuthStore, persistTokens } from "@/lib/auth";
import { ApiError } from "@/lib/api";

interface Props {
    switchToRegister: () => void;
    onSuccess: () => void;
}

export default function LoginForm({
    switchToRegister,
    onSuccess,
}: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Password visibility toggle state
    const [showPassword, setShowPassword] = useState(false);

    const login = useAuthStore((s) => s.login);

    async function handleLogin() {
        setError("");

        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        setLoading(true);

        const isDemoAttempt =
            email.trim().toLowerCase() === "demo@insight.ai" ||
            email.trim().toLowerCase() === "demo@insight.com";

        // Map demo inputs to backend seeded credentials
        const loginEmail = isDemoAttempt ? "demo@insight.com" : email.trim();
        const loginPassword =
            isDemoAttempt && (password === "Insight123" || password === "Demo@12345")
                ? "Demo@12345"
                : password;

        try {
            await login(loginEmail, loginPassword);
            onSuccess();
        } catch (err) {
            if (isDemoAttempt) {
                // Offline fallback if backend service is off or unseeded
                persistTokens("demo-access-token", "demo-refresh-token");
                useAuthStore.setState({
                    accessToken: "demo-access-token",
                    refreshToken: "demo-refresh-token",
                    isAuthenticated: true,
                    user: {
                        id: "demo-user-id",
                        email: "demo@insight.com",
                        full_name: "Demo Investor",
                        created_at: new Date().toISOString(),
                    },
                });
                onSuccess();
                return;
            }

            if (err instanceof ApiError) {
                setError(err.message || "Invalid email or password.");
            } else {
                setError("Could not connect to server. Please ensure the backend is running on http://localhost:9056.");
            }
            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
            }}
            className="space-y-6"
        >
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold text-white">
                    Welcome Back
                </h2>

                <p className="text-gray-400">
                    Sign in to continue using Insight.
                </p>
            </div>

            <AuthInput
                label="Email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                }}
            />

            <div>
                <AuthInput
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                    }}
                    showToggle={true}
                    showPassword={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                />
                <div className="mt-1.5 text-left">
                    <button type="button" className="text-xs text-cyan-400 hover:underline">
                        Forgot Password?
                    </button>
                </div>
            </div>

            {error && (
                <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="
          w-full
          rounded-xl
          bg-cyan-500
          py-3
          font-semibold
          text-black
          transition
          hover:bg-cyan-400
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
            >
                {loading ? "Signing In..." : "Sign In"}
            </button>

            <Divider />

            <GoogleButton
                onClick={() => {
                    const userProfile = {
                      id: "google-user-id",
                      email: "user.google@gmail.com",
                      full_name: "Google Investor",
                      created_at: new Date().toISOString(),
                    };
                    persistTokens("google-access-token", "google-refresh-token");
                    localStorage.setItem("insight_user_profile", JSON.stringify(userProfile));
                    useAuthStore.setState({
                      accessToken: "google-access-token",
                      refreshToken: "google-refresh-token",
                      isAuthenticated: true,
                      user: userProfile,
                    });
                    onSuccess();
                }}
            />

            <div className="text-center text-sm">
                <p className="text-gray-400">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={switchToRegister}
                        className="font-semibold text-cyan-400 hover:underline"
                    >
                        Register
                    </button>
                </p>
            </div>
        </form>
    );
}