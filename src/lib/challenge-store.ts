// Shared challenge store for claim flow
// Accessible from both challenge generation and verification routes

export interface Challenge {
  nonce: string;
  agentId: string;
  createdAt: number;
}

const challengeStore = new Map<string, Challenge>();

const CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export function getChallengeStore(): Map<string, Challenge> {
  return challengeStore;
}

export function cleanupExpiredChallenges(): void {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const [challengeId, challenge] of challengeStore.entries()) {
    if (now - challenge.createdAt > CHALLENGE_TTL) {
      toDelete.push(challengeId);
    }
  }

  for (const challengeId of toDelete) {
    challengeStore.delete(challengeId);
  }
}

export function storeChallenge(
  challengeId: string,
  nonce: string,
  agentId: string
): void {
  challengeStore.set(challengeId, {
    nonce,
    agentId,
    createdAt: Date.now(),
  });
}

export function getChallenge(challengeId: string): Challenge | undefined {
  return challengeStore.get(challengeId);
}

export function deleteChallenge(challengeId: string): void {
  challengeStore.delete(challengeId);
}
