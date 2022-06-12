#!/usr/bin/env node
import { processProject } from "../common/processor";
import { cliVersion, pkg } from "../constants/urls";
import { info, logger } from "../core/helpers/logger";
import chalk from "chalk";
import { Command } from "commander";
import open from "open";
import updateNotifier from "update-notifier";

const main = async () => {
  const program = new Command();

  //yes this has to look like this, eliminates whitespace
  console.info(`
  $$\\     $$\\       $$\\                 $$\\                         $$\\       
  $$ |    $$ |      \\__|                $$ |                        $$ |      
$$$$$$\\   $$$$$$$\\  $$\\  $$$$$$\\   $$$$$$$ |$$\\  $$\\  $$\\  $$$$$$\\  $$$$$$$\\  
\\_$$  _|  $$  __$$\\ $$ |$$  __$$\\ $$  __$$ |$$ | $$ | $$ |$$  __$$\\ $$  __$$\\ 
  $$ |    $$ |  $$ |$$ |$$ |  \\__|$$ /  $$ |$$ | $$ | $$ |$$$$$$$$ |$$ |  $$ |
  $$ |$$\\ $$ |  $$ |$$ |$$ |      $$ |  $$ |$$ | $$ | $$ |$$   ____|$$ |  $$ |
  \\$$$$  |$$ |  $$ |$$ |$$ |      \\$$$$$$$ |\\$$$$$\\$$$$  |\\$$$$$$$\\ $$$$$$$  |
   \\____/ \\__|  \\__|\\__|\\__|       \\_______| \\_____\\____/  \\_______|\\_______/ `);
  console.info(`\n 💎 thirdweb-cli v${cliVersion} 💎\n`);
  updateNotifier({
    pkg,
    shouldNotifyInNpmScript: true,
    //check every time while we're still building the CLI
    updateCheckInterval: 0,
  }).notify();

  program
    .name("thirdweb-cli")
    .description("Official thirdweb command line interface")
    .version(cliVersion, "-v, --version", "output the current version");

  program
    .command("publish")
    .description(
      "Compile & publish contracts, makes them available for easy deployment from the dashboard.",
    )
    .option("-p, --path <project-path>", "path to project", ".")
    .option("--dry-run", "dry run (skip actually publishing)")
    .option("-d, --debug", "show debug logs")
    .option("--ci", "Continuous Integration mode")
    .action(async (options) => {
      const url = await processProject(options, "publish");
      if (url) {
        info(`Open this link to publish your contracts:`);
        logger.info(chalk.blueBright(url));
        open(url.toString());
      }
    });

  program
    .command("deploy")
    .description(
      "Compile & deploy contracts through your thirdweb dashboard, without dealing with private keys.",
    )
    .option("-p, --path <project-path>", "path to project", ".")
    .option("--dry-run", "dry run (skip actually publishing)")
    .option("-c, --clean", "clean artifacts before compiling")
    .option("-d, --debug", "show debug logs")
    .option("--ci", "Continuous Integration mode")
    .action(async (options) => {
      const url = await processProject(options, "deploy");
      if (url) {
        info(`Open this link to deploy your contracts:`);
        logger.info(chalk.blueBright(url));
        open(url.toString());
      }
    });

  program
    .command("install-ci")
    .description(
      "Set up continuious integration. This adds a github action to deploy the project on pull requets and pushes to branches. Publishes on main branch push",
    )
    .action(async (options) => {
      await processProject(options, "install-ci");
    });
  await program.parseAsync();
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
