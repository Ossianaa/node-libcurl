const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const packagePath = path.join(__dirname, '../package.json');
const package = require(packagePath);
const { version, optionalDependencies } = package;

for (const k in optionalDependencies) {
    optionalDependencies[k] = version;
}
fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));
execSync('npm publish --access public');