export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore, publicInstitution } from "@/lib/store";
import { seedDemoCredentials } from "@/lib/seedData";

export async function GET() {
  const store = getStore();
  seedDemoCredentials(store);
  return NextResponse.json({
    institutions: store.institutions.map(publicInstitution),
  });
}
