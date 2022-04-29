import { THIRDWEB_URL } from "../constants/urls";
import build from "../core/builder/build";
import detect from "../core/detection/detect";
import { logger } from "../core/helpers/logger";
import { Contract } from "../core/interfaces/Contract";
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

  logger.debug("Publishing project at path " + projectPath);

  const projectType = await detect(projectPath);
  if (projectType === "unknown") {
    logger.warn(
      "Unable to detect project type, falling back to solc compilation",
    );
  }

  const compiledResult = await build(projectPath, projectType, options.clean);

  if (compiledResult.contracts.length == 0) {
    logger.error(
      "No thirdweb contract detected. Extend ThirdwebContract to publish your own contracts.",
    );
    process.exit(1);
  }
  logger.info(
    "Detected thirdweb contracts:",
    compiledResult.contracts.map((c) => `"${c.name}"`).join(", "),
  );

  logger.info("Project compiled successfully");

  if (options.dryRun) {
    logger.info("Dry run, skipping publish");
    process.exit(0);
  }

  logger.info("Uploading contract data...");
  const bytecodes = compiledResult.contracts.map((c) => c.bytecode);
  const abis = compiledResult.contracts.map((c) => JSON.stringify(c.abi));

  const { metadataUris: bytecodeURIs } = await storage.uploadBatch(bytecodes);
  const { metadataUris: abiURIs } = await storage.uploadBatch(abis);

  const contractMetadatas: string[] = [];
  for (let i = 0; i < compiledResult.contracts.length; i++) {
    const bytecode = bytecodeURIs[i];
    const abi = abiURIs[i];
    const name = compiledResult.contracts[i].name;
    contractMetadatas.push(
      JSON.stringify({
        name: name,
        bytecodeUri: bytecode,
        abiUri: abi,
      } as Contract),
    );
  }
  // TODO progress bar
  const { metadataUris: hashes } = await storage.uploadBatch(contractMetadatas);

  logger.info("Upload successful");
  return hashes;
}

export function getUrl(hashes: string[], path: string) {
  const url = new URL(THIRDWEB_URL + "/contracts/" + path);
  for (let hash of hashes) {
    url.searchParams.append("ipfs", hash.replace("ipfs://", ""));
  }
  return url;
}
