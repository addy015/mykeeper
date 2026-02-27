import { formatFileSize, formatDateTime } from "@/lib/utils";
import Link from "next/link";

/**
 * Circular progress component displaying storage usage as a percentage ring.
 */
function CircleProgress({ percentage }) {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(parseFloat(percentage) || 0, 100);
    const offset = circumference - (pct / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center shrink-0">
            <svg width="152" height="152" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="76" cy="76" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
                <circle
                    cx="76" cy="76" r={radius} fill="none"
                    stroke="url(#progressGrad)" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)" }}
                />
                <defs>
                    <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-white leading-tight">{pct.toFixed(1)}%</span>
                <span className="text-[10px] text-(--fg-muted) mt-0.5 font-medium uppercase tracking-wide">Used</span>
            </div>
        </div>
    );
}

/**
 * Configuration for different storage categories.
 */
const CATEGORY_META = {
    document: {
        label: "Documents",
        color: "from-rose-500/15 to-rose-600/5",
        iconBg: "bg-rose-500",
        textColor: "text-rose-400",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
        ),
    },
    image: {
        label: "Images",
        color: "from-blue-500/15 to-blue-600/5",
        iconBg: "bg-blue-500",
        textColor: "text-blue-400",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
        ),
    },
    media: {
        label: "Media",
        color: "from-green-500/15 to-green-600/5",
        iconBg: "bg-green-500",
        textColor: "text-green-400",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
        ),
    },
    other: {
        label: "Others",
        color: "from-purple-500/15 to-purple-600/5",
        iconBg: "bg-purple-500",
        textColor: "text-purple-400",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        ),
    },
};

/**
 * Individual category card displaying usage and icon.
 */
function CategoryCard({ type, sizeBytes }) {
    const meta = CATEGORY_META[type] || CATEGORY_META.other;
    return (
        <div className={`flex items-center gap-3 p-3.5 rounded-2xl bg-linear-to-br ${meta.color} border border-white/6 transition-all duration-200 hover:border-white/12 hover:scale-[1.02]`}>
            <div className={`w-9 h-9 rounded-xl ${meta.iconBg} flex items-center justify-center shrink-0 shadow-lg`}>
                {meta.icon}
            </div>
            <div className="min-w-0">
                <p className={`text-sm font-bold ${meta.textColor} leading-tight`}>{formatFileSize(sizeBytes)}</p>
                <p className="text-xs text-(--fg-muted) mt-0.5 font-medium">{meta.label}</p>
            </div>
        </div>
    );
}

/**
 * Component providing a overview of storage usage with a summary and category breakdown.
 */
export default function StorageSummary({ spaceData }) {
    const { totalUsed, totalAvailable, usedPercentage, breakdown } = spaceData;

    return (
        <div className="space-y-4">
            {/* Main storage summary card with circular chart */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-500/15 via-orange-500/8 to-transparent border border-amber-500/20 p-5 sm:p-6">
                {/* Decorative background effects */}
                <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-orange-500/6 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <CircleProgress percentage={usedPercentage} />

                    <div className="text-center sm:text-left flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-widest text-(--fg-muted) mb-1">
                            Global Storage Summary
                        </p>
                        <p className="text-3xl font-extrabold text-amber-400 leading-tight">
                            {formatFileSize(totalUsed)}
                        </p>
                        <p className="text-sm text-(--fg-muted) mt-1">
                            of{" "}
                            <span className="text-(--fg-dim) font-semibold">{formatFileSize(totalAvailable)}</span>{" "}
                            total used
                        </p>

                        <div className="mt-4 w-full">
                            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-500 transition-all duration-700"
                                    style={{ width: `${Math.min(parseFloat(usedPercentage) || 0, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid of category-specific usage cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mt-6">
                {Object.entries(breakdown).map(([type, size]) => {
                    const route = type === "document" ? "/documents"
                        : type === "image" ? "/images"
                            : type === "other" ? "/others"
                                : `/${type}`;
                    return (
                        <Link key={type} href={route} className="cursor-pointer">
                            <CategoryCard type={type} sizeBytes={size} />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
