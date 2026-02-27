import { getCurrentUser } from "@/lib/actions/user.actions";
import { getFiles, getTotalSpaceUsed } from "@/lib/actions/file.actions";
import { redirect } from "next/navigation";
import { getTypesForCategory, formatFileSize } from "@/lib/utils";
import FileCard from "@/components/FileCard";
import SortDropdown from "@/components/SortDropdown";
import { Suspense } from "react";

// ── Category Metadata ─────────────────────────────────────────────────────────
// UI branding for specific file type views.
const CATEGORY_META = {
    documents: { title: "Documents", emoji: "📄", color: "text-rose-400" },
    images: { title: "Images", emoji: "🖼️", color: "text-blue-400" },
    media: { title: "Media", emoji: "🎬", color: "text-green-400" },
    others: { title: "Others", emoji: "📦", color: "text-purple-400" },
};

// Maps dynamic route segment to storage breakdown backend key.
const BREAKDOWN_KEY_BY_ROUTE = {
    documents: "document",
    images: "image",
    media: "media",
    others: "other",
};

/**
 * Centered state for when a category has no items.
 */
function EmptyState({ type }) {
    const meta = CATEGORY_META[type] || { emoji: "☁️" };
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center mb-4 text-5xl">
                {meta.emoji}
            </div>
            <p className="text-(--fg-dim) font-semibold text-base">No files found</p>
            <p className="text-sm text-(--fg-muted) mt-1.5 max-w-xs">
                Upload some {meta.title?.toLowerCase()} to see them here.
            </p>
        </div>
    );
}

/**
 * Grid layout for displaying file cards.
 */
function FileGrid({ files }) {
    if (files.length === 0) return null;
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {files.map((file) => (
                <FileCard key={file.$id} file={file} />
            ))}
        </div>
    );
}

/**
 * Dynamic route for filtered file views (e.g., /documents, /images).
 */
export default async function CategoryPage({ params, searchParams }) {
    const { type } = await params;
    const { search = "", sort = "date-desc" } = await searchParams;

    const currentUser = await getCurrentUser();
    if (!currentUser) redirect("/sign-in");

    const meta = CATEGORY_META[type];
    if (!meta) redirect("/");

    const types = getTypesForCategory(type);

    // Concurrent data fetching for optimized response times
    const [files, spaceData] = await Promise.all([
        getFiles({
            types,
            searchQuery: search,
            sort,
            accountId: currentUser.accountId,
            viewerEmail: currentUser.email,
        }),
        getTotalSpaceUsed(),
    ]);

    const typeKey = BREAKDOWN_KEY_BY_ROUTE[type] || "other";
    const categoryBytes = spaceData.breakdown[typeKey] || 0;

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            {/* View header with category stats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{meta.emoji}</span>
                        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${meta.color}`}>
                            {meta.title}
                        </h1>
                    </div>
                    <p className="text-sm text-(--fg-muted) mt-1 ml-0.5">
                        <span className="font-semibold text-amber-400">{formatFileSize(categoryBytes)}</span>{" "}
                        stored
                        {search && (
                            <span className="ml-2">
                                · Searching <span className="text-(--fg-dim) font-medium">&ldquo;{search}&rdquo;</span>
                            </span>
                        )}
                        {files.length > 0 && (
                            <span className="ml-2 text-(--fg-muted)">· {files.length} file{files.length !== 1 ? "s" : ""}</span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Suspense>
                        <SortDropdown />
                    </Suspense>
                </div>
            </div>

            {/* Results Grid */}
            {files.length === 0 ? (
                <EmptyState type={type} />
            ) : (
                <FileGrid files={files} />
            )}
        </div>
    );
}

/**
 * Pre-defines valid route segments for static optimization.
 */
export function generateStaticParams() {
    return [
        { type: "documents" },
        { type: "images" },
        { type: "media" },
        { type: "others" },
    ];
}
