import { ProjectType } from "../types/ProjectType";
import { Detector } from "./detector";
import FoundryDetector from "./foundry";
import HardhatDetector from "./hardhat";
import inquirer from "inquirer";
import { logger } from "../helpers/logger";
import TruffleDetector from "./truffle";

export default async function detect(path: string): Promise<ProjectType> {
  const detectors: Detector[] = [
    new HardhatDetector(),
    new FoundryDetector(),
    new TruffleDetector(),
  ];

  const possibleProjectTypes = detectors
    .filter((detector) => detector.matches(path))
    .map((detector) => detector.projectType);

  //if there is no project returned at all then just return unknown}
  if (!possibleProjectTypes.length) {
    return "unknown";
  }
  //if there is only one possible option just return it
  if (possibleProjectTypes.length === 1) {
    logger.info("Detected project type:", possibleProjectTypes[0]);
    return possibleProjectTypes[0];
  }

  logger.info(
    "Detected multiple possible build tools:",
    possibleProjectTypes.map((s) => `"${s}"`).join(", ")
  );

  const question = "How would you like to compile your contracts";

  const answer = await inquirer.prompt({
    type: "list",
    choices: possibleProjectTypes,
    name: question,
  });

  return answer[question];
}
