"use client";

import { formatFileSize, formatDateTime } from "@/lib/utils";

/**
 * Reusable modal overlay providing a dark blurred backdrop and centered container.
 */
function ModalOverlay({ children, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md" style={{ animation: "card-in 0.2s ease both" }}>
                {children}
            </div>
        </div>
    );
}

/**
 * Renders a single detail row with a label and value.
 */
function DetailRow({ label, value }) {
    return (
        <div className="flex items-start justify-between py-3 border-b border-amber-500/10 last:border-0">
            <span className="text-sm text-(--fg-muted) shrink-0 w-28">{label}</span>
            <span className="text-sm font-medium text-foreground text-right wrap-break-word max-w-[60%]">{value}</span>
        </div>
    );
}

/**
 * Modal for displaying detailed file information.
 */
export default function DetailsModal({ file, onClose }) {
    const ext = (file.fileExtension || "").toLowerCase() || file.fileName?.split(".").pop() || "—";
    const ownerName = file.isShared ? (file.sharedByName || "Unknown user") : "You";
    const uiType = file.uiFileType || "other";
    const size = formatFileSize(file.fileSize);
    const lastEdit = formatDateTime(file.$updatedAt || file.$createdAt);

    return (
        <ModalOverlay onClose={onClose}>
            <div className="bg-[#1a1510] border border-amber-500/20 rounded-2xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-foreground">Details</h2>
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

                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg shrink-0">
                        {uiType === "image" ? "🖼️" : uiType === "media" ? "🎬" : uiType === "document" ? "📄" : "📦"}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{file.fileName}</p>
                        <p className="text-xs text-(--fg-muted) mt-0.5">{size} · {formatDateTime(file.$createdAt)}</p>
                    </div>
                </div>

                <div className="divide-y divide-amber-500/10">
                    <DetailRow label="Format" value={ext.toUpperCase()} />
                    <DetailRow label="Size" value={size} />
                    <DetailRow label="Owner" value={ownerName} />
                    <DetailRow label="Last edit" value={lastEdit} />
                    <DetailRow label="Type" value={uiType.charAt(0).toUpperCase() + uiType.slice(1)} />
                </div>

                <button
                    onClick={onClose}
                    className="mt-5 w-full py-2.5 rounded-xl border border-amber-500/15 text-sm font-medium text-(--fg-dim) hover:bg-white/5 transition-colors"
                >
                    Close
                </button>
            </div>
        </ModalOverlay>
    );
}
