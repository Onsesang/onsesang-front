// Main backend (RTX 3060 server behind Tailscale Funnel). Spec v1.2 · 개요.
// Override with NEXT_PUBLIC_API_BASE_URL.
export const BACKEND_ORIGIN = "https://onsesang-pc-server.tail065d88.ts.net";
// Fallback backend (A100). Its user DB is copied from the main server every 10 minutes, so a
// login usually carries over; anything newer than the last copy does not.
// Override with NEXT_PUBLIC_API_FALLBACK_URL ("" turns the fallback off).
export const FALLBACK_ORIGIN = "https://onsesang-a100.tail065d88.ts.net";
