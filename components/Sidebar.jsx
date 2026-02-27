"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatFileSize } from "@/lib/utils";

// ── Navigation Configuration ──────────────────────────────────────────────────
// Defines the primary navigation structure and associated iconography.
const NAV_ITEMS = [
    {
        label: "Dashboard",
        href: "/",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
        ),
    },
    {
        label: "Documents",
        href: "/documents",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
    },
    {
        label: "Images",
        href: "/images",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
        ),
    },
    {
        label: "Media",
        href: "/media",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
        ),
    },
    {
        label: "Others",
        href: "/others",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        ),
    },
];

/**
 * Visual branding for the application.
 */
function BrandIcon() {
    return (
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/30 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
        </div>
    );
}

/**
 * Helper to determine if a route is currently active.
 */
function isActiveRoute(pathname, href) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
}

/**
 * Renders the vertical list of navigation links.
 */
function NavLinks({ pathname, onNavigate }) {
    return (
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={`
                            relative flex items-center gap-3 p-2 rounded-xl text-sm font-medium
                            transition-all duration-150 group
                            ${active
                                ? "bg-amber-500 text-black shadow-md shadow-amber-500/25"
                                : "text-(--fg-dim) hover:bg-amber-500/10 hover:text-foreground"
                            }
                        `}
                    >
                        <span className={`shrink-0 transition-transform duration-150 ${active ? "" : "group-hover:scale-110"}`}>
                            {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                        {active && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black/40 shrink-0" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

/**
 * User identity display in the sidebar footer.
 */
function UserProfile({ user }) {
    const avatar = user?.avatar;
    const initials = (user?.fullName || "U")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="px-2 py-2 border-t border-amber-500/10">
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/4 transition-colors">
                {avatar ? (
                    <img src={avatar} alt={user?.fullName} className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-500/30 shrink-0" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold ring-2 ring-amber-500/20 shrink-0">
                        {initials}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate leading-tight">{user?.fullName || "User"}</p>
                    <p className="text-xs text-(--fg-muted) truncate mt-0.5">{user?.email || ""}</p>
                </div>
            </div>
        </div>
    );
}

/**
 * Wrapper for sidebar content parts to ensure consistent layout across desktop/mobile.
 */
function SidebarContent({ user, pathname, onNavigate }) {
    return (
        <div className="flex flex-col h-full">
            <NavLinks pathname={pathname} onNavigate={onNavigate} />
            <UserProfile user={user} />
        </div>
    );
}

/**
 * Dual-state Sidebar component.
 * Acts as a fixed side panel on desktop and a slide-out drawer on mobile.
 */
export default function Sidebar({ user, usedBytes = 0 }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const totalBytes = 2 * 1024 * 1024 * 1024;
    const usedPct = Math.min((usedBytes / totalBytes) * 100, 100);

    const closeMenu = () => setMobileOpen(false);

    return (
        <>
            {/* Desktop Side Panel */}
            <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-(--bg-left) border-r border-amber-500/10">
                <div className="flex items-center gap-3 border-b border-amber-500/10 shrink-0 p-1.5 ">
                    <BrandIcon />
                    <div>
                        <span className="text-base font-bold tracking-tight text-foreground">MyKeeper</span>
                        <p className="text-[10px] text-(--fg-muted) leading-none mt-0.5 font-medium tracking-wide uppercase">Cloud Storage</p>
                    </div>
                </div>
                <SidebarContent
                    user={user}
                    usedBytes={usedBytes}
                    usedPct={usedPct}
                    pathname={pathname}
                    onNavigate={closeMenu}
                />
            </aside>

            {/* Mobile Navigation Trigger */}
            {!mobileOpen && (
                <button
                    className="lg:hidden fixed top-2.5 left-3 z-50 flex items-center justify-center w-9 h-9 rounded-xl bg-(--bg-card) border border-amber-500/20 text-(--fg-dim) hover:text-amber-400 hover:border-amber-500/40 transition-all shadow-lg"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open menu"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            )}

            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={closeMenu}
                />
            )}

            {/* Mobile Slide-out Drawer */}
            <aside
                className={`
                    lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72
                    bg-(--bg-left) border-r border-amber-500/10
                    flex flex-col
                    transition-transform duration-300 ease-out
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                <div className="flex items-center justify-between px-5 py-5 border-b border-amber-500/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <BrandIcon />
                        <div>
                            <span className="text-base font-bold tracking-tight text-foreground">MyKeeper</span>
                            <p className="text-[10px] text-(--fg-muted) leading-none mt-0.5 font-medium tracking-wide uppercase">Cloud Storage</p>
                        </div>
                    </div>
                    <button
                        onClick={closeMenu}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-(--fg-muted) hover:text-foreground hover:bg-white/8 transition-all"
                        aria-label="Close menu"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <SidebarContent
                    user={user}
                    usedBytes={usedBytes}
                    usedPct={usedPct}
                    pathname={pathname}
                    onNavigate={closeMenu}
                />
            </aside>
        </>
    );
}
