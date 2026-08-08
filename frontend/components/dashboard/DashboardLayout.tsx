"use client";

import { useState } from "react";
import Navbar, { type DashboardTab } from "@/components/layout/Navbar";
import DashboardHome from "@/components/dashboard/DashboardHome";
import CompanyAnalysis from "@/components/dashboard/CompanyAnalysis";
import Portfolio from "@/components/dashboard/Portfolio";
import Watchlist from "@/components/dashboard/Watchlist";
import Screener from "@/components/dashboard/Screener";

interface DashboardLayoutProps {
    isAuthenticated?: boolean;
    onLogin?: () => void;
    onRegister?: () => void;
    onLogout?: () => void;
    onLanding?: () => void;
}

export default function DashboardLayout({
    isAuthenticated = true,
    onLogin = () => {},
    onRegister = () => {},
    onLogout = () => {},
    onLanding = () => {},
}: DashboardLayoutProps) {
    const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");

    const handleDashboard = () => {
        setActiveTab("dashboard");
    };

    const handleTabChange = (tab: DashboardTab) => {
        setActiveTab(tab);
    };

    const renderActiveView = () => {
        switch (activeTab) {
            case "portfolio":
                return <Portfolio />;

            case "watchlist":
                return <Watchlist />;

            case "screener":
                return <Screener />;

            case "company":
                return <CompanyAnalysis />;

            case "dashboard":
            default:
                return (
                    <DashboardHome
                        onLanding={onLanding}
                        onNavigateToTab={(tab) => {
                            if (
                                tab === "dashboard" ||
                                tab === "portfolio" ||
                                tab === "watchlist" ||
                                tab === "screener" ||
                                tab === "company"
                            ) {
                                setActiveTab(tab);
                            }
                        }}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white">
            <Navbar
                isAuthenticated={isAuthenticated}
                currentView="dashboard"
                activeDashboardTab={activeTab}
                onDashboardTabChange={handleTabChange}
                onLogin={onLogin}
                onRegister={onRegister}
                onDashboard={handleDashboard}
                onLogout={onLogout}
                onLanding={onLanding}
                lockVisible
            />

            <main className="min-h-screen pt-24">
                {renderActiveView()}
            </main>
        </div>
    );
}