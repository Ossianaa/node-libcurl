const assert = require("assert");
const http = require("http");
const net = require("net");
const crypto = require("crypto");
const express = require("express");
const { execFileSync, spawn } = require("child_process");
const path = require("path");
const {
    requests,
    fetch,
    LibCurl,
    LibCurlWebSocket,
    LibCurlTLSVerifySigalgs,
} = require("../dist/index");

async function createServer() {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    let flakyCount = 0;

    app.get("/json", (req, res) => {
        res.set("X-Test", "ok");
        res.json({
            ok: true,
            method: req.method,
            query: req.query,
        });
    });

    app.get("/text", (_req, res) => {
        res.type("text/plain").send("hello-libcurl");
    });

    app.get("/headers", (req, res) => {
        res.json({
            ok: true,
            "x-default": req.headers["x-default"] || "",
            "x-client": req.headers["x-client"] || "",
        });
    });

    app.get("/set-cookie", (_req, res) => {
        res.setHeader("Set-Cookie", "sid=test-cookie; Path=/");
        res.json({ ok: true });
    });

    app.get("/read-cookie", (req, res) => {
        res.json({
            ok: true,
            cookie: req.headers.cookie || "",
        });
    });

    app.get("/redirect", (_req, res) => {
        res.redirect(302, "/json?from=redirect");
    });

    app.get("/flaky", (_req, res) => {
        flakyCount += 1;
        if (flakyCount < 3) {
            res.status(500).json({ ok: false, count: flakyCount });
            return;
        }
        res.json({ ok: true, count: flakyCount });
    });

    app.post("/echo-form", (req, res) => {
        res.json({
            ok: true,
            method: req.method,
            contentType: req.headers["content-type"] || "",
            body: req.body,
        });
    });

    app.post("/echo", (req, res) => {
        res.json({
            ok: true,
            method: req.method,
            contentType: req.headers["content-type"] || "",
            body: req.body,
        });
    });

    app.put("/echo", (req, res) => {
        res.json({
            ok: true,
            method: req.method,
            contentType: req.headers["content-type"] || "",
            body: req.body,
        });
    });

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("failed to start test server");
    }
    return {
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
    };
}

async function runFetchTests(baseUrl) {
    const sharedInstance = new LibCurl();
    sharedInstance.setTLSVerifySigalgs([
        LibCurlTLSVerifySigalgs.ml_dsa_44,
        LibCurlTLSVerifySigalgs.ecdsa_secp256r1_sha256,
    ]);

    const response = await fetch(`${baseUrl}/json?a=1`, {
        instance: sharedInstance,
        headers: {
            "x-client": "fetch-test",
        },
        tlsVerifySigalgs: [
            LibCurlTLSVerifySigalgs.ml_dsa_65,
            "0x0403",
        ],
    });

    assert.strictEqual(response.status(), 200);
    const payload = await response.json();
    assert.strictEqual(payload.ok, true);
    assert.strictEqual(payload.method, "GET");
    assert.strictEqual(payload.query.a, "1");

    const headers = await response.headers();
    assert.strictEqual(headers.get("x-test"), "ok");

    assert.strictEqual(typeof response.contentLength(), "number");
    assert.strictEqual(typeof response.encodedBodySize(), "number");
    assert.ok(response.contentLength() >= 0);
    assert.ok(response.encodedBodySize() >= 0);

    const redirectDisabled = await fetch(`${baseUrl}/redirect`, {
        instance: sharedInstance,
    });
    assert.strictEqual(redirectDisabled.status(), 302);

    const redirectEnabled = await fetch(`${baseUrl}/redirect`, {
        instance: sharedInstance,
        redirect: true,
    });
    assert.strictEqual(redirectEnabled.status(), 200);
    const redirectPayload = await redirectEnabled.json();
    assert.strictEqual(redirectPayload.ok, true);
    assert.strictEqual(redirectPayload.query.from, "redirect");

    await fetch(`${baseUrl}/set-cookie`, {
        instance: sharedInstance,
    });
    const cookieEcho = await fetch(`${baseUrl}/read-cookie`, {
        instance: sharedInstance,
    });
    const cookiePayload = await cookieEcho.json();
    assert.ok(cookiePayload.cookie.includes("sid=test-cookie"));

    const formBody = new URLSearchParams({ a: "1", b: "two" });
    const formResp = await fetch(`${baseUrl}/echo-form`, {
        instance: sharedInstance,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
    });
    assert.strictEqual(formResp.status(), 200);
    const formPayload = await formResp.json();
    assert.strictEqual(formPayload.body.a, "1");
    assert.strictEqual(formPayload.body.b, "two");

    const putResp = await fetch(`${baseUrl}/echo`, {
        instance: sharedInstance,
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            putKey: "putValue",
            count: 1,
        }),
    });
    assert.strictEqual(putResp.status(), 200);
    const putPayload = await putResp.json();
    assert.strictEqual(putPayload.ok, true);
    assert.strictEqual(putPayload.method, "PUT");
    assert.strictEqual(putPayload.body.putKey, "putValue");
    assert.strictEqual(putPayload.body.count, 1);
    assert.ok(/application\/json/i.test(putPayload.contentType));
}

