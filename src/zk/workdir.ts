import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

function ensureWritable(dir: string): boolean {
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const probe = path.join(dir, ".write-test");
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

export function resolveWorkDir(ruleId: string): string {
  const randomId = crypto.randomBytes(12).toString("hex");

  const overrideRoot = process.env.ZK_WORK_DIR?.trim();
  if (overrideRoot) {
    const target = path.join(overrideRoot, `${ruleId}-${randomId}`);
    if (ensureWritable(target)) return target;
  }

  // Prefer a secure temp directory under the OS temp folder
  const tmpTarget = path.join(os.tmpdir(), `zk-eligibility-sdk-${randomId}`, ruleId);
  if (ensureWritable(tmpTarget)) return tmpTarget;

  // Fallback to a per-project hidden folder (less preferred)
  const cwdTarget = path.join(process.cwd(), ".zk", `${randomId}-${ruleId}`);
  if (ensureWritable(cwdTarget)) return cwdTarget;

  throw new Error("No writable work directory available for ZK generation");
}
