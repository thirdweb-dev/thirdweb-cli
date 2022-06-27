import { logger, spinner, warn, info } from "../core/helpers/logger";
import { ContractPayload } from "../core/interfaces/ContractPayload";
import detect from "../core/detection/detect";
import build from "../core/builder/build";
import chalk from "chalk";
import path from "path";
import { ContractFeatures } from "../core/interfaces/ContractFeatures";

const { MultiSelect } = require('enquirer');

export async function detectFeatures(options: any) {
  logger.setSettings({
    minLevel: options.debug ? "debug" : "info",
  });

  let projectPath = process.cwd();
  if (options.path) {
    logger.debug("Overriding project path to " + options.path);

    const resolvedPath = (options.path as string).startsWith("/")
      ? options.path
      : path.resolve(`${projectPath}/${options.path}`);
    projectPath = resolvedPath;
  }

  logger.debug("Processing project at path " + projectPath);

  const projectType = await detect(projectPath, options);
  if (projectType === "unknown") {
    warn("Unable to detect project type, falling back to solc compilation");
  }

  let compiledResult;
  const compileLoader = spinner("Compiling project...");
  try {
    compiledResult = await build(projectPath, projectType);
  } catch (e) {
    compileLoader.fail("Compilation failed");
    logger.error(e);
    process.exit(1);
  }
  compileLoader.succeed("Compilation successful");

  let selectedContracts: ContractPayload[] = [];
  if (compiledResult.contracts.length == 1) {
    selectedContracts = [compiledResult.contracts[0]];
    info(
      `Processing contract: ${chalk.blueBright(
        selectedContracts.map((c) => `"${c.name}"`).join(", "),
      )}`,
    );
  } else {
    const choices = compiledResult.contracts.map((c) => ({
      name: c.name,
      value: c,
    }));
    const prompt = createContractsPrompt(choices);
    const selection: Record<string, ContractPayload> = await prompt.run();
    selectedContracts = Object.keys(selection).map((key) => selection[key]);
  }

  let contractsWithFeatures: ContractFeatures[] = [];

  // TODO: Process contract features

  // TODO: Log contracts with detected features and suggested features
}

function createContractsPrompt(
  choices: { name: string; value: ContractPayload }[],
) {
  return new MultiSelect({
    name: "value",
    message: "Choose which contracts to run detection on",
    hint: "Use <return> to submit",
    choices,
    result(names: string) {
      return this.map(names);
    },
    onSubmit() {
      if (this.selected.length === 0) {
        this.enable(this.focused);
      }
    },
    indicator(state: any, choice: any) {
      if (choice.enabled) {
        return this.styles.primary(this.symbols.hexagon.on);
      }
      return this.symbols.hexagon.off;
    },
    styles: {
      primary: chalk.blueBright,
      get em() {
        return this.primary;
      },
    },
  });
}