async function runRequestsTests(baseUrl) {
    const session = requests.session({
        defaultRequestHeaders: {
            "x-default": "requests-test",
        },
        tlsVerifySigalgs: [
            LibCurlTLSVerifySigalgs.ml_dsa_87,
            "0x0804",
        ],
    });

    const headersResp = await session.get(`${baseUrl}/headers`, {
        headers: {
            "x-client": "requests-client",
        },
        tlsVerifySigalgs: [
            LibCurlTLSVerifySigalgs.rsa_pkcs1_sha256,
            "0x0805",
        ],
    });
    assert.strictEqual(headersResp.status, 200);
    assert.strictEqual(headersResp.json["x-default"], "requests-test");
    assert.strictEqual(headersResp.json["x-client"], "requests-client");

    const textResp = await session.get(`${baseUrl}/text`);
    assert.strictEqual(textResp.status, 200);
    assert.strictEqual(textResp.text, "hello-libcurl");
    assert.strictEqual(typeof textResp.contentLength, "number");
    assert.strictEqual(typeof textResp.encodedBodySize, "number");
    assert.ok(textResp.contentLength >= 0);
    assert.ok(textResp.encodedBodySize >= 0);

    const postResp = await session.post(`${baseUrl}/echo`, {
        json: {
            foo: "bar",
        },
    });
    assert.strictEqual(postResp.status, 200);
    assert.strictEqual(postResp.json.ok, true);
    assert.strictEqual(postResp.json.method, "POST");
    assert.strictEqual(postResp.json.body.foo, "bar");
    assert.ok(/application\/json/i.test(postResp.json.contentType));

    const putResp = await session.put(`${baseUrl}/echo`, {
        json: {
            foo: "baz",
            n: 7,
        },
    });
    assert.strictEqual(putResp.status, 200);
    assert.strictEqual(putResp.json.ok, true);
    assert.strictEqual(putResp.json.method, "PUT");
    assert.strictEqual(putResp.json.body.foo, "baz");
    assert.strictEqual(putResp.json.body.n, 7);
    assert.ok(/application\/json/i.test(putResp.json.contentType));

    const formResp = await session.post(`${baseUrl}/echo-form`, {
        data: {
            foo: "bar",
            count: 2,
            enabled: true,
            nested: { x: 1 },
        },
    });
    assert.strictEqual(formResp.status, 200);
    assert.strictEqual(formResp.json.body.foo, "bar");
    assert.strictEqual(formResp.json.body.count, "2");
    assert.strictEqual(formResp.json.body.enabled, "true");
    assert.strictEqual(formResp.json.body.nested, JSON.stringify({ x: 1 }));

    const paramsResp = await session.get(`${baseUrl}/json`, {
        params: {
            p: "1",
            q: "two",
        },
    });
    assert.strictEqual(paramsResp.status, 200);
    assert.strictEqual(paramsResp.json.query.p, "1");
    assert.strictEqual(paramsResp.json.query.q, "two");

    const staticResp = await requests.get(`${baseUrl}/text`);
    assert.strictEqual(staticResp.status, 200);
    assert.strictEqual(staticResp.text, "hello-libcurl");

    let retryCalls = 0;
    const retrySession = session.retry(3, (resp) => {
        retryCalls += 1;
        return !!resp && resp.status === 200;
    });
    const flakyResp = await retrySession.get(`${baseUrl}/flaky`);
    assert.strictEqual(flakyResp.status, 200);
    assert.strictEqual(flakyResp.json.count, 3);
    assert.ok(retryCalls >= 3);

    session.setCookie("manualCookie", "manualValue", "127.0.0.1", "/");
    const cookieValue = session.getCookie(
        "manualCookie",
        ".127.0.0.1",
        "/",
    );
    assert.strictEqual(cookieValue, "manualValue");
    const cookieMap = session.getCookiesMap(".127.0.0.1", "/");
    assert.ok(cookieMap.has("manualCookie"));
    session.deleteCookie("manualCookie", ".127.0.0.1", "/");
    const deletedValue = session.getCookie(
        "manualCookie",
        ".127.0.0.1",
        "/",
    );
    assert.strictEqual(deletedValue, "");
}

