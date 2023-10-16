const {
    readFileSync
} = require('fs');

const {
    platform,
    arch
} = process;
let nativeBinding = null;
let loadError = null;

function isMusl() {
    // For Node 10
    if (!process.report || typeof process.report.getReport !== 'function') {
        try {
            const lddPath = require('child_process').execSync('which ldd').toString().trim();

            return readFileSync(lddPath, 'utf8').includes('musl');
        } catch (e) {
            return true;
        }
    } else {
        const {
            glibcVersionRuntime
        } = process.report.getReport().header;
        return !glibcVersionRuntime;
    }
}

switch (platform) {
    case 'android':
        throw new Error(`Unsupported architecture on Android ${arch}`);

    case 'win32':
        switch (arch) {
            case 'x64':
                try {
                    nativeBinding = require('@ossiana/node-libcurl-win32-x64-msvc');
                } catch (e) {
                    loadError = e;
                }

                break;

            default:
                throw new Error(`Unsupported architecture on Windows: ${arch}`);
        }

        break;

    case 'darwin':
        switch (arch) {
            case 'x64':
                try {
                    nativeBinding = require('@ossiana/node-libcurl-darwin-x64');
                } catch (e) {
                    loadError = e;
                }

                break;

            default:
                throw new Error(`Unsupported architecture on macOS: ${arch}`);
        }

        break;

    case 'freebsd':
        throw new Error(`Unsupported architecture on FreeBSD: ${arch}`);

    case 'linux':
        switch (arch) {
            case 'x64':
                if (isMusl()) {
                    throw new Error(`Unsupported architecture on Linux: ${arch} musl`);
                } else {
                    try {
                        nativeBinding = require('@ossiana/node-libcurl-linux-x64-gnu');
                    } catch (e) {
                        loadError = e;
                    }
                }

                break;

            default:
                throw new Error(`Unsupported architecture on Linux: ${arch}`);
        }

        break;

    default:
        throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`);
}

if (!nativeBinding) {
    if (loadError) {
        throw loadError;
    }

    throw new Error(`Failed to load native binding`);
}

module.exports = nativeBinding;