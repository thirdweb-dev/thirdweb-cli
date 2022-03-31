import { existsSync } from "fs";
import { Logger } from "tslog";
import { ProjectType } from "../types/ProjectType";
import { Detector } from "./detector";

export default class HardhatDetector implements Detector {
  public projectType: ProjectType = "hardhat";

  private logger = new Logger({
    name: "HardhatDetector",
  });

  constructor() {}

  public async matches(path: string): Promise<boolean> {
    this.logger.info("Checking if " + path + " is a Hardhat project");
    return await existsSync(path + "/hardhat.config.js");
  }
}
