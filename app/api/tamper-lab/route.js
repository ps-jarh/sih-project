import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { seedDemoCredentials } from "@/lib/seedData";
import { computeBlockHash } from "@/lib/hashchain";
import { verifyHex } from "@/lib/crypto";

export async function POST(request) {
  const store = getStore();
  seedDemoCredentials(store);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const { blockIndex, editedPayload } = body;
  const original = store.chain.find((b) => b.index === blockIndex);
  if (!original) {
    return NextResponse.json({ error: "Block not found." }, { status: 404 });
  }

  // Nothing here is ever written back to the store — this only computes what
  // WOULD happen, to demonstrate tamper-evidence without actually corrupting
  // the live ledger other users are verifying against.
  const recomputedHash = computeBlockHash({
    index: original.index,
    timestamp: original.timestamp,
    type: original.type,
    payload: editedPayload,
    prevHash: original.prevHash,
  });

  const matchesOriginal = recomputedHash === original.hash;

  const institution = store.institutions.find((i) => i.id === original.signerInstitutionId);
  const signatureStillValid = institution
    ? verifyHex(recomputedHash, original.signature, institution.publicKey)
    : false;

  const nextBlock = store.chain.find((b) => b.index === blockIndex + 1) || null;
  const affectedBlockCount = matchesOriginal ? 0 : store.chain.length - (blockIndex + 1);

  return NextResponse.json({
    originalHash: original.hash,
    recomputedHash,
    matchesOriginal,
    signatureStillValid,
    cascadeBrokenFromIndex: matchesOriginal ? null : nextBlock?.index ?? null,
    affectedBlockCount,
    chainLength: store.chain.length,
  });
}
