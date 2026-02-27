/**
 * Server-side actions for user management.
 * These functions run purely on the server to protect sensitive operations and secrets.
 */
"use server";

import { Databases, ID, Query } from "appwrite";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/appwrite";
import { toPlainObject } from "@/lib/plain";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const USERS_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION;

// ── Cookie Configuration ───────────────────────────────────────────────────────
const COOKIE_NAME = "mykeeper_uid";
const COOKIE_OPTS = {
    httpOnly: true,    // Prevent client-side JS access (XSS protection)
    secure: process.env.NODE_ENV === "production", // Use HTTPS only in production
    sameSite: "lax",   // CSRF protection
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
};

// ── getCurrentUser ─────────────────────────────────────────────────────────────
/**
 * Fetches the currently authenticated user based on session cookies.
 */
export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const accountId = cookieStore.get(COOKIE_NAME)?.value;

        if (!accountId) return null;

        const { databases } = createAdminClient();
        const result = await databases.listDocuments(DB_ID, USERS_ID, [
            Query.equal("accountId", accountId),
            Query.limit(1),
        ]);

        const userDoc = result.documents[0];
        return userDoc ? toPlainObject(userDoc) : null;
    } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
    }
}

// ── createOrFetchUser ──────────────────────────────────────────────────────────
/**
 * Called after successful OAuth callback to sync the user document.
 */
export async function createOrFetchUser({ accountId, name, email }) {
    const { databases } = createAdminClient();

    // Check if user already exists in internal database
    const existing = await databases.listDocuments(DB_ID, USERS_ID, [
        Query.equal("accountId", accountId),
        Query.limit(1),
    ]);

    let userDoc;
    if (existing.documents.length > 0) {
        userDoc = existing.documents[0];
    } else {
        // Create a new user profile document
        userDoc = await databases.createDocument(DB_ID, USERS_ID, ID.unique(), {
            fullName: name || email.split("@")[0],
            email,
            // Generate a placeholder avatar if none provided
            avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
            accountId,
        });
    }

    // Set server-side session cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, accountId, COOKIE_OPTS);

    return toPlainObject(userDoc);
}

// ── logoutUser ─────────────────────────────────────────────────────────────────
/**
 * Terminates the server session and redirects to sign-in.
 */
export async function logoutUser() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    redirect("/sign-in");
}
