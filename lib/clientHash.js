/**
 * All hashing for verification happens in the browser — the file's bytes
 * never leave the device. Only the resulting digest is sent to the server
 * to be looked up against the ledger.
 */
export async function sha256HexOfBuffer(buffer) {
  const digest = await window.crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256HexOfFile(file) {
  const buffer = await file.arrayBuffer();
  return sha256HexOfBuffer(buffer);
}
