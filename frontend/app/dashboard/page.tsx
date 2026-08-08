"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function DashboardPage() {
    return (
        <DashboardLayout
            isAuthenticated={true}
            onLogin={() => { }}
            onRegister={() => { }}
            onLogout={() => { }}
            onLanding={() => { }}
        />
    );
}