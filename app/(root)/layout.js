import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { getTotalSpaceUsed } from "@/lib/actions/file.actions";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

/**
 * Main dashboard layout wrapper.
 * Handles authentication checks and provides global navigation/sidebar components.
 */
export default async function RootLayout({ children }) {
    // Authenticate user server-side
    const currentUser = await getCurrentUser();
    if (!currentUser) redirect("/sign-in");

    // Retrieve storage aggregation for the sidebar widget
    const spaceData = await getTotalSpaceUsed();

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar navigation and storage usage */}
            <Sidebar user={currentUser} usedBytes={spaceData.totalUsed} />

            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* 
                  Suspense boundary is required for Topbar because it uses search params.
                  This prevents hydration mismatches in Next.js 15+.
                */}
                <Suspense fallback={
                    <div className="h-14 border-b border-amber-500/10 bg-background/90 backdrop-blur-md shrink-0" />
                }>
                    <Topbar user={currentUser} />
                </Suspense>

                {/* Main Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-h-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
