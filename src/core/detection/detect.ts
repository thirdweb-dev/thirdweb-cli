import { ProjectType } from "../types/ProjectType";
import { Detector } from "./detector";
import HardhatDetector from "./hardhat";

export default async function detect(path: string): Promise<ProjectType> {
  const detectors: Detector[] = [new HardhatDetector()];

  for (const detector of detectors) {
    if (await detector.matches(path)) {
      return detector.projectType;
    }
  }

  return "unknown";
}
