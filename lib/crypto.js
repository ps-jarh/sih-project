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

export function shortId(prefix = "CRED") {
  return `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}