// ---------------------------------------------------------------------------
// WebSocket tests
// ---------------------------------------------------------------------------
// The libcurl WebSocket client performs the HTTP upgrade synchronously on the
// JS thread (curl_easy_perform in the constructor), so an in-process server
// deadlocks: it can never process the connection while the client's event
// loop is blocked. The echo server therefore runs in its own child process
// (see test/websocket_echo_server.js), which also matches the suite's pattern
// of isolating native code in child processes.
async function spawnWebSocketEchoServer() {
    const child = spawn(
        process.execPath,
        [path.join(__dirname, "websocket_echo_server.js")],
        { stdio: ["ignore", "pipe", "inherit"] },
    );
    let stdout = "";
    child.stdout.on("data", (chunk) => {
        stdout += chunk;
    });
    const deadline = Date.now() + 15000;
    while (!/WS_ECHO_PORT=\d+/.test(stdout)) {
        if (child.exitCode !== null) {
            throw new Error(
                `websocket echo server exited early with code ${child.exitCode}`,
            );
        }
        if (Date.now() > deadline) {
            child.kill();
            throw new Error("websocket echo server did not report a port in time");
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    const port = Number(stdout.match(/WS_ECHO_PORT=(\d+)/)[1]);
    return { child, wsUrl: `ws://127.0.0.1:${port}` };
}

function openWebSocket(url, options = {}) {
    return new Promise((resolve, reject) => {
        let ws;
        try {
            ws = new LibCurlWebSocket(url, { timeout: 10, ...options });
        } catch (error) {
            reject(error);
            return;
        }
        const timer = setTimeout(() => {
            reject(new Error(`websocket open timeout: ${url}`));
        }, 10000);
        ws.onerror = (message) => {
            clearTimeout(timer);
            reject(new Error(`websocket error: ${message}`));
        };
        ws.onopen = () => {
            clearTimeout(timer);
            resolve(ws);
        };
    });
}

function echoOnce(ws, payload, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error("websocket message timeout")),
            timeout,
        );
        ws.onmessage = (data) => {
            clearTimeout(timer);
            resolve(Buffer.from(data));
        };
        try {
            ws.send(payload);
        } catch (error) {
            clearTimeout(timer);
            reject(error);
        }
    });
}

function closeWebSocket(ws, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error("websocket close timeout")),
            timeout,
        );
        ws.onerror = () => {}; // a failing close handshake must not fail the close
        ws.onclose = () => {
            clearTimeout(timer);
            resolve();
        };
        try {
            ws.close();
        } catch (error) {
            clearTimeout(timer);
            reject(error);
        }
    });
}

