"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "loading" | "done" | "error";

export function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("done");
      setMessage(data.message || "You're on the list.");
      setEmail("");
      localStorage.setItem("sabha-waitlist", "1");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not join right now.");
    }
  }

  if (status === "done") {
    return (
      <p
        className={`rounded-xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm text-green ${
          compact ? "" : "max-w-md"
        }`}
        role="status"
      >
        {message || "You're on the early access list. We'll write when a seat opens."}
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`flex w-full flex-col gap-3 sm:flex-row sm:items-center ${
        compact ? "max-w-xl" : "max-w-md"
      }`}
    >
      <label className="sr-only" htmlFor="waitlist-email">
        Email
      </label>
      <input
        id="waitlist-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="h-12 flex-1 rounded-full border border-line bg-card px-5 text-[15px] text-ink outline-none placeholder:text-mute focus:border-ink2"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-12 shrink-0 rounded-full bg-maroon px-6 text-[15px] font-medium text-bg transition-colors hover:bg-ink disabled:opacity-60"
      >
        {status === "loading" ? "Joining…" : "Get early access"}
      </button>
      {message && status === "error" ? (
        <p className="basis-full text-sm text-red" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
