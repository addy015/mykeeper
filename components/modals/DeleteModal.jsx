"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { deleteFile } from "@/lib/actions/file.actions";

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
 * Modal for confirming file deletion.
 * This action is irreversible and removes the file from both storage and database.
 */
export default function DeleteModal({ file, onClose, onUpdate }) {
    const pathname = usePathname();
    const router = useRouter();
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    /**
     * Executes the deletion process using a server action.
     */
    async function handleDelete() {
        startTransition(async () => {
            try {
                await deleteFile({
                    fileId: file.$id,
                    bucketFileId: file.bucketField,
                    path: pathname,
                });
                onUpdate?.();
                onClose();
                router.refresh();
            } catch (err) {
                setError(err.message || "Delete failed");
            }
        });
    }

    return (
        <ModalOverlay onClose={onClose}>
            <div className="bg-[#1a1510] border border-red-500/20 rounded-2xl shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2 2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Delete File</h2>
                        <p className="text-xs text-(--fg-muted)">This action cannot be undone</p>
                    </div>
                </div>

                <p className="text-sm text-(--fg-dim) mb-5 leading-relaxed">
                    Are you sure you want to delete{" "}
                    <span className="font-bold text-foreground">&ldquo;{file.fileName}&rdquo;</span>?{" "}
                    The file will be permanently removed from all storage.
                </p>

                {error && (
                    <p className="text-xs text-red-400 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl border border-amber-500/15 text-sm font-medium text-(--fg-dim) hover:bg-white/5 transition-colors disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 active:bg-red-600 text-white text-sm font-bold transition-all disabled:opacity-60 shadow-lg shadow-red-500/20"
                    >
                        {isPending ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
