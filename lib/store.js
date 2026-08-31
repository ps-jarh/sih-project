import { generateInstitutionKeyPair, keyFingerprint } from "./crypto";
import { buildGenesisBlock } from "./hashchain";
import { hashPassword } from "./auth";

// Demo-only login passwords, seeded per institution so the Issuance Terminal
// has something to sign in with out of the box. Shown to the operator on the
// sign-in screen (components/InstitutionLogin.js) since these are synthetic
// accounts for a hackathon demo — never do this with real credentials.
const DEMO_PASSWORDS = {
  STAN: "stanford-2026",
  MIT: "mit-2026",
  IITKGP: "iitkgp-2026",
};

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
    passwordHash: hashPassword(DEMO_PASSWORDS[id] || `${id.toLowerCase()}-demo`),
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
    sessions: new Map(), // token -> { institutionId, expiresAt }
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
