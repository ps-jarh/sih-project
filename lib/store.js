import { generateInstitutionKeyPair, keyFingerprint } from "./crypto";
import { buildGenesisBlock } from "./hashchain";

// NOTE ON PERSISTENCE
// ---------------------------------------------------------------------------
// This is intentionally an in-memory "single node" — it matches the scoped
// hash-chain demo (no real multi-node permissioned network for the internal
// round). Data lives for as long as the Node process stays warm and resets
// on redeploy/cold start. The hash-chain + signature logic in hashchain.js
// and crypto.js doesn't care where `store.chain` lives, so swapping this
// file for a real database (Postgres table, Mongo collection, etc.) later —
// for a version that needs to survive restarts — does not require touching
// any verification logic.
// ---------------------------------------------------------------------------

const GLOBAL_KEY = "__TRUSTCHAIN_LEDGER_STORE__";

function createInstitution(id, name, shortCode) {
  const { publicKey, privateKey } = generateInstitutionKeyPair();
  return {
    id,
    name,
    shortCode,
    publicKey,
    privateKey,
    keyFingerprint: keyFingerprint(publicKey),
    curve: "secp256k1",
  };
}

function createStore() {
  return {
    institutions: [
      createInstitution("STAN", "Stanford University", "STAN"),
      createInstitution("MIT", "Massachusetts Institute of Technology", "MIT"),
      createInstitution("IITKGP", "IIT Kharagpur", "IIT-KGP"),
    ],
    chain: [buildGenesisBlock()],
    seeded: false,
  };
}

export function getStore() {
  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = createStore();
  }
  return globalThis[GLOBAL_KEY];
}

export function publicInstitution(institution) {
  const { id, name, shortCode, keyFingerprint: fp, curve } = institution;
  return { id, name, shortCode, keyFingerprint: fp, curve };
}
