import axios from "axios";

// empty in production: the browser calls its own site and Next.js forwards /api to the server
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "";

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
});

// the public base URL used for links shown to users (like the webhook URL)
export function publicApiOrigin() {
  return API_ORIGIN || (typeof window !== "undefined" ? window.location.origin : "");
}

export function getErrorMessage(err: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || fallback;
  }
  return fallback;
}

export type User = { id: string; email: string; name: string };

export type WorkflowSummary = {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  runs?: { status: string; startedAt: string }[];
};