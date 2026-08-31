export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore, publicInstitution } from "@/lib/store";
import { seedDemoCredentials } from "@/lib/seedData";
import { verifyPassword, createSession, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export async function POST(request) {
  const store = getStore();
  seedDemoCredentials(store);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const { institutionId, password } = body;
  const institution = store.institutions.find((i) => i.id === institutionId);

  if (!institution || !verifyPassword(password, institution.passwordHash)) {
    // Deliberately identical message whether the institution or the password
    // was wrong, so a login form can't be used to enumerate valid IDs.
    return NextResponse.json({ error: "Incorrect institution or password." }, { status: 401 });
  }

  const token = createSession(store, institution.id);
  const res = NextResponse.json({ institution: publicInstitution(institution) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
