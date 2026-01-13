import { execSync } from "child_process";

export function runCmd(
  command: string,
  args: string[],
  cwd?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      let cmd = command;
      let cmdArgs = args;

      if (command === "snarkjs") {
        cmd = "npx";
        cmdArgs = [command, ...args];
      }

      // Properly quote args with spaces
      const quotedArgs = cmdArgs.map(arg => {
        if (arg.includes(" ")) {
          return `"${arg}"`;
        }
        return arg;
      }).join(" ");

      const fullCommand = `${cmd} ${quotedArgs}`;
      
      execSync(fullCommand, { 
        cwd,
        stdio: "inherit"
      });

      resolve();
    } catch (err: any) {
      reject(err);
    }
  });
}
