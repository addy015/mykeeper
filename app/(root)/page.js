import { getCurrentUser } from "@/lib/actions/user.actions";
import { getFiles, getTotalSpaceUsed } from "@/lib/actions/file.actions";
import { redirect } from "next/navigation";
import StorageSummary from "@/components/StorageSummary";
import { formatDateTime } from "@/lib/utils";

// ── Icon Mapping ──────────────────────────────────────────────────────────────
// Define visual styles and status indicators for various file categories.
const ICON_MAP = {
    image: { bg: "bg-blue-500/15", text: "text-blue-400", emoji: "🖼️" },
    media: { bg: "bg-green-500/15", text: "text-green-400", emoji: "🎬" },
    document: { bg: "bg-rose-500/15", text: "text-rose-400", emoji: "📄" },
    other: { bg: "bg-purple-500/15", text: "text-purple-400", emoji: "📦" },
};

/**
 * Row component for the "Recent Uploads" list.
 */
function RecentFileItem({ file }) {
    const icon = ICON_MAP[file.uiFileType] || ICON_MAP.other;
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-amber-500/8 last:border-0 group hover:bg-amber-500/5 rounded-xl px-2 -mx-2 transition-colors cursor-default">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${icon.bg}`}>
                {icon.emoji}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.fileName}</p>
                <p className="text-xs text-(--fg-muted) mt-0.5">{formatDateTime(file.$createdAt)}</p>
                {file.isShared && (
                    <p className="text-xs text-amber-500/70 mt-0.5 truncate">
                        Shared by {file.sharedByName || "Unknown"}
                    </p>
                )}
            </div>

            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${icon.bg} ${icon.text} shrink-0`}>
                {file.uiFileType || "file"}
            </span>
        </div>
    );
}

/**
 * Fallback UI for when no files are available.
 */
function EmptyState({ message = "No files yet" }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3 text-3xl">
                ☁️
            </div>
            <p className="text-(--fg-dim) font-medium text-sm">{message}</p>
            <p className="text-xs text-(--fg-muted) mt-1">Upload files using the button above</p>
        </div>
    );
}

/**
 * Returns a time-aware greeting message.
 */
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

/**
 * Main dashboard view showing storage summary and recent activities.
 */
export default async function DashboardPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser) redirect("/sign-in");

    // Fetch dashboard data in parallel for optimal performance
    const [spaceData, recentFiles] = await Promise.all([
        getTotalSpaceUsed(),
        getFiles({
            accountId: currentUser.accountId,
            viewerEmail: currentUser.email,
            sort: "date-desc",
            limit: 10,
        }),
    ]);

    const firstName = currentUser.fullName?.split(" ")[0] || "there";

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header section with personalized greeting */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {getGreeting()},{" "}
                    <span className="text-amber-400">{firstName}</span> 👋
                </h1>
                <p className="text-sm text-(--fg-muted) mt-1">
                    Here&apos;s a summary of your cloud storage.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
                {/* Visual storage analytics */}
                <StorageSummary spaceData={spaceData} />

                {/* Sidebar list of most recent files */}
                <div className="bg-(--bg-card) border border-amber-500/10 rounded-3xl p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <h2 className="text-base font-bold text-foreground">Recent uploads</h2>
                        <span className="text-xs text-(--fg-muted) bg-white/5 px-2.5 py-1 rounded-lg border border-amber-500/10 font-medium">
                            {recentFiles.length} files
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
                        {recentFiles.length === 0 ? (
                            <EmptyState message="No files uploaded yet" />
                        ) : (
                            <div>
                                {recentFiles.map((file) => (
                                    <RecentFileItem key={file.$id} file={file} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
