import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getStore } from "@/lib/store";
import { seedDemoCredentials } from "@/lib/seedData";
import { appendBlock } from "@/lib/hashchain";
import { shortId } from "@/lib/crypto";

const REQUIRED_FIELDS = ["institutionId", "recipientName", "recipientIdNumber", "title"];

export async function POST(request) {
  const store = getStore();
  seedDemoCredentials(store);

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

  const institution = store.institutions.find((i) => i.id === body.institutionId);
  if (!institution) {
    return NextResponse.json({ error: "Unknown issuing institution." }, { status: 400 });
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
