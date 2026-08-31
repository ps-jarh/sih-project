import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getStore } from "@/lib/store";
import { seedDemoCredentials } from "@/lib/seedData";
import { appendBlock } from "@/lib/hashchain";
import { shortId, fingerprintFromPrivateKeyPem } from "@/lib/crypto";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

const REQUIRED_FIELDS = ["recipientName", "recipientIdNumber", "title"];

export async function POST(request) {
  const store = getStore();
  seedDemoCredentials(store);

  // Layer 1: must be signed in as an institution at all.
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = getSession(store, token);
  if (!session) {
    return NextResponse.json(
      { error: "Sign in as an institution before issuing credentials." },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const missing = REQUIRED_FIELDS.filter((field) => !body[field] || String(body[field]).trim() === "");
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required field(s): ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // The institution issuing is whoever is logged in — never trusted from the
  // request body, so a signed-in Stanford session can't issue as "MIT" just
  // by editing the payload.
  const institution = store.institutions.find((i) => i.id === session.institutionId);
  if (!institution) {
    return NextResponse.json({ error: "Unknown issuing institution." }, { status: 400 });
  }

  // Layer 2: the private key itself must be presented and must actually be
  // this institution's key. We never fall back to a server-cached key here —
  // if this check fails, nothing gets signed.
  const submittedKey = body.signingPrivateKey;
  const submittedFingerprint = typeof submittedKey === "string" ? fingerprintFromPrivateKeyPem(submittedKey) : null;
  if (!submittedFingerprint || submittedFingerprint !== institution.keyFingerprint) {
    return NextResponse.json(
      { error: "That private key does not match this institution's registered signing key." },
      { status: 401 }
    );
  }

  const credential = {
    id: shortId(),
    institutionId: institution.id,
    recipientName: body.recipientName.trim(),
    recipientIdNumber: body.recipientIdNumber.trim(),
    recipientEmail: body.recipientEmail ? body.recipientEmail.trim() : null,
    credentialType: body.credentialType || "Bachelor Degree",
    title: body.title.trim(),
    major: body.major ? body.major.trim() : null,
    gradeHonors: body.gradeHonors ? body.gradeHonors.trim() : null,
    issuanceDate: body.issuanceDate || new Date().toISOString().slice(0, 10),
    expiryDate: body.expiryDate || null,
    claims: body.claims && typeof body.claims === "object" ? body.claims : {},
    documentHash: body.documentHash || null,
    documentName: body.documentName || null,
  };

  const block = appendBlock(store, {
    type: "ISSUANCE",
    payload: credential,
    institutionId: institution.id,
    signingKeyPem: submittedKey,
  });

  const verifyUrl = `${request.nextUrl.origin}/?verify=${encodeURIComponent(credential.id)}&hash=${encodeURIComponent(block.hash)}`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 340,
    color: { dark: "#0a0e17", light: "#ffffff" },
  });

  return NextResponse.json({
    credential,
    block: {
      index: block.index,
      hash: block.hash,
      prevHash: block.prevHash,
      timestamp: block.timestamp,
      signature: block.signature,
    },
    institution: { id: institution.id, name: institution.name, keyFingerprint: institution.keyFingerprint },
    verifyUrl,
    qrDataUrl,
  });
}
