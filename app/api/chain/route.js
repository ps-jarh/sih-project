export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { seedDemoCredentials } from "@/lib/seedData";
import { verifyChain, verifyBlockSignature } from "@/lib/hashchain";

export async function GET() {
  const store = getStore();
  seedDemoCredentials(store);

  const integrity = verifyChain(store.chain);

  const chain = store.chain.map((block) => ({
    ...block,
    signatureValid: verifyBlockSignature(block, store.institutions),
  }));

  const revokedCount = store.chain.filter((b) => b.type === "REVOCATION").length;
  const issuedCount = store.chain.filter((b) => b.type === "ISSUANCE").length;

  return NextResponse.json({
    chain,
    integrity,
    height: store.chain.length - 1,
    metrics: {
      totalBlocksMined: store.chain.length,
      totalValidCredentials: issuedCount - revokedCount,
      totalIssued: issuedCount,
      totalRevoked: revokedCount,
      revocationRate: issuedCount === 0 ? 0 : Math.round((revokedCount / issuedCount) * 100),
    },
  });
}
