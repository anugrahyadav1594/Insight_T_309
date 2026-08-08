"use client";

import { useState } from "react";
import AuthInput from "./AuthInput";
import Divider from "./Divider";
import GoogleButton from "./GoogleButton";

interface Props {
    switchToRegister: () => void;
    onSuccess: () => void;
}

const REGISTERED_USERS = [
    {
        email: "demo@insight.ai",
        password: "Insight123",
    },
];

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

    async function handleLogin() {
        setError("");

        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        setLoading(true);

        // Fake network delay
        await new Promise((resolve) => setTimeout(resolve, 600));

        const foundUser = REGISTERED_USERS.find(
            (u) =>
                u.email.toLowerCase() === email.trim().toLowerCase() &&
                u.password === password
        );

        if (foundUser) {
            onSuccess();
            return;
        }

        setLoading(false);
        setError("Invalid email or password.");
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
                onClick={() =>
                    alert("Google Sign-In will be added with the backend.")
                }
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