"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import {
    Menu,
    X,
    Home,
    UserCircle2,
    ChevronDown,
    LayoutDashboard,
    LogOut,
    User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileModal from "@/components/dashboard/ProfileModal";
import FullProfileModal from "@/components/dashboard/FullProfileModal";
import SettingsModal from "@/components/dashboard/SettingsModal";
import SubscriptionModal from "@/components/dashboard/SubscriptionModal";

interface LandingNavItem {
    label: string;
    href: string;
    id: string;
    icon?: React.ElementType;
}

interface DashboardNavItem {
    label: string;
    id: string;
}

const landingNavItems: LandingNavItem[] = [
    { label: "Home", href: "#home", id: "home", icon: Home },
    { label: "Features", href: "#features", id: "features" },
    { label: "How It Works", href: "#how-it-works", id: "how-it-works" },
    { label: "Pricing", href: "#pricing", id: "pricing" },
    { label: "FAQ", href: "#faq", id: "faq" },
];

const dashboardNavItems: DashboardNavItem[] = [
    { label: "Dashboard", id: "dashboard" },
    { label: "Portfolio", id: "portfolio" },
    { label: "Watchlist", id: "watchlist" },
    { label: "Screener", id: "screener" },
    { label: "Company", id: "company" },
];

export type DashboardTab = "dashboard" | "portfolio" | "watchlist" | "screener" | "company";

interface NavbarProps {
    isAuthenticated: boolean;
    currentView: "landing" | "dashboard";
    activeDashboardTab: DashboardTab;
    onDashboardTabChange: (tab: DashboardTab) => void;

    onLogin: () => void;
    onRegister: () => void;

    onDashboard: () => void;
    onLogout: () => void;
    onLanding: () => void; // Required for home button navigation
    lockVisible?: boolean;
}

