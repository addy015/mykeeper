"use client";

import { useState, useRef, useEffect } from "react";
import { formatFileSize, formatDateTime, getFileType, constructDownloadUrl, constructFileUrl } from "@/lib/utils";
import RenameModal from "./modals/RenameModal";
import DetailsModal from "./modals/DetailsModal";
import ShareModal from "./modals/ShareModal";
import DeleteModal from "./modals/DeleteModal";

// ── File Type Branding ────────────────────────────────────────────────────────
// Configures visual styles and iconography for specific file categories.
const TYPE_CONFIG = {
    document: {
        bg: "bg-rose-500/15",
        color: "#f87171",
        badge: "bg-rose-500/15 text-rose-400",
        icon: ( 
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
    },
    image: {
        bg: "bg-blue-500/15",
        color: "#60a5fa",
        badge: "bg-blue-500/15 text-blue-400",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
        ),
    },
    media: {
        bg: "bg-green-500/15",
        color: "#4ade80",
        badge: "bg-green-500/15 text-green-400",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
        ),
    },
    other: {
        bg: "bg-purple-500/15",
        color: "#c084fc",
        badge: "bg-purple-500/15 text-purple-400",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
        ),
    },
};

/**
 * Renders a stylized icon based on the file type.
 */
function FileTypeIcon({ type }) {
    const c = TYPE_CONFIG[type] || TYPE_CONFIG.other;
    return (
        <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${c.bg} transition-transform duration-200 group-hover:scale-105`}
            style={{ color: c.color }}
        >
            {c.icon}
        </div>
    );
}

/**
 * Vertical ellipsis trigger for action menus.
 */
function ThreeDots({ onClick }) {
    return (
        <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(e); }}
            className="p-1.5 rounded-lg text-(--fg-muted) hover:text-foreground hover:bg-white/10 transition-all opacity-100"
            aria-label="File actions"
        >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
            </svg>
        </button>
    );
}

/**
 * Main card component for individual files.
 */
export default function FileCard({ file, onUpdate }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [modal, setModal] = useState(null);
    const menuRef = useRef(null);
    const type = file.uiFileType || file.fileType || getFileType(file.fileExtension);
    const isOwner = !file.isShared;
    const previewUrl = file.fileUrl || (file.bucketField ? constructFileUrl(file.bucketField) : "");
    const c = TYPE_CONFIG[type] || TYPE_CONFIG.other;

    // Close the action menu when clicking outside the component
    useEffect(() => {
        function handler(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        }
        if (menuOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    /**
     * Triggers a browser download for the file.
     */
    function handleDownload() {
        const url = constructDownloadUrl(file.bucketField);
        const a = document.createElement("a");
        a.href = url; a.download = file.fileName; a.target = "_blank";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setMenuOpen(false);
    }

    /**
     * Opens the file in a new browser tab for preview.
     */
    function handlePreview() {
        if (!previewUrl) return;
        window.open(previewUrl, "_blank", "noopener,noreferrer");
    }

    // Contextual menu actions based on user permissions
    const menuActions = [
        ...(isOwner ? [{ label: "Rename", icon: "✏️", onClick: () => { setModal("rename"); setMenuOpen(false); } }] : []),
        { label: "Details", icon: "ℹ️", onClick: () => { setModal("details"); setMenuOpen(false); } },
        { label: "Share", icon: "🔗", onClick: () => { setModal("share"); setMenuOpen(false); } },
        { label: "Download", icon: "⬇️", onClick: handleDownload },
        ...(isOwner ? [{ label: "Delete", icon: "🗑️", onClick: () => { setModal("delete"); setMenuOpen(false); }, danger: true }] : []),
    ];

    return (
        <>
            <div className={`group relative flex flex-col bg-(--bg-card) border border-amber-500/10 rounded-2xl p-3.5 hover:border-amber-500/30 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-200 cursor-default ${menuOpen ? 'z-50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${c.badge}`}>
                        {(file.fileExtension || type).replace(".", "")}
                    </span>
                    <div className="relative" ref={menuRef}>
                        <ThreeDots onClick={() => setMenuOpen((o) => !o)} />
                        {menuOpen && (
                            <div
                                className="absolute right-0 top-8 z-50 w-44 bg-[#1c1710] border border-amber-500/20 rounded-xl shadow-2xl overflow-hidden"
                                style={{ animation: "card-in 0.15s ease both" }}
                            >
                                {menuActions.map((action) => (
                                    <button
                                        key={action.label}
                                        onClick={action.onClick}
                                        className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm transition-colors ${action.danger
                                            ? "text-red-400 hover:bg-red-500/10"
                                            : "text-(--fg-dim) hover:bg-amber-500/10 hover:text-foreground"
                                            }`}
                                    >
                                        <span>{action.icon}</span>{action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handlePreview}
                    className="w-fit rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 mb-3"
                    title="Preview file"
                    aria-label={`Preview ${file.fileName}`}
                >
                    <FileTypeIcon type={type} />
                </button>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate leading-snug">{file.fileName}</p>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                        <p className="text-xs text-(--fg-muted) truncate">{formatDateTime(file.$createdAt)}</p>
                        <span className="text-xs font-medium text-(--fg-muted) bg-white/5 px-1.5 py-0.5 rounded-md shrink-0">
                            {formatFileSize(file.fileSize)}
                        </span>
                    </div>
                    {file.isShared && (
                        <p className="text-xs text-amber-500/60 truncate mt-1">
                            By {file.sharedByName || "Unknown"}
                        </p>
                    )}
                </div>
            </div>

            {/* Modal Components */}
            {modal === "rename" && <RenameModal file={file} onClose={() => setModal(null)} onUpdate={onUpdate} />}
            {modal === "details" && <DetailsModal file={file} onClose={() => setModal(null)} />}
            {modal === "share" && <ShareModal file={file} onClose={() => setModal(null)} onUpdate={onUpdate} />}
            {modal === "delete" && <DeleteModal file={file} onClose={() => setModal(null)} onUpdate={onUpdate} />}
        </>
    );
}