async function runWebSocketRefusedTest() {
    // reserve a port, then close the listener so nothing accepts
    const tmp = net.createServer();
    await new Promise((resolve) => tmp.listen(0, "127.0.0.1", resolve));
    const port = tmp.address().port;
    await new Promise((resolve) => tmp.close(resolve));

    const ws = new LibCurlWebSocket(`ws://127.0.0.1:${port}`, { timeout: 5 });
    await new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error("expected onerror for refused connection")),
            10000,
        );
        ws.onerror = () => {
            clearTimeout(timer);
            resolve();
        };
        ws.onopen = () => {
            clearTimeout(timer);
            reject(new Error("unexpected onopen for refused connection"));
        };
    });
}

async function runWebSocketTests(wsUrl) {
    console.log("[websocket] functional tests");

    // text echo
    const ws = await openWebSocket(wsUrl);
    assert.strictEqual(
        Buffer.from(await echoOnce(ws, "hello-libcurl")).toString(),
        "hello-libcurl",
    );

    // binary echo
    const bin = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    assert.ok(Buffer.from(await echoOnce(ws, bin)).equals(Buffer.from(bin)));

    // large binary payload (1 MB) — exercises fragmented frames end to end
    const big = crypto.randomBytes(1024 * 1024);
    const bigBack = Buffer.from(await echoOnce(ws, big, 30000));
    assert.strictEqual(bigBack.length, big.length);
    assert.ok(bigBack.equals(big));

    // sequential messages on one connection
    for (let i = 0; i < 50; i++) {
        const msg = `seq-${i}`;
        assert.strictEqual(Buffer.from(await echoOnce(ws, msg)).toString(), msg);
    }
    await closeWebSocket(ws);

    // concurrent connections, several echoes each
    const CONCURRENT = 20;
    const EACH = 5;
    const results = await Promise.all(
        Array.from({ length: CONCURRENT }, async (_unused, i) => {
            const w = await openWebSocket(wsUrl);
            try {
                for (let j = 0; j < EACH; j++) {
                    const msg = `c${i}-${j}`;
                    assert.strictEqual(
                        Buffer.from(await echoOnce(w, msg)).toString(),
                        msg,
                    );
                }
            } finally {
                await closeWebSocket(w);
            }
            return i;
        }),
    );
    assert.strictEqual(results.length, CONCURRENT);

    // concurrent open/close churn
    await Promise.all(
        Array.from({ length: 20 }, async () => {
            const w = await openWebSocket(wsUrl);
            await closeWebSocket(w);
        }),
    );

    // error path: connection refused surfaces onerror
    await runWebSocketRefusedTest();

    console.log("[websocket] websocket functional tests passed");
}

async function runWebSocketBenchmarks(wsUrl) {
    console.log("[websocket] benchmarks");

    // connections/sec: sequential connect + echo + close
    const CONN_COUNT = 50;
    let t0 = performance.now();
    for (let i = 0; i < CONN_COUNT; i++) {
        const w = await openWebSocket(wsUrl);
        await echoOnce(w, "ping");
        await closeWebSocket(w);
    }
    const connMs = performance.now() - t0;
    const connectionsPerSec = (CONN_COUNT / connMs) * 1000;

    // messages/sec: sequential echoes over one connection
    const MSG_COUNT = 500;
    const ws = await openWebSocket(wsUrl);
    t0 = performance.now();
    for (let i = 0; i < MSG_COUNT; i++) {
        await echoOnce(ws, `msg-${i}`);
    }
    const msgMs = performance.now() - t0;
    const messagesPerSec = (MSG_COUNT / msgMs) * 1000;

    // throughput: 1 MB binary echoes
    const MB = 1024 * 1024;
    const big = crypto.randomBytes(MB);
    const BIG_COUNT = 10;
    t0 = performance.now();
    for (let i = 0; i < BIG_COUNT; i++) {
        const echoed = Buffer.from(await echoOnce(ws, big, 30000));
        assert.strictEqual(echoed.length, MB);
        assert.ok(echoed.equals(big));
    }
    const bigMs = performance.now() - t0;
    const throughputMBps = (BIG_COUNT * MB) / 1024 / 1024 / (bigMs / 1000);
    await closeWebSocket(ws);

    // concurrent round-trips
    const CONCURRENT = 20;
    t0 = performance.now();
    await Promise.all(
        Array.from({ length: CONCURRENT }, async () => {
            const w = await openWebSocket(wsUrl);
            try {
                for (let j = 0; j < 5; j++) {
                    await echoOnce(w, "c");
                }
            } finally {
                await closeWebSocket(w);
            }
        }),
    );
    const concurrentMs = performance.now() - t0;

    console.log(
        `  connections/sec : ${connectionsPerSec.toFixed(1)}  (${CONN_COUNT} connect+echo+close)`,
    );
    console.log(
        `  messages/sec    : ${messagesPerSec.toFixed(1)}  (${MSG_COUNT} echoes over 1 connection)`,
    );
    console.log(
        `  throughput      : ${throughputMBps.toFixed(1)} MB/s  (${BIG_COUNT} x 1MB echoes)`,
    );
    console.log(
        `  concurrent      : ${concurrentMs.toFixed(1)} ms  (${CONCURRENT} connections x 5 echoes)`,
    );
}

