import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { seedDemoCredentials } from "@/lib/seedData";
import { appendBlock } from "@/lib/hashchain";

export async function POST(request) {
  const store = getStore();
  seedDemoCredentials(store);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const { credentialId, reason, institutionId } = body;
  if (!credentialId || !reason || !institutionId) {
    return NextResponse.json(
      { error: "credentialId, reason, and institutionId are all required." },
      { status: 400 }
    );
  }

  const issuanceBlock = store.chain.find(
    (b) => b.type === "ISSUANCE" && b.payload.id === credentialId
  );
  if (!issuanceBlock) {
    return NextResponse.json({ error: "No credential with that ID exists on the ledger." }, { status: 404 });
  }

  if (issuanceBlock.signerInstitutionId !== institutionId) {
    return NextResponse.json(
      { error: "Only the original issuing institution may revoke this credential." },
      { status: 403 }
    );
  }

  const alreadyRevoked = store.chain.some(
    (b) => b.type === "REVOCATION" && b.payload.credentialId === credentialId
  );
  if (alreadyRevoked) {
    return NextResponse.json({ error: "This credential has already been revoked." }, { status: 409 });
  }

  const block = appendBlock(store, {
    type: "REVOCATION",
    payload: { credentialId, reason: reason.trim(), revokedAt: new Date().toISOString() },
    institutionId,
  });

  return NextResponse.json({ block });
}
