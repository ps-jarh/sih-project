export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore, publicInstitution } from "@/lib/store";
import { seedDemoCredentials } from "@/lib/seedData";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(request) {
  const store = getStore();
  seedDemoCredentials(store);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = getSession(store, token);
  if (!session) return NextResponse.json({ authenticated: false });

  const institution = store.institutions.find((i) => i.id === session.institutionId);
  if (!institution) return NextResponse.json({ authenticated: false });

  return NextResponse.json({ authenticated: true, institution: publicInstitution(institution) });
}
