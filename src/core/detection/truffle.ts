import { logger } from "../helpers/logger";
import { ProjectType } from "../types/ProjectType";
import { Detector } from "./detector";
import { existsSync } from "fs";

export default class TruffleDetector implements Detector {
  public projectType: ProjectType = "truffle" as const;

  public matches(path: string): boolean {
    logger.debug("Checking if " + path + " is a Truffle project");
    return existsSync(path + "/truffle-config.js");
  }
}
