/**
 * @file app/api/ping/route.js
 * @description Appwrite keepalive endpoint.
 */

import { NextResponse } from "next/server";
import { Client, Databases, Query } from "appwrite";

// Secret guard
const PING_SECRET = process.env.PING_SECRET ?? null;

export async function GET(request) {
    // Optional secret validation
    if (PING_SECRET) {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("secret");
        if (token !== PING_SECRET) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.NEXT_APPWRITE_SECRET;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION;

    // Basic env check
    if (!endpoint || !projectId || !apiKey || !dbId || !collectionId) {
        return NextResponse.json(
            { ok: false, error: "Missing Appwrite environment variables" },
            { status: 500 }
        );
    }

    try {
        // Actual Appwrite API call
        // Fetch only 1 document — minimum bandwidth, maximum effect.
        const client = new Client()
            .setEndpoint(endpoint)
            .setProject(projectId);

        // Manually set API key header (Admin access)
        client.headers["X-Appwrite-Key"] = apiKey;

        const databases = new Databases(client);

        const result = await databases.listDocuments(dbId, collectionId, [
            Query.limit(1),
        ]);

        return NextResponse.json({
            ok: true,
            ping: "Appwrite is alive! ✅",
            timestamp: new Date().toISOString(),
            documentsFound: result.total ?? 0,
        });
    } catch (error) {
        // Log error too — for debugging
        console.error("[/api/ping] Appwrite ping failed:", error);
        return NextResponse.json(
            {
                ok: false,
                error: error.message ?? "Unknown error",
                timestamp: new Date().toISOString(),
            },
            { status: 502 }
        );
    }
}
