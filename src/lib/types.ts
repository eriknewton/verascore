export type SovereigntyLevel = "active" | "degraded" | "inactive" | "unverified";
export type TrustTier = "verified-sovereign" | "verified-degraded" | "self-attested" | "unverified";
export type ClaimStatus = "claimed" | "unclaimed";

export interface SovereigntyLayer {
  name: string;
  label: string;
  score: number;
  status: SovereigntyLevel;
  description: string;
}

export interface ReputationDimension {
  name: string;
  score: number;
  maxScore: number;
  source: "cryptographic" | "operator-attested" | "self-reported" | "computed";
  description: string;
}

export interface HandshakeRecord {
  id: string;
  counterpartyId: string;
  counterpartyName: string;
  timestamp: string;
  expiresAt: string;
  trustTier: TrustTier;
  verified: boolean;
  attestationId: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  did: string;
  keyType: string;
  platform: string;
  description: string;
  claimStatus: ClaimStatus;
  createdAt: string;
  lastActive: string;
  overallScore: number;
  trustTier: TrustTier;
  sovereigntyLayers: SovereigntyLayer[];
  reputationDimensions: ReputationDimension[];
  handshakes: HandshakeRecord[];
  badges: Badge[];
  capabilities: string[];
  avatarUrl?: string;
}

export interface Attestation {
  id: string;
  initiatorId: string;
  initiatorName: string;
  responderId: string;
  responderName: string;
  timestamp: string;
  expiresAt: string;
  trustTier: TrustTier;
  verified: boolean;
  initiatorPosture: SovereigntyLayer[];
  responderPosture: SovereigntyLayer[];
  signature: string;
  protocol: string;
  protocolVersion: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
