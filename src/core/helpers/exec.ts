import { exec } from "child_process";

export async function execute(
  command: string,
  options = { log: false, cwd: process.cwd() },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((done, failed) => {
    exec(command, { ...options }, (err, stdout, stderr) => {
      if (err) {
        failed(err);
        return;
      }

      done({ stdout, stderr });
    });
  });
}
