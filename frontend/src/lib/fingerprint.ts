/**
 * Generate a SHA-256 browser fingerprint from stable browser characteristics.
 * Used to uniquely identify a visitor without requiring login.
 * Falls back to a random localStorage-persisted ID when crypto.subtle is
 * unavailable (e.g. non-secure HTTP context).
 */
export async function generateFingerprint(): Promise<string> {
  // crypto.subtle is only available in secure contexts (HTTPS / localhost).
  if (!crypto?.subtle) {
    const STORAGE_KEY = "_gb_fp"
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
    const random = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")
    localStorage.setItem(STORAGE_KEY, random)
    return random
  }

  const data = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    navigator.platform ?? "",
    navigator.hardwareConcurrency?.toString() ?? "",
    (navigator as any).deviceMemory?.toString() ?? "",
  ].join("|")

  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
