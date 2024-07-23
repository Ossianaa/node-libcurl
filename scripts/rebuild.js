const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const tar = require("tar");

let { platform, arch } = process;
if (process.env.NODE_ARCH) {
    arch = process.env.NODE_ARCH;
}
const { "artifacts-version": version } = require("../package.json");

let platform_ = null;

function isMusl() {
    // For Node 10
    if (!process.report || typeof process.report.getReport !== "function") {
        try {
            const lddPath = require("child_process")
                .execSync("which ldd")
                .toString()
                .trim();

            return readFileSync(lddPath, "utf8").includes("musl");
        } catch (e) {
            return true;
        }
    } else {
        const { glibcVersionRuntime } = process.report.getReport().header;
        return !glibcVersionRuntime;
    }
}

switch (platform) {
    case "android":
        throw new Error(`Unsupported architecture on Android ${arch}`);

    case "win32":
        switch (arch) {
            case "x64":
                platform_ = "x86_64-pc-windows-msvc";
                break;

            default:
                throw new Error(`Unsupported architecture on Windows: ${arch}`);
        }

        break;

    case "darwin":
        switch (arch) {
            case "x64":
                platform_ = "x86_64-apple-darwin";
                break;
            case "arm64":
                platform_ = "arm64-apple-darwin";
                break;
            default:
                throw new Error(`Unsupported architecture on macOS: ${arch}`);
        }

        break;

    case "freebsd":
        throw new Error(`Unsupported architecture on FreeBSD: ${arch}`);

    case "linux":
        switch (arch) {
            case "x64":
                if (isMusl()) {
                    throw new Error(
                        `Unsupported architecture on Linux: ${arch} musl`,
                    );
                } else {
                    platform_ = "x86_64-unknown-linux-gnu";
                }

                break;
            case "arm64":
                if (isMusl()) {
                    throw new Error(
                        `Unsupported architecture on Linux: ${arch} musl`,
                    );
                } else {
                    platform_ = "arm64-unknown-linux-gnu";
                }

                break;

            default:
                throw new Error(`Unsupported architecture on Linux: ${arch}`);
        }

        break;

    default:
        throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`);
}
console.log(platform, arch);
if (!fs.existsSync(path.join(__dirname, "..", "lib"))) {
    fs.mkdirSync(path.join(__dirname, "..", "lib"));
}
const libPath = path.join(__dirname, "..", "lib", version, platform_);
const copyPath = path.join(__dirname, "..", "lib", platform_);
const copyLibrary = () => {
    if (fs.existsSync(copyPath)) {
        fs.rmdirSync(copyPath, { recursive: true });
    }
    fs.cpSync(libPath, copyPath, { recursive: true });
};
if (!fs.existsSync(libPath) || !fs.existsSync(copyPath)) {
    fs.mkdirSync(libPath, { recursive: true });
    const tarPath = path.join(
        __dirname,
        "..",
        "lib",
        version,
        `curl_${platform_}.tar.gz`,
    );
    fetch(
        `https://github.com/Ossianaa/node-libcurl-patches-docker/releases/download/${version}/curl_${platform_}.tar.gz`,
    )
        .then((e) => e.arrayBuffer())
        .then((e) => fs.writeFileSync(tarPath, new Uint8Array(e)))
        .then((e) =>
            tar.x({
                file: tarPath,
                C: libPath,
            }),
        )
        .then((e) => fs.rmSync(tarPath))
        .then((e) => {
            copyLibrary();
        })
        .catch((e) => {
            console.error(e);
            throw new Error("install library failed.");
        });
}
// `https://github.com/Ossianaa/node-libcurl-patches-docker/releases/download/${version}/curl_${platform}.tar.gz`;
