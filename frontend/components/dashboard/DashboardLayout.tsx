"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../layout/Navbar";
import DashboardHome from "./DashboardHome";
import Portfolio from "./Portfolio";
import Watchlist from "./Watchlist";
import CompanyAnalysis from "./CompanyAnalysis";
import Screener from "./Screener";
import type { DashboardTab } from "../layout/Navbar";

interface DashboardLayoutProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  onLanding: () => void; // ✅ REQUIRED
}

export default function DashboardLayout({
  isAuthenticated,
  onLogin,
  onRegister,
  onLogout,
  onLanding,
}: DashboardLayoutProps) {
  const [activeView, setActiveView] = useState<DashboardTab>("dashboard");
  const [selectedCompany, setSelectedCompany] = useState<string>("TCS");

  const handleViewStock = (symbol: string) => {
    setSelectedCompany(symbol);
    setActiveView("company");
  };

  const renderContent = () => {
    switch (activeView) {
      case "portfolio":
        return (
          <Portfolio
            onBack={() => setActiveView("dashboard")}
            onViewStock={handleViewStock}
          />
        );
      case "watchlist":
        return (
          <Watchlist
            onBack={() => setActiveView("dashboard")}
            onViewStock={handleViewStock}
          />
        );
      case "company":
        return (
          <CompanyAnalysis
            selectedSymbol={selectedCompany}
            onBack={() => setActiveView("dashboard")}
          />
        );
      case "screener":
        return (
          <Screener
            onBack={() => setActiveView("dashboard")}
            onViewStock={handleViewStock}
          />
        );
      case "dashboard":
      default:
        return (
          <DashboardHome
            onLanding={onLanding}
            onNavigateToTab={(tab) => setActiveView(tab as DashboardTab)}
          />
        );
    }
  };

  return (
    <>
      <Navbar
        isAuthenticated={isAuthenticated}
        currentView="dashboard"
        activeDashboardTab={activeView}
        onDashboardTabChange={setActiveView}
        onLogin={onLogin}
        onRegister={onRegister}
        onDashboard={() => setActiveView("dashboard")}
        onLogout={onLogout}
        onLanding={onLanding} // ✅ PASS IT HERE
      />
      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}