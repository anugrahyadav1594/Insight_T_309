"use client";
import { useEffect } from "react";

const TOKEN_KEY = "insight_access_token";
const REFRESH_KEY = "insight_refresh_token";

export default function GoogleCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("access_token") || params.get("token");
    const refresh = params.get("refresh_token") || access;
    const email = params.get("email");
    const name = params.get("name") || params.get("full_name");

    if (access) {
      localStorage.setItem(TOKEN_KEY, access);
      localStorage.setItem("access_token", access);
      if (refresh) {
        localStorage.setItem(REFRESH_KEY, refresh);
        localStorage.setItem("refresh_token", refresh);
      }
      if (email || name) {
        const userObj = {
          id: "google-user-id",
          email: email || "user@google.com",
          full_name: name || (email ? email.split("@")[0] : "Google User"),
          created_at: new Date().toISOString(),
        };
        localStorage.setItem("insight_user_profile", JSON.stringify(userObj));
      }
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/login?error=google";
    }
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#070b14] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mb-4" />
      <p className="text-sm font-semibold text-slate-300">Completing Google Sign In...</p>
    </div>
  );
}