// ---------------------------------------------------------------------------
// HTTP/3 tests
// ---------------------------------------------------------------------------
// HTTP/3 needs the native binding built with HTTP/3 (ngtcp2/nghttp3) support
// and a reachable public HTTP/3 endpoint. If the connectivity probe fails the
// whole section is skipped, so `npm test` still works offline or on builds
// without HTTP/3.
const HTTP3_URL = "https://cloudflare-quic.com";
const HTTP3_JSON_URL = "https://fp.impersonate.pro/api/http3";
const HTTP3_ALT_URL = "https://quic.nginx.org";
const HTTP3_REQUEST_TIMEOUT = 15; // seconds

const HTTP3_FINGERPRINT = {
    scid: "scid=0",
    settings: "1:65536;6:262144;7:100;51:1;GREASE",
    transport_params:
        "9:103;15:AUTO;7:6291456;4:15728640;1:30000;6:6291456;18258:1;GREASE;8:100;16741339:1@1,GREASE;3:1472;32:65536;5:6291456",
    tls: "ciphers=1,2,3;alps=h3;grease=off;rand=off",
    permutation: "7,0,14,19,15,9,4,24,17,21,1",
    verify_sigalgs:
        "0x0403,0x0804,0x0401,0x0503,0x0805,0x0501,0x0806,0x0601,0x0201",
};

// Each scenario runs in its own process so a native crash fails only that
// scenario and reports its exit code, instead of taking down the whole suite.
const HTTP3_CRASH_SCENARIOS = [
    "sequential-heavy",
    "concurrent-heavy",
    "shared-session-concurrent",
    "large-body",
    "timeout-loop",
    "mixed-versions",
    "invalid-fingerprint",
    "after-error",
    "closed-stdio",
];

async function probeHttp3() {
    const session = requests.session({
        httpVersion: "http3_only",
        timeout: HTTP3_REQUEST_TIMEOUT,
    });
    try {
        const resp = await session.get(HTTP3_URL, {
            timeout: HTTP3_REQUEST_TIMEOUT,
        });
        return resp.status === 200;
    } catch {
        return false;
    }
}

