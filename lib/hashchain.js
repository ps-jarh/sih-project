import { canonicalize, sha256Hex, signHex, verifyHex } from "./crypto";

export const GENESIS_PREV_HASH = "0".repeat(64);

/**
 * A block's hash covers everything that must never silently change:
 * its position, when it was written, what kind of event it is, the
 * event data itself, and the hash it points back to. Change any single
 * byte of any of these and the hash will not recompute to the same value.
 */
export function computeBlockHash({ index, timestamp, type, payload, prevHash }) {
  const canonical = canonicalize({ index, timestamp, type, payload, prevHash });
  return sha256Hex(canonical);
}

export function buildGenesisBlock() {
  const index = 0;
  const timestamp = new Date(0).toISOString();
  const type = "GENESIS";
  const payload = { message: "TrustChain Ledger genesis block — single-node hash-chain demo" };
  const prevHash = GENESIS_PREV_HASH;
  const hash = computeBlockHash({ index, timestamp, type, payload, prevHash });
  return { index, type, timestamp, payload, prevHash, hash, signature: null, signerInstitutionId: null };
}

/**
 * Appends a new event (ISSUANCE or REVOCATION) to the chain, hashing it
 * against the previous block and, when an institution is provided, signing
 * the resulting hash with that institution's private key.
 */
export function appendBlock(store, { type, payload, institutionId = null }) {
  const last = store.chain[store.chain.length - 1];
  const index = last.index + 1;
  const timestamp = new Date().toISOString();
  const prevHash = last.hash;
  const hash = computeBlockHash({ index, timestamp, type, payload, prevHash });

  let signature = null;
  if (institutionId) {
    const institution = store.institutions.find((i) => i.id === institutionId);
    if (institution) signature = signHex(hash, institution.privateKey);
  }

  const block = { index, type, timestamp, payload, prevHash, hash, signature, signerInstitutionId: institutionId };
  store.chain.push(block);
  return block;
}

/**
 * Walks the whole chain from genesis, recomputing every hash and checking
 * every prevHash pointer. The first block where either check fails is
 * reported as the break point — everything from there onward is
 * unverifiable, exactly as in a real blockchain.
 */
export function verifyChain(chain) {
  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];
    const expectedPrevHash = i === 0 ? GENESIS_PREV_HASH : chain[i - 1].hash;

    if (block.prevHash !== expectedPrevHash) {
      return { valid: false, brokenAtIndex: block.index, reason: "PREV_HASH_MISMATCH" };
    }

    const recomputed = computeBlockHash({
      index: block.index,
      timestamp: block.timestamp,
      type: block.type,
      payload: block.payload,
      prevHash: block.prevHash,
    });

    if (recomputed !== block.hash) {
      return { valid: false, brokenAtIndex: block.index, reason: "HASH_MISMATCH" };
    }
  }
  return { valid: true, brokenAtIndex: null, reason: null };
}

export function verifyBlockSignature(block, institutions) {
  if (!block.signerInstitutionId || !block.signature) return false;
  const institution = institutions.find((i) => i.id === block.signerInstitutionId);
  if (!institution) return false;
  return verifyHex(block.hash, block.signature, institution.publicKey);
}
