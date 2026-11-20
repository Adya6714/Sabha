"use client";

import { FormEvent, useEffect, useState } from "react";

type AccountStatus = {
  openai: { set: boolean; hint: string | null };
  anthropic: { set: boolean; hint: string | null };
  gateway: { set: boolean; hint: string | null };
  spentInr: number;
  capInr: number;
  blocked: boolean;
  ready: boolean;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; account: AccountStatus; gatewayKey?: string };

export function KeysForm() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function reload() {
    const res = await fetch("/api/settings/keys");
    const data = await res.json();
    if (!res.ok) {
      setState({
        kind: "error",
        message: data.error || "Could not load keys.",
      });
      return;
    }
    setState({ kind: "ready", account: data });
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/keys")
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({
            kind: "error",
            message: data.error || "Could not load keys.",
          });
          return;
        }
        setState({ kind: "ready", account: data });
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            kind: "error",
            message: "Could not reach Sabha.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    if (!openaiKey.trim() && !anthropicKey.trim()) {
      setNotice("Paste at least one key. Leave a field blank to keep the saved one.");
      return;
    }
    setSaving(true);
    try {
      const body: { openaiKey?: string; anthropicKey?: string } = {};
      if (openaiKey.trim()) body.openaiKey = openaiKey.trim();
      if (anthropicKey.trim()) body.anthropicKey = anthropicKey.trim();
      const res = await fetch("/api/settings/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save keys.");
      setOpenaiKey("");
      setAnthropicKey("");
      setState({ kind: "ready", account: data });
      setNotice("Saved. Sabha will use these keys only for you.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save keys.");
    } finally {
      setSaving(false);
    }
  }

  async function removeKey(which: "openaiKey" | "anthropicKey") {
    setSaving(true);
    setNotice("");
    try {
      const res = await fetch("/api/settings/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [which]: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove the key.");
      setState((current) =>
        current.kind === "ready"
          ? { kind: "ready", account: data, gatewayKey: current.gatewayKey }
          : { kind: "ready", account: data },
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not remove the key.");
    } finally {
      setSaving(false);
    }
  }

  async function createGatewayKey() {
    setSaving(true);
    setNotice("");
    try {
      const res = await fetch("/api/settings/gateway-key", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create an agent key.");
      const { gatewayKey, ...account } = data;
      setState({ kind: "ready", account, gatewayKey });
      setNotice("Copy the agent key now. Sabha will not show it again.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not create an agent key.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (state.kind === "loading") {
    return <p className="mt-8 text-ink2">Loading your key status…</p>;
  }

  if (state.kind === "error") {
    return (
      <div className="mt-8 border border-maroon/30 bg-card px-5 py-4 text-ink2" role="alert">
        <p>{state.message}</p>
        <button type="button" className="btn-secondary mt-4" onClick={() => void reload()}>
          Try again
        </button>
      </div>
    );
  }

  const { account, gatewayKey } = state;
  const width = Math.min(100, (account.spentInr / account.capInr) * 100);

  return (
    <div className="mt-10 space-y-10">
      <section className="border border-line bg-card px-5 py-5">
        <p className="eyebrow">Combined spend</p>
        <p className="mt-3 font-serif text-3xl text-ink">
          ₹{account.spentInr.toFixed(2)}{" "}
          <span className="text-lg text-mute">of ₹{account.capInr}</span>
        </p>
        <div className="mt-4 h-2 bg-soft" aria-hidden>
          <div className="h-full bg-maroon" style={{ width: `${width}%` }} />
        </div>
        <p className="mt-3 text-sm text-ink2">
          OpenAI and Anthropic count together. The next call is refused once it
          would reach ₹{account.capInr}.
        </p>
        {account.blocked ? (
          <p className="mt-3 text-sm text-maroon" role="status">
            Model calls are blocked for these keys.
          </p>
        ) : null}
        {account.ready ? (
          <p className="mt-3 text-sm text-green" role="status">
            Both keys are saved. Council can use your OpenAI and Anthropic accounts.
          </p>
        ) : null}
      </section>

      <form onSubmit={onSave} className="space-y-5">
        <KeyField
          id="openai-key"
          label="OpenAI"
          hint={account.openai.hint}
          saved={account.openai.set}
          value={openaiKey}
          onChange={setOpenaiKey}
          onRemove={() => void removeKey("openaiKey")}
          disabled={saving}
        />
        <KeyField
          id="anthropic-key"
          label="Anthropic"
          hint={account.anthropic.hint}
          saved={account.anthropic.set}
          value={anthropicKey}
          onChange={setAnthropicKey}
          onRemove={() => void removeKey("anthropicKey")}
          disabled={saving}
        />
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save keys"}
        </button>
      </form>

      <section className="border-t border-line pt-8">
        <p className="eyebrow">Agent key</p>
        <h2 className="mt-3 font-serif text-2xl text-ink">Gateway</h2>
        <p className="mt-3 max-w-xl text-ink2">
          Agents send <span className="text-ink">Authorization: Bearer sabha_…</span>.
          This is the early-access login. It is not an OAuth grant, and it is
          not a model key.
        </p>
        {account.gateway.set ? (
          <p className="mt-3 text-sm text-ink2">
            Current key {account.gateway.hint}. Replacing it disconnects agents
            using the old one.
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink2">No agent key yet.</p>
        )}
        {gatewayKey ? (
          <label className="mt-4 block text-sm text-ink2">
            Shown once
            <input
              readOnly
              value={gatewayKey}
              className="mt-2 h-12 w-full border border-line bg-soft px-3 font-mono text-sm text-ink"
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
        ) : null}
        <button
          type="button"
          className="btn-secondary mt-4"
          disabled={saving}
          onClick={() => void createGatewayKey()}
        >
          {account.gateway.set ? "Replace agent key" : "Create agent key"}
        </button>
      </section>

      {notice ? (
        <p className="text-sm text-ink2" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

function KeyField({
  id,
  label,
  hint,
  saved,
  value,
  onChange,
  onRemove,
  disabled,
}: {
  id: string;
  label: string;
  hint: string | null;
  saved: boolean;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {saved ? (
        <p className="mt-1 text-sm text-mute">Saved {hint}. Paste a new key to replace it.</p>
      ) : (
        <p className="mt-1 text-sm text-mute">Required for this provider. Not shared with anyone else.</p>
      )}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          type="password"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 flex-1 border border-line bg-card px-3 text-ink outline-none focus:border-gold"
          placeholder={saved ? "Leave blank to keep the saved key" : "Paste your key"}
        />
        {saved ? (
          <button
            type="button"
            className="btn-secondary"
            disabled={disabled}
            onClick={onRemove}
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