async function runHttp3FunctionalTests() {
    console.log("[http3] functional tests");

    // 1. plain http3_only GET over the requests API
    const session = requests.session({
        httpVersion: "http3_only",
        timeout: HTTP3_REQUEST_TIMEOUT,
    });
    const resp = await session.get(HTTP3_URL, {
        timeout: HTTP3_REQUEST_TIMEOUT,
    });
    assert.strictEqual(resp.status, 200);
    assert.ok(
        typeof resp.text === "string" && resp.text.length > 0,
        "body should be non-empty",
    );
    assert.strictEqual(typeof resp.contentLength, "number");
    assert.strictEqual(typeof resp.encodedBodySize, "number");
    assert.ok(resp.contentLength > 0);
    assert.ok(resp.encodedBodySize >= 0);

    // 2. the fingerprint service confirms the request really arrived over HTTP/3
    const fpResp = await session.get(HTTP3_JSON_URL, {
        timeout: HTTP3_REQUEST_TIMEOUT,
    });
    assert.strictEqual(fpResp.status, 200);
    assert.strictEqual(
        fpResp.json.protocol,
        "http3",
        "server should report the request came in over HTTP/3",
    );

    // 3. "http3" mode (fallback to a lower version allowed) still negotiates
    const altSession = requests.session({
        httpVersion: "http3",
        timeout: HTTP3_REQUEST_TIMEOUT,
    });
    const altResp = await altSession.get(HTTP3_ALT_URL, {
        timeout: HTTP3_REQUEST_TIMEOUT,
    });
    assert.strictEqual(altResp.status, 200);

    // 4. custom http3Fingerprint at session level must not break the request
    const fpSession = requests.session({
        httpVersion: "http3_only",
        timeout: HTTP3_REQUEST_TIMEOUT,
        http3Fingerprint: HTTP3_FINGERPRINT,
    });
    const fpCustom = await fpSession.get(HTTP3_URL, {
        timeout: HTTP3_REQUEST_TIMEOUT,
    });
    assert.strictEqual(fpCustom.status, 200);

    // 5. fetch API over HTTP/3 (httpVersion: 3 == http3_only)
    const fetchResp = await fetch(HTTP3_URL, {
        httpVersion: 3,
        timeout: HTTP3_REQUEST_TIMEOUT,
    });
    assert.strictEqual(fetchResp.status(), 200);
    const text = await fetchResp.text();
    assert.ok(text.length > 0);
}

async function runHttp3StabilityTests() {
    console.log("[http3] stability tests");

    // sequential reuse of a single session
    const session = requests.session({
        httpVersion: "http3_only",
        timeout: HTTP3_REQUEST_TIMEOUT,
    });
    for (let i = 0; i < 10; i++) {
        const resp = await session.get(HTTP3_URL, {
            timeout: HTTP3_REQUEST_TIMEOUT,
        });
        assert.strictEqual(resp.status, 200, `sequential request #${i}`);
    }

    // concurrent requests across sessions
    await Promise.all(
        Array.from({ length: 10 }, async () => {
            const s = requests.session({
                httpVersion: "http3_only",
                timeout: HTTP3_REQUEST_TIMEOUT,
            });
            const resp = await s.get(HTTP3_URL, {
                timeout: HTTP3_REQUEST_TIMEOUT,
            });
            assert.strictEqual(resp.status, 200);
        }),
    );

    // switching httpVersion between requests on the same session
    const switchSession = requests.session({ timeout: HTTP3_REQUEST_TIMEOUT });
    for (const version of ["http3_only", "http3", "http2", "http3_only"]) {
        const resp = await switchSession.get(HTTP3_URL, {
            httpVersion: version,
            timeout: HTTP3_REQUEST_TIMEOUT,
        });
        assert.strictEqual(
            resp.status,
            200,
            `httpVersion=${version} on shared session`,
        );
    }
}

async function runHttp3Tests() {
    if (!(await probeHttp3())) {
        console.warn(
            "[http3] SKIPPED: no HTTP/3 endpoint reachable (offline or build without HTTP/3)",
        );
        return;
    }
    await runHttp3FunctionalTests();
    await runHttp3StabilityTests();
    console.log("[http3] http3 tests passed");
}

async function main() {
    const { server, baseUrl } = await createServer();
    try {
        await runFetchTests(baseUrl);
        await runRequestsTests(baseUrl);
        console.log("libcurl fetch/requests tests passed");
    } finally {
        await new Promise((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        });
    }
    const wsEcho = await spawnWebSocketEchoServer();
    try {
        await runWebSocketTests(wsEcho.wsUrl);
        await runWebSocketBenchmarks(wsEcho.wsUrl);
    } finally {
        // The child's stdio pipes keep the parent's event loop alive until
        // the child is reaped; wait (bounded) for it so the pipes close.
        await new Promise((resolve) => {
            const timer = setTimeout(resolve, 5000);
            wsEcho.child.once("exit", () => {
                clearTimeout(timer);
                resolve();
            });
            wsEcho.child.kill();
        });
    }
    await runHttp3Tests();
    // The websocket echo child and its pipes may still be around; exit
    // explicitly so the suite does not hang after all tests pass.
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
