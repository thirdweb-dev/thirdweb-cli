#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
import { validateNpmName } from "../helpers/validate-pkg";
import prompts from "prompts";
import path from "path";


let projectPath: string = "";
let framework: string = "";
let language: string = "";

export async function twCreateExample(options:any){

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
                // return "Invalid project name: " + validation.problems![0];
                return "Invalid project name: ";
            },
        });

        if (typeof res.path === "string") {
            projectPath = res.path.trim();
        }
    }
}