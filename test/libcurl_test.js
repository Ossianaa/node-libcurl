const assert = require("assert");
const http = require("http");
const express = require("express");
const { requests, fetch, LibCurl } = require("../dist/index");

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

    const response = await fetch(`${baseUrl}/json?a=1`, {
        instance: sharedInstance,
        headers: {
            "x-client": "fetch-test",
        },
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
}

async function runRequestsTests(baseUrl) {
    const session = requests.session({
        defaultRequestHeaders: {
            "x-default": "requests-test",
        },
    });

    const headersResp = await session.get(`${baseUrl}/headers`, {
        headers: {
            "x-client": "requests-client",
        },
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
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
