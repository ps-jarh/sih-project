import fs from "fs";
import path from "path";
import { sha256Hex, shortId } from "./crypto";
import { appendBlock } from "./hashchain";

function readDemoFile(fileName) {
  const filePath = path.join(process.cwd(), "public", "demo-files", fileName);
  return fs.readFileSync(filePath);
}

/**
 * Idempotent: safe to call at the top of every API route. Only actually
 * writes to the chain once per warm server instance.
 */
export function seedDemoCredentials(store) {
  if (store.seeded) return;

  const aliceFile = "stanford-bs-alice-chen.txt";
  const aliceBytes = readDemoFile(aliceFile);
  const alice = {
    id: shortId(),
    institutionId: "STAN",
    recipientName: "Alice Chen",
    recipientIdNumber: "SU-994021",
    recipientEmail: "alice.chen@alumni.stanford.edu",
    credentialType: "Bachelor Degree",
    title: "Bachelor of Science in Computer Science",
    major: "Systems & Autonomous Robotics",
    gradeHonors: "3.96 / 4.00 (High Honors)",
    issuanceDate: "2026-06-12",
    expiryDate: null,
    claims: { Honors: "Summa Cum Laude", "Department Seal": "Office of Academic Affairs" },
    documentHash: sha256Hex(aliceBytes),
    documentName: aliceFile,
  };
  appendBlock(store, { type: "ISSUANCE", payload: alice, institutionId: "STAN" });

  const davidFile = "mit-meng-david-miller.txt";
  const davidBytes = readDemoFile(davidFile);
  const david = {
    id: shortId(),
    institutionId: "MIT",
    recipientName: "David Miller",
    recipientIdNumber: "MIT-2026-3381",
    recipientEmail: "dmiller@alum.mit.edu",
    credentialType: "Master Degree",
    title: "Master of Engineering in Electrical Engineering & CS",
    major: "Distributed Systems",
    gradeHonors: "5.0 / 5.0",
    issuanceDate: "2026-05-29",
    expiryDate: null,
    claims: { "Department Seal": "EECS Registrar" },
    documentHash: sha256Hex(davidBytes),
    documentName: davidFile,
  };
  appendBlock(store, { type: "ISSUANCE", payload: david, institutionId: "MIT" });

  store.seeded = true;
}
