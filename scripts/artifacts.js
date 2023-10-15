const fs = require('fs');
const path = require('path');
const { version } = require('../package.json');

const artifactsDir = 'artifacts';
const dirs = fs.readdirSync(artifactsDir);

for (const bindingName of dirs) {
    const artiactBindingDir = path.join(artifactsDir, bindingName);
    const bindingDir = path.join('scripts/npm', bindingName);
    fs.readdirSync(artiactBindingDir)
        .forEach(file =>
            fs.cpSync(path.join(artiactBindingDir, file), path.join(bindingDir, file)));
    const packagePath = path.join(bindingDir, 'package.json');
    const json = JSON.parse(fs.readFileSync(packagePath).toString());
    json.version = version;
    fs.writeFileSync(packagePath, JSON.stringify(json, null, 2));
}