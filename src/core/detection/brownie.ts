import { logger } from "../helpers/logger";
import { ProjectType } from "../types/ProjectType";
import { Detector } from "./detector";
import { existsSync } from "fs";

export default class BrownieDetector implements Detector {
  public projectType: ProjectType = "brownie";

  public matches(path: string): boolean {
    logger.debug("Checking if " + path + " is a Brownie project");
    return existsSync(path + "/brownie-config.yaml");
  }
}
