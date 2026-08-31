import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { seedDemoCredentials } from "@/lib/seedData";
import { appendBlock } from "@/lib/hashchain";
import { fingerprintFromPrivateKeyPem } from "@/lib/crypto";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request) {
  const store = getStore();
  seedDemoCredentials(store);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = getSession(store, token);
  if (!session) {
    return NextResponse.json(
      { error: "Sign in as the issuing institution before revoking credentials." },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const { credentialId, reason, signingPrivateKey } = body;
  if (!credentialId || !reason) {
    return NextResponse.json({ error: "credentialId and reason are both required." }, { status: 400 });
  }

  const issuanceBlock = store.chain.find(
    (b) => b.type === "ISSUANCE" && b.payload.id === credentialId
  );
  if (!issuanceBlock) {
    return NextResponse.json({ error: "No credential with that ID exists on the ledger." }, { status: 404 });
  }

  // institutionId comes from the session, not the request body — closes the
  // hole where a client could previously just claim to be any institution.
  if (issuanceBlock.signerInstitutionId !== session.institutionId) {
    return NextResponse.json(
      { error: "Only the original issuing institution may revoke this credential." },
      { status: 403 }
    );
  }

  const institution = store.institutions.find((i) => i.id === session.institutionId);
  const submittedFingerprint =
    typeof signingPrivateKey === "string" ? fingerprintFromPrivateKeyPem(signingPrivateKey) : null;
  if (!institution || !submittedFingerprint || submittedFingerprint !== institution.keyFingerprint) {
    return NextResponse.json(
      { error: "That private key does not match this institution's registered signing key." },
      { status: 401 }
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
    institutionId: session.institutionId,
    signingKeyPem: signingPrivateKey,
  });

  return NextResponse.json({ block });
}
