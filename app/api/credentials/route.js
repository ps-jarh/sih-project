export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { seedDemoCredentials } from "@/lib/seedData";

export async function GET() {
  const store = getStore();
  seedDemoCredentials(store);

  const revocations = store.chain.filter((b) => b.type === "REVOCATION");
  const revokedMap = new Map(
    revocations.map((b) => [b.payload.credentialId, b.payload])
  );

  const credentials = store.chain
    .filter((b) => b.type === "ISSUANCE")
    .map((b) => {
      const institution = store.institutions.find((i) => i.id === b.signerInstitutionId);
      const revocation = revokedMap.get(b.payload.id) || null;
      return {
        ...b.payload,
        institutionName: institution ? institution.name : b.signerInstitutionId,
        institutionShortCode: institution ? institution.shortCode : b.signerInstitutionId,
        blockIndex: b.index,
        blockHash: b.hash,
        issuedAt: b.timestamp,
        revoked: Boolean(revocation),
        revocation,
      };
    })
    .sort((a, b) => b.blockIndex - a.blockIndex);

  return NextResponse.json({ credentials, total: credentials.length });
}
