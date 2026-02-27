const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE_BIGINT = BigInt(Number.MIN_SAFE_INTEGER);

/**
 * Converts Appwrite SDK responses into plain JSON-serializable objects.
 * This is necessary because Appwrite objects often have null prototypes,
 * which cannot be serialized across React Server Component boundaries.
 */
export function toPlainObject(value) {
    return JSON.parse(
        JSON.stringify(value, (_key, current) => {
            // Handle BigInt conversion for JSON compatibility
            if (typeof current === "bigint") {
                if (current <= MAX_SAFE_BIGINT && current >= MIN_SAFE_BIGINT) {
                    return Number(current);
                }
                return current.toString();
            }
            return current;
        })
    );
}