export default function Navbar({
    isAuthenticated,
    currentView,
    activeDashboardTab,
    onDashboardTabChange,
    onLogin,
    onRegister,
    onDashboard,
    onLogout,
    onLanding,
    lockVisible = false,
}: NavbarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const [activeSection, setActiveSection] = useState("home");
    const [profileOpen, setProfileOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isFullProfileModalOpen, setIsFullProfileModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

    // Build nav items: when in dashboard, prepend a "Home" item that leads to landing
    const dashboardNavItemsWithHome: DashboardNavItem[] = [
        { label: "Home", id: "home" },
        ...dashboardNavItems,
    ];
    const navItems = currentView === "landing" ? landingNavItems : dashboardNavItemsWithHome;

    const hideTimeout = useRef<NodeJS.Timeout | null>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: Event) {
            if (
                profileRef.current &&
                !profileRef.current.contains(e.target as Node)
            ) {
                setProfileOpen(false);
            }
        }
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setProfileOpen(false);
                setIsProfileModalOpen(false);
                setIsFullProfileModalOpen(false);
                setIsSettingsModalOpen(false);
                setIsSubscriptionModalOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 20;
            setScrolled(isScrolled);
            if (!lockVisible) setVisible(!isScrolled);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lockVisible]);

    // Keep navbar visible when lockVisible or auth state / view changes.
    useEffect(() => {
        if (lockVisible || isAuthenticated) {
            setVisible(true);
        }
    }, [lockVisible, isAuthenticated, currentView]);

    // Scroll-spy (only for landing view)
    useEffect(() => {
        if (currentView !== "landing") return;

        const sectionIds = landingNavItems
            .filter((item) => item.id !== "home")
            .map((item) => item.id);

        const handleActiveSection = () => {
            const NAVBAR_OFFSET = 140;

            if (window.scrollY < 80) {
                setActiveSection("home");
                return;
            }

            const scrollPos = window.scrollY + NAVBAR_OFFSET;
            let current = "home";

            for (const id of sectionIds) {
                const el = document.getElementById(id);
                if (el && el.offsetTop <= scrollPos) {
                    current = id;
                }
            }

            setActiveSection(current);
        };

        handleActiveSection();
        window.addEventListener("scroll", handleActiveSection, { passive: true });
        return () => window.removeEventListener("scroll", handleActiveSection);
    }, [currentView]);

    const showNavbar = () => {
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        setVisible(true);
    };

    const hideNavbar = () => {
        if (lockVisible) return;
        if (window.scrollY <= 20) return;
        hideTimeout.current = setTimeout(() => {
            setVisible(false);
        }, 200);
    };

    const handleNavClick = (e: MouseEvent, href: string, id: string) => {
        e.preventDefault();
        setMobileOpen(false);
        setActiveSection(id);

        if (id === "home") {
            if (activeSection !== "home") {
                setVisible(false);
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setVisible(false);
        const targetId = href.replace("#", "");
        const target = document.getElementById(targetId);
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const handleActionClick = () => {
        setMobileOpen(false);
        setVisible(true);
    };

    // Handle home button click from dashboard view
    const handleHomeClick = () => {
        setMobileOpen(false);
        setProfileOpen(false);
        // Reset active section to home so the underline shows on Home
        setActiveSection("home");
        // Navigate to landing page
        onLanding();
        // Scroll to top of the page
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Determine if an item is active
    const isItemActive = (item: LandingNavItem | DashboardNavItem) => {
        if (currentView === "landing") {
            return activeSection === item.id;
        } else {
            // For dashboard view, "home" is never active; others compare to activeDashboardTab
            if (item.id === "home") return false;
            return activeDashboardTab === item.id;
        }
    };

    return (
        <>
            {/* Invisible Hover Zone */}
            <div
                className="fixed left-0 top-0 z-[60] h-10 w-full"
                onMouseEnter={showNavbar}
            />

            {/* Navbar */}
            <motion.header
                initial={false}
                animate={{ y: visible ? 0 : -82 }}
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
                onMouseEnter={showNavbar}
                onMouseLeave={hideNavbar}
                className="fixed left-0 right-0 top-0 z-50 flex justify-center px-5 py-4"
                style={{
                    pointerEvents: visible ? "auto" : "none",
                    willChange: "transform",
                    transform: "translate3d(0,0,0)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                }}
            >
                <nav
                    className={`relative w-full max-w-7xl rounded-3xl
            border border-white/15
            bg-white/[0.08]
            backdrop-blur-3xl backdrop-saturate-150
            shadow-[0_8px_40px_rgba(0,0,0,0.35)]
            transition-colors duration-300
            ${scrolled ? "border-white/20 bg-white/[0.10]" : ""}`}
                >
                    {/* Liquid Glass shine layer */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
                        <div className="absolute left-1/2 -top-28 h-56 w-[28rem] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.15)_0%,transparent_70%)]" />
                        <div className="absolute -left-24 top-0 h-full w-52 rotate-12 bg-gradient-to-r from-white/12 via-white/6 to-transparent blur-2xl" />
                        <div className="absolute -right-24 top-0 h-full w-52 -rotate-12 bg-gradient-to-l from-white/10 via-white/5 to-transparent blur-2xl" />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                    </div>

                    <div className="relative flex h-16 items-center justify-between px-8">
                        {/* Logo */}
                        <Link
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            className="flex items-center gap-2.5 font-semibold text-white"
                        >
                            <img
                                src="/Logo.svg"
                                alt="Insight Shield Logo"
                                className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.45)] transition-all duration-300 hover:drop-shadow-[0_0_18px_rgba(34,211,238,0.7)]"
                            />
                            <img
                                src="/Text.svg"
                                alt="Insight Text"
                                className="h-7 w-auto object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all duration-300 hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                            />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden items-center gap-6 lg:flex">
                            {navItems.map((item) => {
                                const isActive = isItemActive(item);

                                // Handle "Home" in dashboard view specially
                                if (currentView === "dashboard" && item.id === "home") {
                                    return (
                                        <button
                                            key="home"
                                            onClick={handleHomeClick}
                                            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-white/5 hover:text-white"
                                        >
                                            <Home className="h-4 w-4" />
                                            <span>Home</span>
                                        </button>
                                    );
                                }

                                if (currentView === "landing") {
                                    const landingItem = item as LandingNavItem;
                                    const Icon = landingItem.icon;

                                    return (
                                        <Link
                                            key={landingItem.label}
                                            href={landingItem.href}
                                            onClick={(e) => handleNavClick(e, landingItem.href, landingItem.id)}
                                            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive
                                                    ? "bg-white/[0.06] text-white"
                                                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            {Icon && <Icon className="h-4 w-4" />}
                                            <span>{landingItem.label}</span>

                                            {isActive && (
                                                <motion.span
                                                    layoutId="nav-underline"
                                                    className="absolute bottom-1.5 left-3.5 right-3.5 h-[2px] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                                />
                                            )}
                                        </Link>
                                    );
                                }

                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            onDashboardTabChange(item.id as DashboardTab);
                                            if (item.id === "dashboard") {
                                                onDashboard();
                                            }
                                        }}
                                        className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive
                                                ? "bg-white/[0.06] text-white"
                                                : "text-slate-300 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <span>{item.label}</span>

                                        {isActive && (
                                            <motion.span
                                                layoutId="nav-underline"
                                                className="absolute bottom-1.5 left-3.5 right-3.5 h-[2px] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Desktop Right Side */}
                        <div className="hidden items-center gap-4 lg:flex">
                            <AnimatePresence mode="wait" initial={false}>
                                {!isAuthenticated ? (
                                    <motion.div
                                        key="unauthenticated-buttons"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                        className="flex items-center gap-4"
                                    >
                                        <button
                                            onClick={() => {
                                                handleActionClick();
                                                onLogin();
                                            }}
                                            className="rounded-xl border border-white/10 px-5 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                                        >
                                            Sign In
                                        </button>

                                        <button
                                            onClick={() => {
                                                handleActionClick();
                                                onRegister();
                                            }}
                                            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition-transform duration-300 hover:scale-105"
                                        >
                                            Get Started
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        ref={profileRef}
                                        key="authenticated-avatar"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                        className="relative z-50"
                                    >
                                        <button
                                            onClick={() => setProfileOpen((prev) => !prev)}
                                            className="
                        flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-white/10
                        bg-white/5
                        px-3
                        py-2
                        text-white
                        transition-all
                        hover:bg-white/10
                      "
                                        >
                                            <UserCircle2 size={24} />

                                            <ChevronDown
                                                size={16}
                                                className={`transition-transform ${profileOpen ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </button>

                                        <AnimatePresence>
                                            {profileOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                    transition={{ duration: 0.18 }}
                                                    className="
                            absolute
                            right-0
                            top-full
                            mt-3
                            z-50
                            w-60
                            overflow-hidden
                            rounded-2xl
                            border
                            border-white/10
                            bg-[#0b1120]/95
                            backdrop-blur-2xl
                            shadow-2xl
                          "
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setProfileOpen(false);
                                                            setIsProfileModalOpen(true);
                                                        }}
                                                        className="
                              flex
                              w-full
                              items-center
                              gap-3
                              px-5
                              py-4
                              text-left
                              text-slate-300
                              transition
                              hover:bg-white/5
                              hover:text-white
                            "
                                                    >
                                                        <User size={18} />
                                                        Profile
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setProfileOpen(false);
                                                            onDashboard();
                                                        }}
                                                        className="
                              flex
                              w-full
                              items-center
                              gap-3
                              px-5
                              py-4
                              text-left
                              text-slate-300
                              transition
                              hover:bg-white/5
                              hover:text-white
                            "
                                                    >
                                                        <LayoutDashboard size={18} />
                                                        Dashboard
                                                    </button>

                                                    <div className="mx-4 border-t border-white/10" />

                                                    <button
                                                        onClick={() => {
                                                            setProfileOpen(false);
                                                            onLogout();
                                                        }}
                                                        className="
                              flex
                              w-full
                              items-center
                              gap-3
                              px-5
                              py-4
                              text-left
                              text-red-400
                              transition
                              hover:bg-red-500/10
                            "
                                                    >
                                                        <LogOut size={18} />
                                                        Logout
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Mobile Button */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white lg:hidden"
                        >
                            {mobileOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </nav>
            </motion.header>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -25 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -25 }}
                        transition={{ duration: 0.25 }}
                        className="fixed left-5 right-5 top-24 z-40 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-3xl lg:hidden"
                    >
                        <div className="flex flex-col gap-5">
                            {navItems.map((item) => {
                                const isActive = isItemActive(item);

                                if (currentView === "dashboard" && item.id === "home") {
                                    return (
                                        <button
                                            key="home"
                                            onClick={handleHomeClick}
                                            className="relative flex w-full items-center gap-2 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors duration-300"
                                        >
                                            <Home className="h-4 w-4" />
                                            Home
                                        </button>
                                    );
                                }

                                if (currentView === "landing") {
                                    const landingItem = item as LandingNavItem;
                                    const Icon = landingItem.icon;

                                    return (
                                        <Link
                                            key={landingItem.label}
                                            href={landingItem.href}
                                            onClick={(e) => handleNavClick(e, landingItem.href, landingItem.id)}
                                            className={`relative flex w-full items-center gap-2 px-4 py-2.5 rounded-xl transition-colors duration-300 ${isActive
                                                    ? "bg-white/[0.08] text-white"
                                                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            {isActive && (
                                                <motion.span
                                                    layoutId="nav-underline-mobile"
                                                    className="absolute left-1.5 top-2.5 bottom-2.5 w-[3px] rounded-full bg-gradient-to-b from-cyan-400 to-blue-500"
                                                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                                />
                                            )}
                                            {Icon && <Icon className="h-4 w-4" />}
                                            <span className="pl-1">{landingItem.label}</span>
                                        </Link>
                                    );
                                }

                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            setMobileOpen(false);
                                            onDashboardTabChange(item.id as DashboardTab);
                                            if (item.id === "dashboard") {
                                                onDashboard();
                                            }
                                        }}
                                        className={`relative flex w-full items-center gap-2 px-4 py-2.5 rounded-xl text-left transition-colors duration-300 ${isActive
                                                ? "bg-white/[0.08] text-white"
                                                : "text-slate-300 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.span
                                                layoutId="nav-underline-mobile"
                                                className="absolute left-1.5 top-2.5 bottom-2.5 w-[3px] rounded-full bg-gradient-to-b from-cyan-400 to-blue-500"
                                                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                            />
                                        )}
                                        <span className="pl-1">{item.label}</span>
                                    </button>
                                );
                            })}

                            <div className="mt-4 flex flex-col gap-3">
                                <button
                                    onClick={onLogin}
                                    className="rounded-xl border border-white/10 py-3 text-slate-300"
                                >
                                    Sign In
                                </button>

                                <button
                                    onClick={onRegister}
                                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-semibold text-white"
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* All Modals */}
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onOpenProfile={() => setIsFullProfileModalOpen(true)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
            />
            <FullProfileModal
                isOpen={isFullProfileModalOpen}
                onClose={() => setIsFullProfileModalOpen(false)}
            />
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
            <SubscriptionModal
                isOpen={isSubscriptionModalOpen}
                onClose={() => setIsSubscriptionModalOpen(false)}
            />
        </>
    );
}