#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
import { validateNpmName } from "../helpers/validate-pkg";
import prompts from "prompts";
import path from "path";
import chalk from "chalk";
import { createApp, DownloadError } from "./create-app";
import { getPkgManager } from "../helpers/get-pkg-manager";

let projectPath: string = "";
let framework: string = "";
let language: string = "";

export async function twCreate(options: any) {
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

  if (options.vite) {
    framework = "vite";
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
      initial: (options.example && options.example) || "thirdweb-app",
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
      `  ${chalk.cyan(options.name())} ${chalk.green(
        "<project-directory>",
      )}\n` +
      "For example:\n" +
      `  ${chalk.cyan(options.name())} ${chalk.green(
        "my-thirdweb-app",
      )}\n\n` +
      `Run ${chalk.cyan(`${options.name()} --help`)} to see all options.`,
    );
    process.exit(1);
  }

  if (!options.example) {
    if (!framework) {
      const res = await prompts({
        type: "select",
        name: "framework",
        message: "What framework do you want to use?",
        choices: [
          { title: "Next.js", value: "next" },
          { title: "Create React App", value: "cra" },
          { title: "Vite", value: "vite" },
        ],
      });

      if (typeof res.framework === "string") {
        framework = res.framework.trim();
      }
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

  if (options.example === true) {
    console.error(
      "Please provide an example name, otherwise remove the example option.",
    );
    process.exit(1);
  }

  const packageManager = !!options.useNpm
    ? "npm"
    : !!options.usePnpm
      ? "pnpm"
      : getPkgManager();

  const example = typeof options.example === "string" && options.example.trim();
  try {
    await createApp({
      appPath: resolvedProjectPath,
      packageManager,
      example: example && example !== "default" ? example : undefined,
    });
  } catch (reason) {
    if (!(reason instanceof DownloadError)) {
      throw reason;
    }
  }

  console.log(`projectPath: ${projectPath}`);
  console.log(`framework: ${framework}`);
  console.log(`language: ${language}`);
}