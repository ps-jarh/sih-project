export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request) {
  const store = getStore();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = getSession(store, token);
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const institution = store.institutions.find((i) => i.id === session.institutionId);
  if (!institution) {
    return NextResponse.json({ error: "Institution not found." }, { status: 404 });
  }

  // NOTE: this endpoint only exists because this demo has nowhere else for an
  // institution to keep its key — a real deployment would never let a server
  // hand back private key material at all; the key would live in the
  // institution's own HSM/keystore and never touch this backend.
  return NextResponse.json({ privateKey: institution.privateKey, keyFingerprint: institution.keyFingerprint });
}
