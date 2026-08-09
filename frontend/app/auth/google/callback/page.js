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
    const picture = params.get("picture") || params.get("avatar");

    if (access) {
      localStorage.setItem(TOKEN_KEY, access);
      localStorage.setItem("access_token", access);
      if (refresh) {
        localStorage.setItem(REFRESH_KEY, refresh);
        localStorage.setItem("refresh_token", refresh);
      }

      const userObj = {
        id: params.get("user_id") || email || "google-user",
        email: email || "user@google.com",
        full_name: name || (email ? email.split("@")[0] : "Google User"),
        picture: picture || null,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem("insight_user_profile", JSON.stringify(userObj));

      // Navigate to main page which will hydrate and show dashboard
      window.location.href = "/";
    } else {
      window.location.href = "/?error=google";
    }
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#070b14] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mb-4" />
      <p className="text-sm font-semibold text-slate-300">Completing Google Sign In...</p>
    </div>
  );
}