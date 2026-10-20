/**
 * The visitor's IP, for the hourly limit only. On Vercel the platform sets
 * x-vercel-forwarded-for and x-real-ip itself, so a visitor can't forge them. A
 * client-supplied x-forwarded-for is never read: its first entry is whatever the
 * client wrote. Requests with no trusted header share one bucket, which is strict,
 * not lenient.
 */
export function clientIp(headers: Headers, onVercel: boolean): string {
  if (!onVercel) return "local";
  const vercel = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  return vercel || headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * What the rate limiter stores instead of the IP: a salted SHA-256, cut to 16 hex
 * characters. It lives only in the limiter's hourly and daily windows, never in the
 * question log.
 */
export async function limiterKey(ip: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
