import { spawn } from "child_process";
import fs from "fs";
import path from "path";

function resolveCommand(command: string): { cmd: string; argsPrefix: string[] } {
  if (command !== "snarkjs") {
    return { cmd: command, argsPrefix: [] };
  }

  // Avoid `npx` in serverless. Execute snarkjs CLI directly from dependency.
  const mainPath = require.resolve("snarkjs");
  const candidates = [
    path.join(path.dirname(mainPath), "cli.cjs"),
    path.join(path.dirname(mainPath), "cli.js"),
    path.join(path.dirname(path.dirname(mainPath)), "cli.js"),
  ];
  const cliPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!cliPath) {
    throw new Error(`snarkjs CLI not found. Checked: ${candidates.join(", ")}`);
  }
  return {
    cmd: process.execPath,
    argsPrefix: [cliPath],
  };
}

export function runCmd(
  command: string,
  args: string[],
  cwd?: string,
  timeoutMs: number = 60000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const { cmd, argsPrefix } = resolveCommand(command);
    const finalCwd = cwd ?? process.cwd();

    const child = spawn(cmd, [...argsPrefix, ...args], {
      cwd: path.resolve(finalCwd),
      stdio: "inherit",
      windowsHide: true,
    });

    const killTimer = setTimeout(() => {
      try {
        child.kill();
      } catch (e) {
        // ignore
      }
      reject(new Error(`Command timed out after ${timeoutMs}ms: ${command} ${args.join(" ")}`));
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(killTimer);
      reject(error);
    });

    child.on("exit", (code, signal) => {
      clearTimeout(killTimer);
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `Command failed: ${command} ${args.join(" ")} (code=${String(code)}, signal=${String(signal)})`
        )
      );
    });
  });
}
