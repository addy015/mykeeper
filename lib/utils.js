/**
 * Converts bytes to a human-readable format.
 * @param {number} bytes - File size in bytes.
 * @returns {string} Formatted size (e.g., "2.40 MB").
 */
export function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "0 Bytes";
    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Determines file category based on its extension.
 */
export function getFileType(extension) {
    const ext = (extension || "").toLowerCase().replace(".", "");

    const documentExtensions = [
        "docx", "doc", "pdf", "txt", "rtf", "odt", "md",
        "xlsx", "xls", "csv", "ods", "pptx", "ppt", "key",
        "odp", "html", "htm", "xml", "json",
    ];
    const imageExtensions = [
        "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp",
        "tiff", "tif", "heic", "raw", "psd", "ai", "eps", "ico", "avif",
    ];
    const videoExtensions = ["mp4", "mkv", "mov", "avi", "wmv", "flv", "webm", "m4v"];
    const audioExtensions = ["mp3", "wav", "aac", "flac", "ogg", "m4a", "wma", "mid"];

    if (documentExtensions.includes(ext)) return "document";
    if (imageExtensions.includes(ext)) return "image";
    if (videoExtensions.includes(ext)) return "video";
    if (audioExtensions.includes(ext)) return "audio";
    return "other";
}

/**
 * Maps granular backend types to high-level UI categories.
 */
export function mapBackendFileTypeToUiCategory(fileType) {
    switch ((fileType || "").toLowerCase()) {
        case "document":
            return "document";
        case "image":
            return "image";
        case "video":
        case "audio":
            return "media";
        default:
            return "other";
    }
}

/**
 * Formats an ISO date string for display.
 */
export function formatDateTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        day: "numeric",
        month: "short",
    });
}

/**
 * Returns Tailwind CSS color classes for different file types.
 */
export function getFileTypeColor(type) {
    switch (mapBackendFileTypeToUiCategory(type)) {
        case "document": return { bg: "bg-rose-100", text: "text-rose-600" };
        case "image": return { bg: "bg-blue-100", text: "text-blue-600" };
        case "media": return { bg: "bg-green-100", text: "text-green-600" };
        default: return { bg: "bg-purple-100", text: "text-purple-600" };
    }
}

/**
 * Constructs a public preview URL for a storage file.
 */
export function constructFileUrl(bucketFileId) {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET;
    return `${endpoint}/storage/buckets/${bucketId}/files/${bucketFileId}/view?project=${projectId}`;
}

/**
 * Constructs a direct download URL for a storage file.
 */
export function constructDownloadUrl(bucketFileId) {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET;
    return `${endpoint}/storage/buckets/${bucketId}/files/${bucketFileId}/download?project=${projectId}`;
}

/**
 * Maps UI categories to their respective Appwrite file types.
 */
export function getTypesForCategory(category) {
    switch (category) {
        case "documents": return ["document"];
        case "images": return ["image"];
        case "media": return ["video", "audio"];
        case "others": return ["archive", "other"];
        default: return [];
    }
}

/**
 * Parses a sort key into an Appwrite-compatible query config.
 */
export function parseSortKey(sortKey) {
    const map = {
        "name-asc": { attribute: "fileName", order: "asc" },
        "name-desc": { attribute: "fileName", order: "desc" },
        "date-desc": { attribute: "$createdAt", order: "desc" },
        "date-asc": { attribute: "$createdAt", order: "asc" },
        "size-desc": { attribute: "fileSize", order: "desc" },
        "size-asc": { attribute: "fileSize", order: "asc" },
    };
    return map[sortKey] || map["date-desc"];
}
