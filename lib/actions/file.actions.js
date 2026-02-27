/**
 * Server-side actions for file management.
 * Handles Appwrite Storage (buckets) and Database (metadata) operations.
 */
"use server";

import { createAdminClient } from "@/lib/appwrite";
import { ID, Query, Permission, Role } from "appwrite";
import { getFileType, mapBackendFileTypeToUiCategory, parseSortKey } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { toPlainObject } from "@/lib/plain";

// ── Configuration & Constants ────────────────────────────────────────────────
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const FILES_ID = process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION;
const USERS_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION;
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET;
const STORAGE_META_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_COLLECTION;
const GLOBAL_DOC_ID = "global_storage";
const TOTAL_STORAGE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB limit
const COOKIE_NAME = "mykeeper_uid";

// ── Internals ─────────────────────────────────────────────────────────────────
/**
 * Retrieves the current user's account ID from server cookies.
 */
async function getAuthenticatedAccountId() {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Ensures the requesting user is the owner of the specified file.
 * Throws an error if authentication fails or ownership is not verified.
 */
async function assertFileOwner(databases, fileId) {
    const currentAccountId = await getAuthenticatedAccountId();
    if (!currentAccountId) {
        throw new Error("Authentication required to modify this file.");
    }

    const existing = await databases.getDocument(DB_ID, FILES_ID, fileId);
    if (existing.accountId !== currentAccountId) {
        throw new Error("Permission denied: You are not the owner of this file.");
    }

    return { existing, currentAccountId };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── UPLOAD ─── Handles binary file storage and metadata document creation
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Uploads a file to Appwrite Storage and creates a corresponding metadata document.
 */
export async function uploadFile({ file, accountId, path, uploadedBy }) {
    const { storage, databases } = createAdminClient();
    let uploadedReference = null;

    try {
        // Phase 1: Upload binary to Storage Bucket
        // Grant the owner (accountId) full read, update, and delete access.
        // This is required when "File security" is enabled on the bucket.
        const permissions = [
            Permission.read(Role.user(accountId)),
            Permission.update(Role.user(accountId)),
            Permission.delete(Role.user(accountId)),
        ];

        uploadedReference = await storage.createFile(BUCKET_ID, ID.unique(), file, permissions);

        // Phase 2: Create metadata document in Database
        const extension = (file.name.split(".").pop() || "").toLowerCase();
        const type = getFileType(extension);

        const metadata = {
            fileName: file.name,
            fileType: type,
            fileSize: file.size,
            fileUrl: `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploadedReference.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`,
            bucketField: uploadedReference.$id,
            accountId,
            fileExtension: extension,
            users: [], // Initially private
        };

        let fileDocument;
        try {
            fileDocument = await databases.createDocument(DB_ID, FILES_ID, ID.unique(), metadata);
        } catch (dbError) {
            // Logic to handle schemas requiring integer 'uploadedBy' field
            const message = String(dbError?.message || "");
            const needsIntUploadedBy =
                message.includes("uploadedBy") &&
                (message.toLowerCase().includes("required") || message.includes("signed 64-bit integer"));

            if (!needsIntUploadedBy) throw dbError;

            const uploadedByValue = Number.isSafeInteger(uploadedBy) ? uploadedBy : Date.now();

            fileDocument = await databases.createDocument(DB_ID, FILES_ID, ID.unique(), {
                ...metadata,
                uploadedBy: uploadedByValue,
            });
        }

        revalidatePath(path);
        return toPlainObject(fileDocument);
    } catch (error) {
        // Rollback: Delete stored file if DB document creation fails (prevent orphans)
        if (uploadedReference?.$id) {
            try {
                await storage.deleteFile(BUCKET_ID, uploadedReference.$id);
            } catch (cleanupError) {
                console.error("Rollback failed:", cleanupError);
            }
        }
        throw new Error(`Upload failed: ${error.message}`);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SEARCH ─── Optimized, lightweight search for UI dropdowns
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Searches for files matching a query. Limited to 8 results for performance.
 */
export async function searchFiles({ query, accountId, viewerEmail = "" }) {
    if (!query || !query.trim()) return [];

    const { databases } = createAdminClient();
    const normalizedEmail = String(viewerEmail || "").trim().toLowerCase();

    // Query for files owned by user OR shared with user
    const visibilityQuery = normalizedEmail
        ? Query.or([
            Query.equal("accountId", [accountId]),
            Query.containsAny("users", [normalizedEmail]),
        ])
        : Query.equal("accountId", [accountId]);

    const queries = [
        visibilityQuery,
        Query.contains("fileName", query.trim()),
        Query.orderDesc("$createdAt"),
        Query.limit(8),
    ];

    try {
        const result = await databases.listDocuments(DB_ID, FILES_ID, queries);
        return (result.documents || []).map((doc) => ({
            $id: doc.$id,
            fileName: doc.fileName,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            fileUrl: doc.fileUrl,
        }));
    } catch (error) {
        console.error("Search failed:", error);
        return [];
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── FETCH / QUERY ─── Main file retrieval with filtering and sorting
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Retrieves a list of files based on filters and search parameters.
 */
export async function getFiles({
    types = [],
    searchQuery = "",
    sort = "date-desc",
    accountId,
    viewerEmail = "",
    limit = 100,
}) {
    const { databases } = createAdminClient();
    const { attribute, order } = parseSortKey(sort);
    const normalizedViewerEmail = String(viewerEmail || "").trim().toLowerCase();

    const visibilityQuery = normalizedViewerEmail
        ? Query.or([
            Query.equal("accountId", [accountId]),
            Query.containsAny("users", [normalizedViewerEmail]),
        ])
        : Query.equal("accountId", [accountId]);

    const queries = [
        visibilityQuery,
        order === "asc" ? Query.orderAsc(attribute) : Query.orderDesc(attribute),
        Query.limit(limit),
    ];

    if (types.length > 0) queries.push(Query.equal("fileType", types));
    if (searchQuery) queries.push(Query.contains("fileName", searchQuery));

    try {
        const result = await databases.listDocuments(DB_ID, FILES_ID, queries);
        const documents = result.documents || [];

        // Fetch owner names for shared files to display "Shared by XYZ" in UI
        let ownerNameByAccountId = new Map();
        const ownerAccountIds = [...new Set(documents.map((doc) => doc.accountId).filter(Boolean))];

        if (USERS_ID && ownerAccountIds.length > 0) {
            try {
                const usersResult = await databases.listDocuments(DB_ID, USERS_ID, [
                    Query.equal("accountId", ownerAccountIds),
                    Query.limit(Math.min(ownerAccountIds.length, 100)),
                ]);
                ownerNameByAccountId = new Map(
                    (usersResult.documents || []).map((userDoc) => [
                        userDoc.accountId,
                        userDoc.fullName || userDoc.email || "Unknown user",
                    ])
                );
            } catch (error) {
                console.error("Failed to fetch owner names:", error);
            }
        }

        const enrichedDocuments = documents.map((doc) => {
            const isShared = doc.accountId !== accountId;
            const uiFileType = mapBackendFileTypeToUiCategory(doc.fileType || "other");
            return {
                ...doc,
                uiFileType,
                isShared,
                sharedByName: isShared ? ownerNameByAccountId.get(doc.accountId) || "Unknown user" : "You",
            };
        });

        return toPlainObject(enrichedDocuments);
    } catch (error) {
        throw new Error(`Failed to fetch files: ${error.message}`);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── STORAGE STATS ─── Aggregates global storage usage metrics
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calculates total storage used across all files in the system.
 */
export async function getTotalSpaceUsed() {
    const { databases } = createAdminClient();

    try {
        const result = await databases.listDocuments(DB_ID, FILES_ID, [Query.limit(5000)]);
        const breakdown = { document: 0, image: 0, media: 0, other: 0 };
        let totalUsed = 0;

        for (const doc of result.documents) {
            const size = Number(doc.fileSize ?? 0);
            if (Number.isNaN(size)) continue;
            totalUsed += size;

            const type = mapBackendFileTypeToUiCategory(doc.fileType || "other");
            if (breakdown[type] !== undefined) breakdown[type] += size;
            else breakdown.other += size;
        }

        return {
            totalUsed,
            totalAvailable: TOTAL_STORAGE_BYTES,
            usedPercentage: ((totalUsed / TOTAL_STORAGE_BYTES) * 100).toFixed(2),
            breakdown,
        };
    } catch (error) {
        console.error("Storage aggregation failed:", error);
        return {
            totalUsed: 0,
            totalAvailable: TOTAL_STORAGE_BYTES,
            usedPercentage: "0.00",
            breakdown: { document: 0, image: 0, media: 0, other: 0 },
        };
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── RENAME ─── Modifies the file name in the metadata document
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Renames a file document in the database.
 */
export async function renameFile({ fileId, newName, path }) {
    const { databases } = createAdminClient();
    try {
        await assertFileOwner(databases, fileId);
        const updated = await databases.updateDocument(DB_ID, FILES_ID, fileId, {
            fileName: newName,
        });
        revalidatePath(path);
        return toPlainObject(updated);
    } catch (error) {
        throw new Error(`Rename failed: ${error.message}`);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SHARE ─── Grants access to additional users via their email address
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Updates sharing permissions for a file by adding user emails.
 * Also synchronizes Appwrite Storage file permissions so shared users can view previews.
 */
export async function updateFileAccess({ fileId, emails, path }) {
    const { databases, storage } = createAdminClient();
    try {
        // 1. Fetch existing document and validate emails
        const existing = await databases.getDocument(DB_ID, FILES_ID, fileId);
        const currentUsers = Array.isArray(existing.users) ? existing.users : [];
        const normalizedEmails = emails
            .map((email) => String(email || "").trim().toLowerCase())
            .filter(Boolean);
        const merged = [...new Set([...currentUsers, ...normalizedEmails])];

        // 2. Look up account IDs for all shared users in our internal user table
        // This is necessary because Storage permissions require Account IDs, while we share via Email.
        let accountIdsToGrant = [existing.accountId]; // Owner always has access
        if (merged.length > 0) {
            try {
                const userDocs = await databases.listDocuments(DB_ID, USERS_ID, [
                    Query.equal("email", merged),
                    Query.limit(merged.length),
                ]);
                const discoveredIds = userDocs.documents.map(u => u.accountId).filter(Boolean);
                accountIdsToGrant = [...new Set([...accountIdsToGrant, ...discoveredIds])];
            } catch (userLookupError) {
                console.error("Failed to lookup shared user IDs:", userLookupError);
            }
        }

        // 3. Update Storage file permissions (previews only work if users have storage-level read access)
        if (existing.bucketField) {
            try {
                const storagePermissions = accountIdsToGrant.map(id => Permission.read(Role.user(id)));
                // We keep full permissions for the owner
                storagePermissions.push(Permission.update(Role.user(existing.accountId)));
                storagePermissions.push(Permission.delete(Role.user(existing.accountId)));

                await storage.updateFile(BUCKET_ID, existing.bucketField, storagePermissions);
            } catch (storageError) {
                console.error("Failed to update storage permissions:", storageError);
            }
        }

        // 4. Update Database metadata document
        const updated = await databases.updateDocument(DB_ID, FILES_ID, fileId, {
            users: merged,
        });

        revalidatePath(path);
        return toPlainObject(updated);
    } catch (error) {
        throw new Error(`Sharing failed: ${error.message}`);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── DELETE ─── Permanently removes a file from storage and the database
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Deletes a file both from Appwrite Storage and its Database record.
 */
export async function deleteFile({ fileId, bucketFileId, path }) {
    const { storage, databases } = createAdminClient();
    try {
        const { existing } = await assertFileOwner(databases, fileId);
        const resolvedBucketFileId = bucketFileId || existing.bucketField;

        // Delete from Storage
        if (resolvedBucketFileId) {
            try {
                await storage.deleteFile(BUCKET_ID, resolvedBucketFileId);
            } catch (error) {
                // Ignore errors if file is already missing from storage
                const message = String(error?.message || "").toLowerCase();
                if (error?.code !== 404 && !message.includes("not found")) throw error;
            }
        }

        // Delete from Database
        await databases.deleteDocument(DB_ID, FILES_ID, fileId);

        revalidatePath(path);
        return { success: true };
    } catch (error) {
        throw new Error(`Delete failed: ${error.message}`);
    }
}
