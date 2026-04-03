import { supabase } from "../Supabase";

/**
 * client.ts
 *
 * Central API client for all communication with the Flask backend.
 * Every request automatically attaches the current user's Supabase
 * session token so the backend can verify identity and satisfy RLS.
 */

/** Base URL for the Flask API — set via VITE_API_URL in .env.local */
export const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/**
 * apiFetch
 *
 * Wrapper around the native fetch API that:
 *  1. Retrieves the current Supabase session token
 *  2. Attaches it as a Bearer token in the Authorization header
 *  3. Handles 204 No Content responses (e.g. DELETE)
 *  4. Throws a readable error if the response is not OK
 *
 * @param path    — API endpoint path (e.g. "/tasks", "/tasks/123/comments")
 * @param options — standard fetch RequestInit options (method, body, etc.)
 * @returns parsed JSON response cast to type T
 * @throws if the user is not authenticated or the server returns an error
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Get the current anonymous session token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`, // Forwarded to Flask for identity verification
    },
  });

  // 204 No Content — returned by DELETE endpoints, no body to parse
  if (res.status === 204) return undefined as T;

  const json = await res.json();

  // Throw a generic user-facing message — caught in App.tsx and shown in the error banner
  if (!res.ok) throw new Error("Something went wrong. Please try again.");

  return json as T;
}