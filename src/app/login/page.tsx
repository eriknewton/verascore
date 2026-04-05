import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Verascore with a magic link.",
};

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

const errorMessages: Record<string, string> = {
  "missing-token": "The sign-in link was malformed. Request a new one.",
  "invalid-token": "This sign-in link is not valid.",
  "token-used": "This link has already been used. Request a new one.",
  "token-expired": "This link has expired. Request a new one.",
  "auth-unavailable": "Authentication is temporarily unavailable.",
};

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const errorMessage = sp.error ? errorMessages[sp.error] ?? null : null;

  return (
    <div className="max-w-md mx-auto px-6 sm:px-8 py-16 sm:py-24 pt-32">
      <div className="mb-8">
        <span className="font-[var(--font-space-grotesk)] text-secondary uppercase tracking-[0.3em] text-xs mb-2 block">
          Sign In
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
          Verascore Fleet
        </h1>
        <p className="text-on-surface-variant">
          Enter your email. We&apos;ll send you a magic link to sign in. No
          passwords, no accounts to manage.
        </p>
      </div>

      {errorMessage && (
        <div className="glass-card rounded-xl p-4 mb-6 border border-[var(--color-border-light)]">
          <p className="text-sm text-red">{errorMessage}</p>
        </div>
      )}

      <LoginForm />
    </div>
  );
}
