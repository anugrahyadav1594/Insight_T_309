"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const footerLinks = {
    Product: [
        { name: "Features", href: "#features" },
        { name: "How It Works", href: "#how-it-works" },
        { name: "Pricing", href: "#pricing" },
        { name: "FAQ", href: "#faq" },
    ],
    Company: [
        { name: "About", href: "/company" },
        { name: "Blog", href: "#" },
        { name: "Contact", href: "#" },
    ],
    Legal: [
        { name: "Privacy Policy", href: "#" },
        { name: "Terms of Service", href: "#" },
        { name: "Cookie Policy", href: "#" },
    ],
};

const socials = [
    {
        name: "GitHub",
        href: "https://github.com",
    },
    {
        name: "LinkedIn",
        href: "https://linkedin.com",
    },
    {
        name: "Email",
        href: "mailto:hello@insight.ai",
    },
];

export default function Footer() {
    return (
        <footer className="relative border-t border-white/10">
            {/* Gradient Line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-70" />

            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-12">
                    {/* Brand */}
                    <motion.div
                        className="lg:col-span-5"
                        initial={{ opacity: 0, y: 25 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-lg font-bold text-white">
                                I
                            </div>

                            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
                                Insight
                            </span>
                        </Link>

                        <p className="mt-5 max-w-md text-sm leading-7 text-gray-400">
                            AI-powered investment intelligence for smarter investing.
                            Understand markets, analyze companies, and make informed
                            investment decisions with explainable AI.
                        </p>

                        {/* Social Links */}
                        <div className="mt-8 flex flex-wrap gap-3">
                            {socials.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition-all duration-300 hover:border-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-400"
                                >
                                    {social.name}
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Links */}
                    <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
                        {Object.entries(footerLinks).map(([title, links], index) => (
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: 25 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    duration: 0.4,
                                    delay: index * 0.1,
                                }}
                            >
                                <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
                                    {title}
                                </h3>

                                <ul className="space-y-4">
                                    {links.map((link) => (
                                        <li key={link.name}>
                                            <Link
                                                href={link.href}
                                                className="group inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-cyan-400"
                                            >
                                                {link.name}

                                                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-gray-500 md:flex-row">
                    <p>© {new Date().getFullYear()} Insight. All rights reserved.</p>


                </div>
            </div>
        </footer>
    );
}