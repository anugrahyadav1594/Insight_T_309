"use client";

import GoogleButton from "./GoogleButton";

interface Props {
    switchToRegister: () => void;
    onSuccess: () => void;
}

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:9056";

export default function LoginForm({ switchToRegister, onSuccess }: Props) {
    const handleGoogleSignIn = () => {
        // Redirect to backend Google OAuth authorize endpoint
        window.location.href = `${API_BASE}/api/v1/auth/google/authorize`;
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold text-white">
                    Welcome Back
                </h2>
                <p className="text-gray-400">
                    Sign in to continue using Insight.
                </p>
            </div>

            <div className="space-y-4">
                <GoogleButton onClick={handleGoogleSignIn} label="Sign in with Google" />
            </div>

            <div className="text-center text-sm">
                <p className="text-gray-400">
                    Don&apos;t have an account?{" "}
                    <button
                        type="button"
                        onClick={switchToRegister}
                        className="font-semibold text-cyan-400 hover:underline"
                    >
                        Register
                    </button>
                </p>
            </div>
        </div>
    );
}