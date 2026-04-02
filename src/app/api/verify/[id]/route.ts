import { getAttestation } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const attestation = await getAttestation(id);

  if (!attestation) {
    return Response.json({ error: "Attestation not found" }, { status: 404 });
  }

  const isExpired = new Date(attestation.expiresAt) < new Date();

  return Response.json({
    ...attestation,
    valid: attestation.verified && !isExpired,
    expired: isExpired,
  });
}
