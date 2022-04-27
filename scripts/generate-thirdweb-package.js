const fs = require("fs");

const existingPackageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

const newPackageJson = { ...existingPackageJson, name: "thirdweb" };

fs.writeFileSync(
  "thirdweb-package.json",
  JSON.stringify(newPackageJson, null, 2)
);
