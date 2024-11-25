const {
    requests,
    LibCurlWebSocket,
    LibCurlJA3Map,
    LibCurl,
    fetch,
} = require("../../dist/index");

const curl = new LibCurl();
const heapdump = require("heapdump");
const repro = async () => {
    for (let i = 0; i < 5e3; i++) {
        try {
            const resp = await fetch(
                "https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V20.md",
                {
                    headers: { "Cache-Control": "no-cache" },
                    instance: curl,
                },
            );
            await resp.text();
        } catch (error) {}

        if (i % 500 === 0) {
            console.log(i);
            heapdump.writeSnapshot(`${i}.heapsnapshot`)
        }
    }
};

repro()
    .then(() => console.log("Finished"))
    .catch((err) => console.log("Error", err));

setInterval(() => {
    const afterMem = process.memoryUsage();
    console.log(afterMem);
}, 1e3);
