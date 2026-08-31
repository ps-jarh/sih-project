# TrustChain Ledger

Full-stack MVP for **PS-03: Blockchain-Based Tamper-Proof Academic Credential Verification**.

A single-node hash-chain (not a full permissioned blockchain network — see *Scoping decision*
below) that lets institutions issue digitally signed, tamper-evident credentials, and lets
anyone verify them instantly by file, ID, hash, or QR code — without contacting the issuer.

## Stack

- **Next.js 14 (App Router)** — one project, frontend pages + backend API routes
- **Node `crypto`** — SHA-256 hashing, ECDSA (secp256k1) signing/verification
- **`qrcode`** — generates the verification QR on issuance
- **`jsqr`** — decodes an uploaded QR image entirely in the browser
- **Tailwind CSS** — styling
- No external database — see *Scoping decision*

## Running it

```bash
npm install
npm run dev
# open http://localhost:3000
```

For a production-style run (closer to how Vercel serves it):

```bash
npm run build
npm run start
```

Two demo credentials (Stanford BS — Alice Chen, MIT MEng — David Miller) are seeded
automatically on first request, by hashing the real files in `public/demo-files/`.

## How the hash-chain works

Every event on the ledger (an issuance, or a revocation) becomes a **block**:

```
block.hash = SHA256( index | timestamp | type | payload | prevHash )
```

- `prevHash` is the previous block's hash, so each block cryptographically points at the one
  before it — the "chain" in hash-chain.
- The resulting hash is then **signed** with the issuing institution's ECDSA private key
  (`lib/crypto.js`, `lib/hashchain.js`).
- `verifyChain()` walks the whole chain on every read, recomputing every hash and checking
  every `prevHash` pointer. The first mismatch is reported as the break point.

Change a single field on any past record and its hash no longer recomputes to the stored
value — the signature over that hash stops verifying, and every block after it points at a
hash that no longer means anything. That's demonstrated live in **Tamper Lab**
(`/tamper-lab` page, `POST /api/tamper-lab`): pick an issued credential, edit a field, and see
the hash / signature / cascade break immediately. Nothing there writes back to the real
ledger — it only computes what *would* happen.

Document authenticity is a separate, complementary check: on issuance, the browser computes
the SHA-256 of the attached file (`lib/clientHash.js`, Web Crypto API) and it's stored on the
credential record. A verifier who drops that same file in later gets the same hash back — a
single altered byte produces a completely different digest, so a tampered document simply
won't be found on the ledger (try the "Tampered File" one-click test button on the Public
Verifier page).

## Authentication & signing

The Issuance Terminal (`/issue`) is now gated behind two independent layers, both enforced
server-side — neither can be bypassed from the client:

1. **Sign-in.** An operator picks their institution and enters its password
   (`POST /api/auth/login`, `lib/auth.js`). Passwords are hashed with `scrypt` + a random salt
   (no plaintext, no external deps) and compared with `crypto.timingSafeEqual`. On success the
   server issues a random session token, stored server-side in `store.sessions` (same
   in-memory store as the ledger — consistent with the single-node scoping) and set as an
   **httpOnly** cookie, so it's never readable from client-side JS. Every mutating route
   (`/api/credentials/issue`, `/api/revoke`, `/api/institutions/reveal-key`) re-derives
   *which* institution is asking from that session — not from anything the client sends —
   so a Stanford session can't issue on MIT's behalf just by editing a request body.

