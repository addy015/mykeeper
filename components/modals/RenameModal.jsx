"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { renameFile } from "@/lib/actions/file.actions";

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
 * Modal component for renaming files.
 */
export default function RenameModal({ file, onClose, onUpdate }) {
    const pathname = usePathname();
    const [name, setName] = useState(file.fileName);
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    /**
     * Executes the rename operation using a server action.
     */
    async function handleSubmit(e) {
        e.preventDefault();
        const trimmed = name.trim();

        if (!trimmed) {
            setError("File name cannot be empty");
            return;
        }

        if (trimmed === file.fileName) {
            onClose();
            return;
        }

        startTransition(async () => {
            try {
                await renameFile({ fileId: file.$id, newName: trimmed, path: pathname });
                onUpdate?.();
                onClose();
            } catch (err) {
                setError(err.message || "Rename failed");
            }
        });
    }

    return (
        <ModalOverlay onClose={onClose}>
            <div className="bg-[#1a1510] border border-amber-500/20 rounded-2xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-foreground">Rename File</h2>
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-(--fg-muted) pl-1">
                            File name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError(""); }}
                            autoFocus
                            placeholder="Enter new name..."
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-amber-500/15 text-sm text-foreground placeholder:text-(--fg-muted) focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                        />
                        {error && <p className="text-xs text-red-400 mt-1.5 pl-1">{error}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-amber-500/15 text-sm font-medium text-(--fg-dim) hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-all disabled:opacity-60 shadow-lg shadow-amber-500/20"
                        >
                            {isPending ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </ModalOverlay>
    );
}
