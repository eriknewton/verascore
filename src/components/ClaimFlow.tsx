"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ClaimFlowProps {
  agentId: string;
  agentName: string;
  currentStatus: "claimed" | "unclaimed";
}

type Step = "initial" | "challenge" | "signing" | "verify" | "success" | "error";

interface ChallengeData {
  challengeId: string;
  nonce: string;
  agentId: string;
  expiresIn: number;
}

export function ClaimFlow({ agentId, agentName, currentStatus }: ClaimFlowProps) {
  const [step, setStep] = useState<Step>("initial");
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [signature, setSignature] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleGenerateChallenge = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/claim/challenge?agentId=${encodeURIComponent(agentId)}`
      );

      if (!response.ok) {
        const errorData = await response.json() as Record<string, unknown>;
        throw new Error((errorData.error as string) || "Failed to generate challenge");
      }

      const data = await response.json() as ChallengeData;
      setChallenge(data);
      setStep("challenge");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNonce = () => {
    if (challenge) {
      navigator.clipboard.writeText(challenge.nonce);
    }
  };

  const handleVerifySignature = async () => {
    if (!challenge || !signature || !publicKey) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/claim/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          signature,
          publicKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as Record<string, unknown>;
        throw new Error((errorData.error as string) || "Verification failed");
      }

      const data = await response.json() as Record<string, unknown>;
      setSuccessMessage(`Agent claimed successfully at ${data.claimedAt}`);
      setStep("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === "claimed") {
    return (
      <div className="p-5 rounded-xl bg-secondary/5 border border-secondary/20">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="w-5 h-5 text-secondary"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          <h3 className="text-sm font-semibold text-secondary">Agent Claimed</h3>
        </div>
        <p className="text-xs text-on-surface-variant">
          This agent has been successfully claimed and verified.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {step === "initial" && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-primary/20 to-transparent">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Claim {agentName}
          </h3>
          <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
            Prove you control this agent by signing a cryptographic challenge with
            its Ed25519 private key. This verifies your identity and unlocks full
            reputation features.
          </p>
          <button
            onClick={handleGenerateChallenge}
            disabled={loading}
            className={cn(
              "w-full py-2 px-3 bg-primary text-on-primary font-bold rounded-lg text-sm transition-all",
              loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-primary-container active:scale-95"
            )}
          >
            {loading ? "Generating challenge..." : "Generate Challenge"}
          </button>
        </div>
      )}

      {step === "challenge" && challenge && (
        <div className="p-5 rounded-xl bg-surface-high space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Challenge Generated
          </h3>

          <div>
            <label className="text-xs text-muted mb-2 block font-[var(--font-space-grotesk)] uppercase tracking-wider">
              Challenge ID (for reference)
            </label>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-surface rounded text-xs font-mono text-foreground break-all">
                {challenge.challengeId}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(challenge.challengeId);
                }}
                className="px-3 py-2 bg-surface-high hover:bg-surface-bright rounded text-xs transition-colors"
                title="Copy challenge ID"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted mb-2 block font-[var(--font-space-grotesk)] uppercase tracking-wider">
              Nonce to Sign
            </label>
            <p className="text-xs text-on-surface-variant mb-2">
              Sign this value with your Ed25519 private key:
            </p>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-surface rounded text-xs font-mono text-foreground break-all">
                {challenge.nonce}
              </code>
              <button
                onClick={handleCopyNonce}
                className="px-3 py-2 bg-surface-high hover:bg-surface-bright rounded text-xs transition-colors"
                title="Copy nonce"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="p-3 bg-surface rounded border border-tertiary/20">
            <p className="text-xs text-on-surface-variant">
              <strong className="text-tertiary">Instructions:</strong> Sign this nonce
              with your agent's Ed25519 private key. Paste the base64url-encoded
              signature below along with your public key.
            </p>
          </div>

          <button
            onClick={() => setStep("signing")}
            className="w-full py-2 px-3 bg-primary text-on-primary font-bold rounded-lg text-sm transition-all hover:bg-primary-container active:scale-95"
          >
            I've Signed the Nonce
          </button>
        </div>
      )}

      {step === "signing" && challenge && (
        <div className="p-5 rounded-xl bg-surface-high space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Verify Signature</h3>

          <div>
            <label
              htmlFor="signature"
              className="text-xs text-muted mb-2 block font-[var(--font-space-grotesk)] uppercase tracking-wider"
            >
              Base64url Signature
            </label>
            <textarea
              id="signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Paste your Ed25519 signature in base64url format"
              className="w-full px-3 py-2 bg-surface rounded text-xs font-mono text-foreground placeholder-muted resize-none border border-outline-variant focus:outline-none focus:border-primary h-24"
            />
          </div>

          <div>
            <label
              htmlFor="publicKey"
              className="text-xs text-muted mb-2 block font-[var(--font-space-grotesk)] uppercase tracking-wider"
            >
              Base64url Public Key (32 bytes)
            </label>
            <textarea
              id="publicKey"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="Paste your Ed25519 public key in base64url format"
              className="w-full px-3 py-2 bg-surface rounded text-xs font-mono text-foreground placeholder-muted resize-none border border-outline-variant focus:outline-none focus:border-primary h-20"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep("challenge")}
              disabled={loading}
              className="flex-1 py-2 px-3 bg-surface-high hover:bg-surface-bright rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleVerifySignature}
              disabled={loading || !signature || !publicKey}
              className={cn(
                "flex-1 py-2 px-3 bg-primary text-on-primary font-bold rounded-lg text-sm transition-all",
                loading || !signature || !publicKey
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-primary-container active:scale-95"
              )}
            >
              {loading ? "Verifying..." : "Verify & Claim"}
            </button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="p-5 rounded-xl bg-secondary/10 border border-secondary/20 space-y-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-secondary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            <h3 className="text-sm font-semibold text-secondary">
              Claim Successful
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant">{successMessage}</p>
          <p className="text-xs text-on-surface-variant">
            Your agent is now verified and claimed. You'll see updated reputation
            features on your profile.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-3 bg-secondary text-on-secondary font-bold rounded-lg text-sm transition-all hover:bg-secondary-container active:scale-95"
          >
            Refresh Profile
          </button>
        </div>
      )}

      {step === "error" && (
        <div className="p-5 rounded-xl bg-error/10 border border-error/20 space-y-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-error"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <h3 className="text-sm font-semibold text-error">Error</h3>
          </div>
          <p className="text-xs text-on-surface-variant">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStep("initial");
                setChallenge(null);
                setSignature("");
                setPublicKey("");
                setError("");
              }}
              className="flex-1 py-2 px-3 bg-error/20 text-error font-bold rounded-lg text-sm transition-all hover:bg-error/30 active:scale-95"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setStep("challenge");
              }}
              disabled={!challenge}
              className="flex-1 py-2 px-3 bg-surface-high hover:bg-surface-bright rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
