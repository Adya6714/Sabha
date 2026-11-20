export type WaitlistEntry = {
  email: string;
  source?: string;
  createdAt: string;
};

const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return emailOk.test(email) && email.length <= 254;
}

/** In-memory store for local/dev. Production should set WAITLIST_WEBHOOK_URL. */
const memory = new Set<string>();

export function rememberLocally(email: string) {
  memory.add(email);
  return memory.size;
}

export async function forwardWaitlist(entry: WaitlistEntry) {
  const webhook = process.env.WAITLIST_WEBHOOK_URL;
  if (!webhook) return { forwarded: false as const };

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });

  if (!res.ok) {
    throw new Error(`Waitlist webhook failed (${res.status})`);
  }

  return { forwarded: true as const };
}
