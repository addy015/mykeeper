"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { uploadFile, searchFiles } from "@/lib/actions/file.actions";
import { logoutUser } from "@/lib/actions/user.actions";
import { account } from "@/lib/appwrite";
import { formatFileSize } from "@/lib/utils";

/**
 * Renders a toast notification for displaying feedback to the user.
 */
function Toast({ msg, type }) {
    if (!msg) return null;
    const colors = type === "error"
        ? "bg-red-500/15 border-red-500/30 text-red-300"
        : "bg-amber-500/15 border-amber-500/30 text-amber-300";
    return (
        <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-100 px-5 py-3 rounded-xl border text-sm font-medium backdrop-blur-md shadow-2xl flex items-center gap-2 ${colors}`}
            style={{ animation: "card-in 0.3s ease both" }}
        >
            {type === "error" ? "⚠️" : "✅"} {msg}
        </div>
    );
}

function SearchIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function UploadIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

const FILE_TYPE_ICONS = {
    document: { emoji: "📄", bg: "bg-rose-500/15", text: "text-rose-400" },
    image: { emoji: "🖼️", bg: "bg-blue-500/15", text: "text-blue-400" },
    video: { emoji: "🎬", bg: "bg-green-500/15", text: "text-green-400" },
    audio: { emoji: "🎵", bg: "bg-emerald-500/15", text: "text-emerald-400" },
    other: { emoji: "📦", bg: "bg-purple-500/15", text: "text-purple-400" },
};

function SpinnerSmall() {
    return (
        <span className="w-4 h-4 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin inline-block" />
    );
}

/**
 * Main navigation and search bar component.
 */
export default function Topbar({ user }) {
    const router = useRouter();
    const pathname = usePathname();
    const fileInputRef = useRef(null);
    const searchContainerRef = useRef(null);
    const debounceRef = useRef(null);

    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searching, setSearching] = useState(false);
    const [toast, setToast] = useState({ msg: "", type: "success" });
    const [uploading, setUploading] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    /**
     * Displays a temporary notification toast.
     */
    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
    }

    /**
     * Executes the file search using a server action.
     */
    const performSearch = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            setSearching(false);
            return;
        }
        setSearching(true);
        try {
            const results = await searchFiles({
                query,
                accountId: user.accountId,
                viewerEmail: user.email,
            });
            setSearchResults(results || []);
            setShowDropdown((results || []).length > 0);
        } catch {
            setSearchResults([]);
            setShowDropdown(false);
        } finally {
            setSearching(false);
        }
    }, [user.accountId, user.email]);

    /**
     * Handles search input changes with debouncing.
     */
    function handleSearchChange(e) {
        const value = e.target.value;
        setSearch(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!value.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            setSearching(false);
            return;
        }

        setSearching(true);
        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    }

    /**
     * Closes the search dropdown when clicking outside.
     */
    useEffect(() => {
        function handleClickOutside(e) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /**
     * Closes the search dropdown when pressing the Escape key.
     */
    useEffect(() => {
        function handleEscape(e) {
            if (e.key === "Escape") setShowDropdown(false);
        }
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    /**
     * Navigates to a file's URL in a new tab.
     */
    function handleFileClick(file) {
        window.open(file.fileUrl, "_blank", "noopener,noreferrer");
        setShowDropdown(false);
        setSearch("");
        setSearchResults([]);
    }

    /**
     * Handles file selection and triggers the upload server action.
     */
    async function handleFileChange(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setUploading(true);
        try {
            for (const file of files) {
                await uploadFile({
                    file,
                    accountId: user.accountId,
                    uploadedBy: Number.isSafeInteger(user?.$sequence) ? user.$sequence : undefined,
                    path: pathname,
                });
            }
            showToast(`${files.length > 1 ? files.length + " files" : "File"} uploaded successfully!`);
            router.refresh();
        } catch (err) {
            showToast(err.message || "Upload failed", "error");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    /**
     * Initiates the user logout process.
     */
    async function handleLogout() {
        setLoggingOut(true);
        try {
            await account.deleteSession("current");
        } catch {
            // Session may already be invalid
        }
        await logoutUser();
    }

    return (
        <>
            <Toast msg={toast.msg} type={toast.type} />

            <header className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-14 bg-background/90 backdrop-blur-md border-b border-amber-500/10">

                {/* Search Bar Container */}
                <div ref={searchContainerRef} className="relative flex-1 min-w-0 ml-[60px] lg:ml-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--fg-muted) pointer-events-none flex z-10">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearchChange}
                        onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                        placeholder="Search files…"
                        className="w-full pl-10 pr-10 py-2 rounded-xl bg-white/5 border border-amber-500/15 text-sm text-foreground placeholder:text-(--fg-muted) focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                    />
                    {search && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center z-10">
                            {searching ? (
                                <SpinnerSmall />
                            ) : (
                                <button
                                    onClick={() => { setSearch(""); setSearchResults([]); setShowDropdown(false); }}
                                    className="text-(--fg-muted) hover:text-amber-400 transition-colors"
                                    aria-label="Clear search"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </span>
                    )}

                    {/* Search Results Dropdown */}
                    {showDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-(--bg-card)/95 backdrop-blur-xl border border-amber-500/15 shadow-2xl shadow-black/40 overflow-hidden z-50"
                            style={{ animation: "card-in 0.2s ease both" }}
                        >
                            <div className="px-3 py-2 border-b border-amber-500/10">
                                <p className="text-xs font-semibold text-(--fg-muted) uppercase tracking-wider">
                                    {searchResults.length} file{searchResults.length !== 1 ? "s" : ""} found
                                </p>
                            </div>

                            <div className="max-h-72 overflow-y-auto">
                                {searchResults.map((file) => {
                                    const icon = FILE_TYPE_ICONS[file.fileType] || FILE_TYPE_ICONS.other;
                                    return (
                                        <button
                                            key={file.$id}
                                            onClick={() => handleFileClick(file)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-amber-500/8 transition-colors text-left group cursor-pointer"
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${icon.bg}`}>
                                                {icon.emoji}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate group-hover:text-amber-300 transition-colors">
                                                    {file.fileName}
                                                </p>
                                                <p className="text-xs text-(--fg-muted) mt-0.5">
                                                    {formatFileSize(file.fileSize)} • {file.fileType}
                                                </p>
                                            </div>

                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                className="text-(--fg-muted) group-hover:text-amber-400 transition-colors shrink-0"
                                            >
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                <polyline points="15 3 21 3 21 9" />
                                                <line x1="10" y1="14" x2="21" y2="3" />
                                            </svg>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden sm:block w-px h-5 bg-amber-500/15 shrink-0" />

                {/* Upload Action */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black text-sm font-semibold transition-all duration-150 shadow-md shadow-amber-500/25 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                >
                    {uploading ? (
                        <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                            <span className="hidden sm:inline text-sm">Uploading...</span>
                        </>
                    ) : (
                        <>
                            <UploadIcon />
                            <span className="hidden sm:inline text-sm">Upload</span>
                        </>
                    )}
                </button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

                {/* Account Actions */}
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    title="Sign out"
                    className="flex items-center justify-center w-9 h-9 rounded-xl border border-amber-500/15 text-(--fg-dim) hover:text-amber-400 hover:border-amber-500/35 hover:bg-amber-500/6 bg-white/4 transition-all shrink-0 disabled:opacity-60"
                >
                    {loggingOut ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                    ) : (
                        <LogoutIcon />
                    )}
                </button>
            </header>
        </>
    );
}
