"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";
import AuthOverlay from "@/components/auth/AuthOverlay";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthStore, persistTokens } from "@/lib/auth";

export default function Home() {
    const {
        isAuthenticated,
        hydrate,
        logout: authLogout,
        fetchMe,
    } = useAuthStore();

    const [currentView, setCurrentView] = useState<"landing" | "dashboard">(
        "landing"
    );
    const [authMode, setAuthMode] = useState<"none" | "login" | "register">(
        "none"
    );
    const [hasVisitedDashboard, setHasVisitedDashboard] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Hydrate auth store from localStorage on mount & handle OAuth callback
    useEffect(() => {
        setIsMounted(true);
        hydrate();

        // Handle OAuth Callback Tokens in URL (?access_token=...&refresh_token=...)
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");

            if (accessToken && refreshToken) {
                persistTokens(accessToken, refreshToken);
                useAuthStore.setState({
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                });
                window.history.replaceState({}, document.title, window.location.pathname);
                setCurrentView("dashboard");
                fetchMe().catch(() => {});
            }
        }

        const storedView = localStorage.getItem("insight_currentView") as "landing" | "dashboard" | null;
        const storedVisited = localStorage.getItem("insight_hasVisitedDashboard");

        if (storedView) {
            setCurrentView(storedView);
            if (storedView === "dashboard") {
                setHasVisitedDashboard(true);
            }
        }
        if (storedVisited === "true") {
            setHasVisitedDashboard(true);
        }
    }, [hydrate]);

    // After hydration, if authenticated, try to fetch user profile
    useEffect(() => {
        if (isMounted && isAuthenticated) {
            fetchMe().catch(() => {
                // If fetchMe fails (expired token), auth store will clear itself
            });
        }
    }, [isMounted, isAuthenticated, fetchMe]);

    useEffect(() => {
        if (!isMounted) return;
        localStorage.setItem("insight_currentView", currentView);
        if (currentView === "dashboard") {
            setHasVisitedDashboard(true);
        }
    }, [currentView, isMounted]);

    useEffect(() => {
        if (!isMounted) return;
        localStorage.setItem("insight_hasVisitedDashboard", hasVisitedDashboard.toString());
    }, [hasVisitedDashboard, isMounted]);

    function handleLoginSuccess() {
        setAuthMode("none");
        setCurrentView("dashboard");
    }

    function handleLogout() {
        authLogout();
        setCurrentView("landing");
        setHasVisitedDashboard(false);
    }

    return (
        <main className="relative min-h-screen bg-[#070b14] font-sans text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300 overflow-x-hidden" suppressHydrationWarning>
            {/* Page-wide grid overlay */}
            <div
                suppressHydrationWarning
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                }}
            />

            <AuthOverlay
                mode={authMode}
                close={() => setAuthMode("none")}
                switchMode={setAuthMode}
                onSuccess={handleLoginSuccess}
            />

            {currentView === "landing" ? (
                <>
                    <Navbar
                        isAuthenticated={isAuthenticated}
                        currentView="landing"
                        activeDashboardTab="dashboard"
                        onDashboardTabChange={() => { }}
                        onLogin={() => setAuthMode("login")}
                        onRegister={() => setAuthMode("register")}
                        onDashboard={() => setCurrentView("dashboard")}
                        onLogout={handleLogout}
                        onLanding={() => setCurrentView("landing")}
                    />

                    <Hero
                        onRegister={() => setAuthMode("register")}
                        onDashboard={() => setCurrentView("dashboard")}
                        isAuthenticated={isAuthenticated}
                        canGoForward={hasVisitedDashboard}
                    />

                    <Features />

                    <HowItWorks
                        onRegister={() => setAuthMode("register")}
                        onDashboard={() => setCurrentView("dashboard")}
                        isAuthenticated={isAuthenticated}
                    />

                    <Pricing
                        onRegister={() => setAuthMode("register")}
                        onDashboard={() => setCurrentView("dashboard")}
                        isAuthenticated={isAuthenticated}
                    />

                    <Faq />

                    <Footer />
                </>
            ) : (
                <DashboardLayout
                    isAuthenticated={isAuthenticated}
                    onLogin={() => setAuthMode("login")}
                    onRegister={() => setAuthMode("register")}
                    onLogout={handleLogout}
                    onLanding={() => setCurrentView("landing")}
                />
            )}
        </main>
    );
}