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

export default function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentView, setCurrentView] = useState<"landing" | "dashboard">(
        "landing"
    );
    const [authMode, setAuthMode] = useState<"none" | "login" | "register">(
        "none"
    );
    const [hasVisitedDashboard, setHasVisitedDashboard] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const storedAuth = localStorage.getItem("insight_isAuthenticated");
        const storedView = localStorage.getItem("insight_currentView") as "landing" | "dashboard" | null;
        const storedVisited = localStorage.getItem("insight_hasVisitedDashboard");

        if (storedAuth === "true") {
            setIsAuthenticated(true);
        }
        if (storedView) {
            setCurrentView(storedView);
            if (storedView === "dashboard") {
                setHasVisitedDashboard(true);
            }
        }
        if (storedVisited === "true") {
            setHasVisitedDashboard(true);
        }
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        localStorage.setItem("insight_isAuthenticated", isAuthenticated.toString());
    }, [isAuthenticated, isMounted]);

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
        setIsAuthenticated(true);
        setAuthMode("none");
        setCurrentView("dashboard");
    }

    return (
        <main className="relative bg-[#050816] overflow-x-hidden min-h-screen">
            {/* Page-wide grid overlay */}
            <div
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
                        onLogout={() => {
                            setIsAuthenticated(false);
                            setCurrentView("landing");
                            setHasVisitedDashboard(false);
                        }}
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
                    onLogout={() => {
                        setIsAuthenticated(false);
                        setCurrentView("landing");
                        setHasVisitedDashboard(false);
                    }}
                    onLanding={() => setCurrentView("landing")} // ✅ PASS HERE
                />
            )}
        </main>
    );
}