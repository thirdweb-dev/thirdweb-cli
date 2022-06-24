import { error, logger } from "../core/helpers/logger";
import { execSync } from "child_process";

export function checkNodeVersion() {
  const nodeVersion = execSync("node --version");
  logger.debug("Running Node version:", nodeVersion.toString());
  const majorVersion = parseInt(
    nodeVersion.toString().replace("v", "").split(".")[0],
  );
  if (majorVersion < 12 || majorVersion > 16) {
    error(
      `You are running Node ${majorVersion}, but thirdweb-cli requires Node 12.x to 16.x.`,
    );
    process.exit(1);
  }
}
