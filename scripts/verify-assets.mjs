import fs from "fs";
import path from "path";

const requiredFiles = [
  path.resolve("dist", "circuits", "manifest.json"),
];

const manifest = path.resolve("dist", "circuits", "manifest.json");
if (fs.existsSync(manifest)) {
  const parsed = JSON.parse(fs.readFileSync(manifest, "utf-8"));
  for (const ruleId of Object.keys(parsed)) {
    const circom = parsed[ruleId]?.circom;
    const dir = typeof circom === "string" ? circom.split("/")[0] : null;
    if (typeof dir === "string" && dir.length > 0) {
      const lower = dir.toLowerCase();
      requiredFiles.push(path.resolve("dist", "circuits", dir, `${lower}_final.zkey`));
      requiredFiles.push(path.resolve("dist", "circuits", dir, "verification_key.json"));
      requiredFiles.push(path.resolve("dist", "circuits", dir, `${lower}_js`, `${lower}.wasm`));
    }
  }
}

const missing = requiredFiles.filter((file) => !fs.existsSync(file));
if (missing.length > 0) {
  throw new Error(`Missing required circuit assets:\n${missing.join("\n")}`);
}

console.log(`Verified ${requiredFiles.length} circuit assets.`);
