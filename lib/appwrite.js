// Appwrite SDK imports for client and administrative operations
import { Client, Account, Databases, Storage } from "appwrite";

// ── Client-Side SDK ───────────────────────────────────────────────────────────
// This client runs in the browser and handles direct requests to Appwrite
export const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// ── Server-Side Admin Client ──────────────────────────────────────────────────
// Used only in Next.js Server Actions to perform administrative tasks.
// Requires NEXT_APPWRITE_SECRET which must NEVER be exposed to the client.
export function createAdminClient() {
    const appwriteSecret = process.env.NEXT_APPWRITE_SECRET;

    if (!appwriteSecret) {
        throw new Error("Missing NEXT_APPWRITE_SECRET environment variable");
    }

    const adminClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

    // Manually setting the API key header since the Web SDK doesn't have setKey()
    adminClient.headers["X-Appwrite-Key"] = appwriteSecret;

    return {
        databases: new Databases(adminClient),
        storage: new Storage(adminClient),
        account: new Account(adminClient),
    };
}
