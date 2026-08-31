import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { seedDemoCredentials } from "@/lib/seedData";
import { verifyChain, verifyBlockSignature } from "@/lib/hashchain";

const HEX_64 = /^[a-f0-9]{64}$/i;

/**
 * Accepts a raw document hash, a credential ID, or a scanned QR verify URL
 * and normalizes it to { documentHash, credentialId }. Either field may be
 * null — the lookup below tries whichever it has.
 */
function normalizeQuery(raw) {
  const value = String(raw || "").trim();

  // A scanned QR code decodes to a verify URL like /?verify=CRED-XXXX&hash=<64hex>
  try {
    const url = new URL(value);
    const id = url.searchParams.get("verify");
    const hash = url.searchParams.get("hash");
    if (id || hash) return { documentHash: hash, credentialId: id };
  } catch {
    // not a URL — fall through
  }

  if (HEX_64.test(value)) return { documentHash: value.toLowerCase(), credentialId: null };
  if (value) return { documentHash: null, credentialId: value.toUpperCase() };
  return { documentHash: null, credentialId: null };
}

export async function POST(request) {
  const store = getStore();
  seedDemoCredentials(store);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const { documentHash, credentialId } = normalizeQuery(body.query);

  if (!documentHash && !credentialId) {
    return NextResponse.json({ error: "Provide a document, an ID, or a hash to verify." }, { status: 400 });
  }

  const issuanceBlocks = store.chain.filter((b) => b.type === "ISSUANCE");

  // Track *how* a match was found. This matters because "document hash
  // match" should only ever be a pass/fail check when the caller actually
  // submitted a file's hash to compare against the credential's recorded
  // document hash — looking a credential up by its ID or by the ledger's own
  // block hash is a valid lookup path too, but isn't a document comparison.
  let block = null;
  let matchedVia = null; // "id" | "documentHash" | "blockHash"

  if (credentialId) {
    block = issuanceBlocks.find((b) => b.payload.id === credentialId);
    if (block) matchedVia = "id";
  }
  if (!block && documentHash) {
    block = issuanceBlocks.find((b) => b.payload.documentHash === documentHash);
    if (block) matchedVia = "documentHash";
  }
  if (!block && documentHash) {
    block = issuanceBlocks.find((b) => b.hash === documentHash);
    if (block) matchedVia = "blockHash";
  }

  if (!block) {
    return NextResponse.json({
      found: false,
      message:
        "No matching credential in the ledger. Either this document was never issued through TrustChain, or its content has been altered — even a single byte change produces a completely different SHA-256 digest.",
    });
  }

  const chainIntegrity = verifyChain(store.chain);
  const signatureValid = verifyBlockSignature(block, store.institutions);
  const institution = store.institutions.find((i) => i.id === block.signerInstitutionId);

  const revocationBlock = store.chain.find(
    (b) => b.type === "REVOCATION" && b.payload.credentialId === block.payload.id
  );

  // Only a genuine "your file's hash equals the recorded document hash"
  // lookup counts as a document-hash check. ID lookups and ledger-hash
  // lookups didn't compare a document at all, so that check is N/A for them.
  const documentHashMatch = matchedVia === "documentHash" ? true : null;

  let overallStatus = "VALID";
  if (!chainIntegrity.valid && block.index >= chainIntegrity.brokenAtIndex) overallStatus = "TAMPERED";
  else if (revocationBlock) overallStatus = "REVOKED";
  else if (!signatureValid) overallStatus = "TAMPERED";
  else if (documentHashMatch === false) overallStatus = "TAMPERED";

  return NextResponse.json({
    found: true,
    overallStatus,
    credential: block.payload,
    institution: institution
      ? { id: institution.id, name: institution.name, keyFingerprint: institution.keyFingerprint }
      : null,
    block: { index: block.index, hash: block.hash, prevHash: block.prevHash, timestamp: block.timestamp },
    checks: {
      signatureValid,
      chainIntact: chainIntegrity.valid || block.index < chainIntegrity.brokenAtIndex,
      documentHashMatch,
      revoked: Boolean(revocationBlock),
      revocationReason: revocationBlock ? revocationBlock.payload.reason : null,
      revokedAt: revocationBlock ? revocationBlock.timestamp : null,
    },
  });
}
