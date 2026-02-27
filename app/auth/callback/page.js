"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite";
import { createOrFetchUser } from "@/lib/actions/user.actions";

/**
 * OAuth Callback Page.
 * Handles the final step of Google OAuth by exchanging temporary tokens for a session.
 */
export default function AuthCallback() {
    const router = useRouter();
    const [error, setError] = useState("");

    useEffect(() => {
        let isCancelled = false;
        let redirectTimer;

        async function processAuthentication() {
            try {
                // Parse temporary credentials from URL query parameters
                const searchParams = new URLSearchParams(window.location.search);
                const userId = searchParams.get("userId");
                const secret = searchParams.get("secret");

                if (userId && secret) {
                    try {
                        // Exchange temporary token for a persistent browser session
                        await account.createSession(userId, secret);
                    } catch (error) {
                        // Handle potential 409 Conflict if session already exists (e.g., React StrictMode double invocation)
                        const message = String(error?.message || "");
                        const isAlreadyAuthenticated =
                            error?.code === 409 ||
                            message.includes("Creation of a session is prohibited when a session is active");

                        if (!isAlreadyAuthenticated) throw error;
                    }
                    // Clean secure parameters from URL history for security
                    window.history.replaceState({}, "", window.location.pathname);
                }

                // Retrieve user identity from Appwrite
                const appwriteUser = await account.get();

                // Synchronize user profile with internal database and set server-side session cookies
                await createOrFetchUser({
                    accountId: appwriteUser.$id,
                    name: appwriteUser.name,
                    email: appwriteUser.email,
                });

                if (!isCancelled) router.replace("/");
            } catch (error) {
                console.error("Authentication callback failed:", error);
                if (!isCancelled) {
                    setError("Unable to complete sign-in. Redirecting to login...");
                    redirectTimer = window.setTimeout(() => router.replace("/sign-in"), 2000);
                }
            }
        }

        processAuthentication();

        return () => {
            isCancelled = true;
            if (redirectTimer) window.clearTimeout(redirectTimer);
        };
    }, [router]);

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            background: "#0a0906",
            color: "#fff",
            fontFamily: "inherit",
        }}>
            {error ? (
                <p style={{ fontSize: "0.95rem", color: "#f87171" }}>{error}</p>
            ) : (
                <>
                    <div style={{
                        width: 44, height: 44,
                        borderRadius: "50%",
                        border: "3px solid rgba(245,158,11,0.15)",
                        borderTop: "3px solid #f59e0b",
                        animation: "spin 0.8s linear infinite",
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.45)" }}>
                        Configuring your account...
                    </p>
                </>
            )}
        </div>
    );
}
