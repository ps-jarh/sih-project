import crypto from "crypto";

/**
 * All hashing in the ledger funnels through this one function so that the
 * server (issuance / verification) and any client-side recomputation stay
 * byte-for-byte compatible.
 */
export function sha256Hex(input) {
  let data;
  if (Buffer.isBuffer(input)) data = input;
  else if (typeof input === "string") data = input;
  else data = JSON.stringify(input);
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Deterministic JSON stringify: object keys are sorted recursively so the
 * same logical record always produces the same string (and therefore the
 * same hash), regardless of key insertion order.
 */
export function canonicalize(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  const body = keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(",");
  return `{${body}}`;
}

/** Generates a fresh ECDSA (secp256k1) keypair standing in for an institution's signing key. */
export function generateInstitutionKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "secp256k1",
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey };
}

export function signHex(message, privateKeyPem) {
  const signer = crypto.createSign("SHA256");
  signer.update(message);
  signer.end();
  return signer.sign(privateKeyPem, "hex");
}

export function verifyHex(message, signatureHex, publicKeyPem) {
  if (!signatureHex) return false;
  try {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(message);
    verifier.end();
    return verifier.verify(publicKeyPem, signatureHex, "hex");
  } catch {
    return false;
  }
}

export function keyFingerprint(publicKeyPem) {
  return sha256Hex(publicKeyPem).slice(0, 40);
}

/**
 * Given a *private* key PEM someone has submitted, derives its matching
 * public key and returns that public key's fingerprint — or null if the PEM
 * doesn't parse as a valid EC private key at all. This is how the issuance
 * and revocation routes confirm a submitted key genuinely belongs to the
 * institution (its derived fingerprint must equal the one on record) without
 * ever needing to see or store a copy of "the correct answer" to compare
 * against — only the institution's already-public public key.
 */
export function fingerprintFromPrivateKeyPem(privateKeyPem) {
  try {
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    const publicKey = crypto.createPublicKey(privateKey);
    const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
    return keyFingerprint(publicKeyPem);
  } catch {
    return null;
  }
}

export function shortId(prefix = "CRED") {
  return `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}
