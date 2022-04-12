import { Logger } from "tslog";

export const logger = new Logger({
  minLevel: "info",
  displayFilePath: "hidden",
  displayFunctionName: false,
  displayLoggerName: false,
});
