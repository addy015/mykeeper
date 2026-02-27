"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

/**
 * Available sorting options for file lists.
 */
const SORT_OPTIONS = [
    { value: "date-desc", label: "Date created (newest)" },
    { value: "date-asc", label: "Date created (oldest)" },
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
    { value: "size-desc", label: "Size (Highest)" },
    { value: "size-asc", label: "Size (Lowest)" },
];

/**
 * Dropdown component to handle file sorting by updating URL search parameters.
 */
export default function SortDropdown() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentSort = searchParams.get("sort") || "date-desc";

    /**
     * Updates the 'sort' URL parameter and triggers a non-blocking navigation.
     */
    function handleChange(e) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", e.target.value);

        // Use startTransition to keep the UI responsive during the route update
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-(--fg-muted) hidden sm:inline">Sort by:</span>
            <div className="relative">
                <select
                    value={currentSort}
                    onChange={handleChange}
                    disabled={isPending}
                    className="appearance-none rounded-xl bg-white/5 border border-amber-500/15 text-sm text-foreground focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all cursor-pointer disabled:opacity-60"
                    style={{ padding: "4px 3px" }}
                >
                    {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#494b3d]">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-(--fg-muted)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            </div>
        </div>
    );
}