2. **Private-key authorization, at the moment of signing.** Being logged in is not enough to
   sign something. `POST /api/credentials/issue` and `POST /api/revoke` both additionally
   require the institution's actual EC private key (PEM) in the request body. The server
   derives that key's *public* counterpart and checks its fingerprint against the
   institution's registered public key (`fingerprintFromPrivateKeyPem` in `lib/crypto.js`) —
   if it doesn't match, nothing gets signed, regardless of who's logged in. The block is then
   signed with the *submitted* key material, not a server-cached copy (`signingKeyPem` in
   `lib/hashchain.js`'s `appendBlock`).

   Since this demo has no real client-side keystore, a "Cryptographic Keys & Authority" panel
   (`components/KeyVault.js`, `POST /api/institutions/reveal-key`) lets a signed-in operator
   fetch their institution's key to paste into the signing field. **This is a demo-only
   convenience, called out as such in the UI** — a real deployment would never let a server
   hand back private key material at all; the key would live in the institution's own
   HSM/keystore and the server would only ever hold the public key.

Demo login passwords (also shown on the sign-in screen): `STAN` → `stanford-2026`,
`MIT` → `mit-2026`, `IITKGP` → `iitkgp-2026`.



Revoking a credential never deletes or edits its original block — it **appends** a new,
signed `REVOCATION` block that references the credential's ID (`POST /api/revoke`). This
keeps the revocation itself just as tamper-evident as the issuance, and only the original
issuing institution is allowed to revoke (`app/api/revoke/route.js`). `GET /api/verify`
checks for a revocation block on every lookup.

## Scoping decision: single node, in-memory store

Per the internal-round timeline, this intentionally does **not** stand up a real permissioned
multi-node blockchain network (Hyperledger Fabric, etc.) — that's a multi-week infra project
on its own. The hash-chain + signature scheme above gives the same tamper-evidence property
(any edit is detectable) on a single node, which is what the brief scopes for and what most
SIH teams actually ship in a 36-hour round.

The ledger (`lib/store.js`) lives in a Node `globalThis` — in memory, for as long as the
process stays warm. That's a deliberate simplification, not an oversight:
`lib/hashchain.js` and `lib/crypto.js` don't know or care where `store.chain` is persisted,
so swapping `lib/store.js` for a real table (Postgres, Mongo, etc.) for a version that needs
to survive restarts doesn't require touching any of the verification logic. If you deploy
this to Vercel as-is, treat it as a live demo: data resets on a cold start / redeploy.

## Project structure

```
lib/
  crypto.js       SHA-256, ECDSA keypair/sign/verify, canonical JSON stringify
  hashchain.js     block construction, chain verification, signature check
  store.js         in-memory institutions + chain (swap this for a real DB later)
  seedData.js      seeds 2 demo credentials from public/demo-files/ on first request
  clientHash.js    browser-side SHA-256 (Web Crypto API)
  clientQr.js      browser-side QR decode (jsQR)

app/
  page.js                        Public Verifier (file / ID-hash / QR tabs)
  issue/page.js                  Issuance Terminal (login gate, then issue + revoke sub-tabs)
  chain/page.js                  Hash Chain visualizer
  tamper-lab/page.js             Tamper Lab
  gallery/page.js                Credential Gallery
  api/
    auth/login/route.js           POST — institution sign-in, sets httpOnly session cookie
    auth/logout/route.js          POST — clears the session
    auth/session/route.js         GET  — whether the current cookie is a valid session
    institutions/route.js         GET  — issuing authorities
    institutions/reveal-key/route.js  POST — demo-only: fetch your institution's private key
    credentials/route.js          GET  — full gallery, live revocation status
    credentials/issue/route.js    POST — session + private-key gated: sign + anchor + QR
    verify/route.js               POST — the core validator
    chain/route.js                 GET  — full ledger + live integrity check
    revoke/route.js               POST — session + private-key gated: append a revocation block
    tamper-lab/route.js           POST — non-destructive tamper simulation

components/       shared UI (nav, cards, forms, result panels)
public/demo-files/  the two seeded certificate files (plain text stand-ins for PDFs)
```

## What's out of scope for this MVP

Called out explicitly so it doesn't read as an oversight: batch/Merkle-tree issuance,
multi-signature institutional approval, a real persistent database, real multi-node
consensus, camera-based live QR scanning (QR lookup here is upload-an-image, decoded
client-side — swapping in a camera stream is a small addition on top of the same
`decodeQRFromFile` logic in `lib/clientQr.js`), and real institutional key custody (see
*Authentication & signing* above — the "reveal my key" panel is explicitly a demo
stand-in for an HSM/keystore this project doesn't implement).
