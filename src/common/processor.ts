import { THIRDWEB_URL } from "../constants/urls";
import build from "../core/builder/build";
import detect from "../core/detection/detect";
import { info, logger, spinner, warn } from "../core/helpers/logger";
import { IpfsStorage } from "../core/storage/ipfs-storage";
import path from "path";

export async function processProject(options: any) {
  // TODO: allow overriding the default storage
  const storage = new IpfsStorage();

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

  const projectType = await detect(projectPath);
  if (projectType === "unknown") {
    warn("Unable to detect project type, falling back to solc compilation");
  }

  const compiledResult = await build(projectPath, projectType);

  if (compiledResult.contracts.length == 0) {
    logger.error(
      "No deployable contract detected. Run with the '--debug' option to see what contracts were skipped and why.",
    );
    process.exit(1);
  }
  info(
    `Processing contracts: ${compiledResult.contracts
      .map((c) => `"${c.name}"`)
      .join(", ")}`,
  );

  if (options.dryRun) {
    info("Dry run, skipping deployment");
    process.exit(0);
  }

  const bytecodes = compiledResult.contracts.map((c) => c.bytecode);
  const loader = spinner("Uploading contract data...");
  try {
    // Upload build output metadatas (need to be single uploads)
    const metadataURIs = await Promise.all(
      compiledResult.contracts.map(async (c) => {
        logger.debug(`Uploading ${c.name}...`);
        const hash = await storage.uploadSingle(c.metadata);
        return `ipfs://${hash}`;
      }),
    );

    // Upload batch all bytecodes
    const { metadataUris: bytecodeURIs } = await storage.uploadBatch(bytecodes);

    const combinedContents = compiledResult.contracts.map((c, i) => {
      return {
        name: c.name,
        metadataUri: metadataURIs[i],
        bytecodeUri: bytecodeURIs[i],
      };
    });
    const { metadataUris: combinedURIs } = await storage.uploadMetadataBatch(
      combinedContents,
    );
    loader.succeed("Upload successful");

    return combinedURIs;
  } catch (e) {
    loader.fail("Error uploading metadata");
    throw e;
  }
}

export function getUrl(hashes: string[], path: string) {
  const url = new URL(THIRDWEB_URL + "/contracts/" + path);
  for (let hash of hashes) {
    url.searchParams.append("ipfs", hash.replace("ipfs://", ""));
  }
  return url;
}
