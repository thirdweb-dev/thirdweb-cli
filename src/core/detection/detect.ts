import { info, logger } from "../helpers/logger";
import { ProjectType } from "../types/ProjectType";
import { Detector } from "./detector";
import FoundryDetector from "./foundry";
import HardhatDetector from "./hardhat";
import TruffleDetector from "./truffle";
import inquirer from "inquirer";

export default async function detect(path: string): Promise<ProjectType> {
  const detectors: Detector[] = [
    new HardhatDetector(),
    new FoundryDetector(), // TODO foundry does not output the correct metadata
    new TruffleDetector(),
    // new BrownieDetector(), TODO brownie does not support outputing metadata yet
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
    info(`Detected project type: ${possibleProjectTypes[0]}`);
    return possibleProjectTypes[0];
  }

  info(
    `Detected multiple possible build tools: ${possibleProjectTypes
      .map((s) => `"${s}"`)
      .join(", ")}`,
  );

  const question = "How would you like to compile your contracts";

  const answer = await inquirer.prompt({
    type: "list",
    choices: possibleProjectTypes,
    name: question,
  });

  return answer[question];
}
