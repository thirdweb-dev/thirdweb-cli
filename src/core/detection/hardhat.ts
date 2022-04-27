import { existsSync } from "fs";
import { logger } from "../helpers/logger";
import { ProjectType } from "../types/ProjectType";
import { Detector } from "./detector";

export default class HardhatDetector implements Detector {
  public projectType: ProjectType = "hardhat";

  public async matches(path: string): Promise<boolean> {
    logger.debug("Checking if " + path + " is a Hardhat project");
    return (
      existsSync(path + "/hardhat.config.js") ||
      existsSync(path + "/hardhat.config.ts")
    );
  }
}
