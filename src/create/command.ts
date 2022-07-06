#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
import prompts from "prompts";
import path from "path";
import chalk from "chalk";
import { validateNpmName } from "./helpers/validate-pkg";
import { createApp, DownloadError } from "./helpers/create-app";
import { getPkgManager } from "./helpers/get-pkg-manager";

let projectPath: string = "";
let framework: string = "";
let language: string = "";
/* let createType: string = "app"; */

export async function twCreate(options: any) {
/*   if (options.app) {
    createType = "app";
  } */

  if (typeof projectPath === "string") {
    projectPath = projectPath.trim();
  }

  if (options.typescript) {
    language = "typescript";
  }

  if (options.javascript) {
    language = "javascript";
  }

  if (options.next) {
    framework = "next";
  }

  if (options.cra) {
    framework = "cra";
  }

  if (options.framework) {
    framework = options.framework;
  }

  if (!projectPath) {
    const res = await prompts({
      type: "text",
      name: "path",
      message: "What is your project named?",
      initial: options.template || "thirdweb-app",
      validate: (name) => {
        const validation = validateNpmName(path.basename(path.resolve(name)));
        if (validation.valid) {
          return true;
        }
        return "Invalid project name: " + validation.problems![0];
      },
    });

    if (typeof res.path === "string") {
      projectPath = res.path.trim();
    }
  }

  if (!projectPath) {
    console.log(
      "\nPlease specify the project directory:\n" +
      `  ${chalk.cyan("npx thirdweb create")} ${chalk.green(
        "<project-directory>",
      )}\n` +
      "For example:\n" +
      `  ${chalk.cyan("npx thirdweb create")} ${chalk.green(
        "my-thirdweb-app",
      )}\n\n` +
      `Run ${chalk.cyan("npx thirdweb --help")} to see all options.`,
    );
    process.exit(1);
  }

  if (!options.template) {
    if (!framework) {
      const res = await prompts({
        type: "select",
        name: "framework",
        message: "What framework do you want to use?",
        choices: [
          { title: "Next.js", value: "next" },
          { title: "Create React App", value: "cra" },
        ],
      });

      if (typeof res.framework === "string") {
        framework = res.framework.trim();
      }
    }

    if (!language) {
      const res = await prompts({
        type: "select",
        name: "language",
        message: "What language do you want to use?",
        choices: [
          { title: "JavaScript", value: "javascript" },
          { title: "TypeScript", value: "typescript" },
        ],
      });

      if (typeof res.language === "string") {
        language = res.language.trim();
      }
    }

    if (!framework) {
      console.log("Please specify a framework");
      process.exit(1);
    }

    if (!language) {
      console.log("Please specify a language");
      process.exit(1);
    }
  }

  const resolvedProjectPath = path.resolve(projectPath);
  const projectName = path.basename(resolvedProjectPath);

  const { valid, problems } = validateNpmName(projectName);
  if (!valid) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${projectName}"`,
      )} because of npm naming restrictions:`,
    );

    problems!.forEach((p) => console.error(`    ${chalk.red.bold("*")} ${p}`));
    process.exit(1);
  }

  if (options.template === true) {
    console.error(
      "Please provide an template name, otherwise remove the template option. Checkout some templates you can use here: https://github.com/thirdweb-example/",
    );
    process.exit(1);
  }

  const packageManager = !!options.useNpm
    ? "npm"
    : !!options.usePnpm
      ? "pnpm"
      : getPkgManager();

  const template = typeof options.template === "string" && options.template.trim();
  try {
    await createApp({
      appPath: resolvedProjectPath,
      packageManager,
      framework,
      language,
      template,
    });
  } catch (reason) {
    if (!(reason instanceof DownloadError)) {
      throw reason;
    }
  }
}