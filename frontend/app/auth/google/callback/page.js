// frontend/app/auth/google/callback/page.js
"use client";
import { useEffect } from "react";

export default function GoogleCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    if (access && refresh) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/login?error=google";
    }
  }, []);
  return <p>Signing you in…</p>;
}