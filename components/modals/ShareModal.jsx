"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { updateFileAccess } from "@/lib/actions/file.actions";

/**
 * Reusable modal overlay providing a dark blurred backdrop and centered container.
 */
function ModalOverlay({ children, onClose }) {
    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md" style={{ animation: "card-in 0.2s ease both" }}>
                {children}
            </div>
        </div>
    );
}

/**
 * Renders a simple avatar for shared users based on their email.
 */
function UserAvatar({ email }) {
    return (
        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
            {email[0].toUpperCase()}
        </div>
    );
}

/**
 * Modal for sharing files with other users by email.
 */
export default function ShareModal({ file, onClose, onUpdate }) {
    const pathname = usePathname();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();
    const sharedUsers = file.users || [];

    /**
     * Validates email format.
     */
    function validateEmail(val) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }

    /**
     * Updates file access permissions.
     */
    async function handleShare(e) {
        e.preventDefault();
        const trimmed = email.trim().toLowerCase();

        if (!trimmed) {
            setError("Please enter an email address.");
            return;
        }
        if (!validateEmail(trimmed)) {
            setError("Enter a valid email address.");
            return;
        }
        if (sharedUsers.includes(trimmed)) {
            setError("Already shared with this user.");
            return;
        }

        startTransition(async () => {
            try {
                await updateFileAccess({ fileId: file.$id, emails: [trimmed], path: pathname });
                onUpdate?.();
                setEmail("");
                setError("");
                onClose();
            } catch (err) {
                setError(err.message || "Share failed");
            }
        });
    }

    return (
        <ModalOverlay onClose={onClose}>
            <div className="bg-[#1a1510] border border-amber-500/20 rounded-2xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-foreground">Share File</h2>
                    <button
                        onClick={onClose}
                        className="text-(--fg-muted) hover:text-foreground transition-colors"
                        aria-label="Close modal"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <p className="text-xs text-(--fg-muted) mb-4 truncate">
                    Sharing: <span className="text-amber-400 font-medium">{file.fileName}</span>
                </p>

                <form onSubmit={handleShare} className="flex gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="Enter email address..."
                        autoFocus
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-amber-500/15 text-sm text-foreground placeholder:text-(--fg-muted) focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-all disabled:opacity-60 shrink-0 shadow-lg shadow-amber-500/20"
                    >
                        {isPending ? "..." : "Share"}
                    </button>
                </form>
                {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

                {sharedUsers.length > 0 && (
                    <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-(--fg-muted) mb-3">
                            Shared with
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {sharedUsers.map((u) => (
                                <div key={u} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/4 border border-white/6">
                                    <UserAvatar email={u} />
                                    <span className="text-sm text-foreground truncate">{u}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {sharedUsers.length === 0 && (
                    <p className="mt-4 text-xs text-(--fg-muted) text-center">
                        Not shared with anyone yet.
                    </p>
                )}
            </div>
        </ModalOverlay>
    );
}
