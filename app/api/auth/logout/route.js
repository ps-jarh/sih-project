export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { destroySession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request) {
  const store = getStore();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  destroySession(store, token);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
