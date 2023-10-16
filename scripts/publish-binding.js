const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process')

const artifactsDir = 'artifacts';
const dirs = fs.readdirSync(artifactsDir);

for (const bindingName of dirs) {
    const bindingDir = path.join('scripts/npm', bindingName);
    execSync(`cd ${bindingDir} && npm publish --access public`);
}