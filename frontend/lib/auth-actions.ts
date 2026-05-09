"use server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://backend:3001";

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

export type RegisterResult =
  | { ok: true; user: { id: number; email: string; name: string | null } }
  | { ok: false; error: string };

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const data = (await res.json().catch(() => ({}))) as {
      user?: { id: number; email: string; name: string | null };
      message?: string | string[];
    };

    if (!res.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message ?? `Register failed (HTTP ${res.status})`;
      return { ok: false, error: message };
    }

    if (!data.user) {
      return { ok: false, error: "Unexpected response from server" };
    }

    return { ok: true, user: data.user };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}
