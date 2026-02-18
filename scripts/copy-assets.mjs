import fs from "fs";
import path from "path";

const source = path.resolve("src", "circuits");
const destination = path.resolve("dist", "circuits");

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

if (!fs.existsSync(source)) {
  throw new Error(`Missing source circuits directory: ${source}`);
}

copyRecursive(source, destination);
console.log(`Copied circuits: ${source} -> ${destination}`);
