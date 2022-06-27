import { FeatureWithEnabled } from "@thirdweb-dev/sdk/dist/src/constants/contract-features";
import { logger, spinner, warn, info } from "../core/helpers/logger";
import { ContractPayload } from "../core/interfaces/ContractPayload";
import { ContractFeatures, Feature } from "../core/interfaces/ContractFeatures";
import { ALWAYS_SUGGESTED } from "../constants/features";
import { detectFeatures } from "@thirdweb-dev/sdk";
import detect from "../core/detection/detect";
import build from "../core/builder/build";
import chalk from "chalk";
import path from "path";
import ora from "ora";
import { createContractsPrompt } from "../core/helpers/selector";

const { MultiSelect } = require('enquirer');

export async function detectExtensions(options: any) {
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
    const prompt = createContractsPrompt(choices, "Choose which contracts to run detection on");
    const selection: Record<string, ContractPayload> = await prompt.run();
    selectedContracts = Object.keys(selection).map((key) => selection[key]);
  }

  let contractsWithFeatures: ContractFeatures[] = selectedContracts.map((contract) => {
    const abi: Parameters<typeof detectFeatures>[0] = JSON.parse(contract.metadata)["output"]["abi"];
    const features = extractFeatures(detectFeatures(abi));

    const enabledFeatures: Feature[] = features.enabledFeatures.map((feature) => ({
      name: feature.name,
      reference: `https://portal.thirdweb.com/contracts/${feature.docLinks.contracts}`,
    }))
    const suggestedFeatures: Feature[] = features.suggestedFeatures.map((feature) => ({
      name: feature.name,
      reference: `https://portal.thirdweb.com/contracts/${feature.docLinks.contracts}`,
    }))

    return {
      name: contract.name,
      enabledFeatures,
      suggestedFeatures,
    }
  });

  contractsWithFeatures.map((contractWithFeatures) => {
    logger.info(``);
    ora(`Detected the following features on contract ${chalk.blueBright(contractWithFeatures.name)}`).stopAndPersist({ symbol: '🔎' });
    contractWithFeatures.enabledFeatures.map((feature) => {
      info(`${chalk.green(feature.name)} - ${chalk.dim(chalk.gray(feature.reference))}`);
    });
    ora(`You may be interested in implementing the following additional features:`).info();
    contractWithFeatures.suggestedFeatures.map((feature) => {
      logger.info(`${chalk.dim(chalk.gray(`-`))} ${chalk.gray(feature.name)} - ${chalk.dim(chalk.gray(feature.reference))}`);
    });
  })
}

function extractFeatures(
  input: ReturnType<typeof detectFeatures>,
  enabledFeatures: FeatureWithEnabled[] = [],
  suggestedFeatures: FeatureWithEnabled[] = [],
  parent = "__ROOT__",
) {
  if (!input) {
    return {
      enabledFeatures,
      suggestedFeatures,
    };
  }
  for (const featureKey in input) {
    const feature = input[featureKey];
    // if feature is enabled, then add it to enabledFeatures
    if (feature.enabled) {
      enabledFeatures.push(feature);
    }
    // otherwise if it is disabled, but it's parent is enabled or suggested, then add it to suggestedFeatures
    else if (
      enabledFeatures.findIndex((f) => f.name === parent) > -1 ||
      ALWAYS_SUGGESTED.includes(feature.name)
    ) {
      suggestedFeatures.push(feature);
    }
    // recurse
    extractFeatures(
      feature.features,
      enabledFeatures,
      suggestedFeatures,
      feature.name,
    );
  }

  return {
    enabledFeatures,
    suggestedFeatures,
  };
}