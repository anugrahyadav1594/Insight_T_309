"use client";

import GoogleButton from "./GoogleButton";

interface Props {
    switchToLogin: () => void;
    onSuccess: () => void;
}

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:9056";

export default function RegisterForm({ switchToLogin, onSuccess }: Props) {
    const handleGoogleSignUp = () => {
        // Redirect to backend Google OAuth authorize endpoint
        window.location.href = `${API_BASE}/api/v1/auth/google/authorize`;
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold text-white">
                    Create Account
                </h2>
                <p className="text-gray-400 text-sm">
                    Start investing smarter with Insight.
                </p>
            </div>

            <div className="space-y-4">
                <GoogleButton onClick={handleGoogleSignUp} label="Sign up with Google" />
            </div>

            <p className="text-center text-xs text-slate-500 leading-relaxed px-4">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>

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
        </div>
    );
}