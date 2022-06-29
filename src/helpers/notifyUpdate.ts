// import checkForUpdate from "update-check";
// import * as pack from "../package.json";
// import {getPkgManager} from "./get-pkg-manager";
// import chalk from "chalk";
//
// const update = checkForUpdate(packageJson).catch(() => null);
//
// export async function notifyUpdate(): Promise<void> {
//     try {
//         const res = await update;
//         if (res?.latest) {
//             const pkgManager = getPkgManager();
//             console.log(
//                 chalk.yellow.bold("A new version of `create-tw-app` is available!") +
//                 "\n" +
//                 "You can update by running: " +
//                 chalk.cyan(
//                     pkgManager === "yarn"
//                         ? "yarn global add create-tw-app"
//                         : `${pkgManager} install --global create-tw-app`,
//                 ) +
//                 "\n",
//             );
//         }
//         process.exit();
//     } catch {
//         // ignore error
//     }
// }