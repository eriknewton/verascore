"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorText, setErrorText] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorText(null);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorText(body.error ?? "Request failed");
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setErrorText("Network error");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="glass-card rounded-xl p-6 border border-[var(--color-border-light)]">
        <p className="text-foreground mb-2 font-medium">Check your inbox.</p>
        <p className="text-sm text-on-surface-variant">
          If an account exists for {email}, a sign-in link is on its way.
          The link expires in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-xs uppercase tracking-[0.2em] text-secondary mb-2 font-[var(--font-space-grotesk)]"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-surface px-4 py-3 text-foreground border border-[var(--color-border-light)] focus:outline-none focus:border-primary placeholder:text-muted"
          placeholder="you@example.com"
        />
      </div>

      {errorText && (
        <p className="text-sm text-red">{errorText}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-lg bg-primary text-on-primary px-4 py-3 font-medium hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Sending..." : "Send magic link"}
      </button>
    </form>
  );
}
