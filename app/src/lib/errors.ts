/**
 * Safe error messages that can be exposed to clients.
 * Everything else gets the fallback.
 */
const SAFE_PATTERNS = [
  "owner is required",
  "not found",
  "Invalid public key",
  "Account does not exist",
];

export function getErrorMessage(error: unknown, fallback: string) {
  const raw =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (raw && SAFE_PATTERNS.some((p) => raw.includes(p))) {
    return raw;
  }

  return fallback;
}
