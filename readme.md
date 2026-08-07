# node-libcurl

A Node.js HTTP request library based on libcurl, with browser-grade TLS/HTTP2/HTTP3 fingerprint customization. It patches BoringSSL to customize the TLS client hello (cipher suites, extensions, order) and uses a custom HTTP/2 / HTTP/3 implementation, so the traffic can be made to look like real Chrome or Firefox — something the built-in Node.js `fetch` can't do.

------------

## Build Status

|      Platform       | Support |
| :-----------------: | :-----: |
|  __Windows (x64)__  | __Yes__ |
| __Ubuntu (x86_64)__ | __Yes__ |
| __MacOS (x86_64/arm64)__  | __Yes__ |
------------

## How to Install

> npm i -g pnpm
>
> pnpm i @ossiana/node-libcurl

------------

## Usage

The package exports four APIs:

| Export | Description |
| :----- | :---------- |
| `requests` | High-level, axios/requests-style API. **Recommended.** |
| `fetch` | `fetch`-like API with a compatible response interface. |
| `LibCurl` | Low-level wrapper around the native libcurl binding. |
| `LibCurlWebSocket` | WebSocket client with fingerprint support. |

```ts
import { requests, fetch, LibCurl, LibCurlWebSocket } from "@ossiana/node-libcurl";
```

### 1. requests (axios-style)

#### Static requests (one-shot)

```ts
import { requests } from "@ossiana/node-libcurl";

const resp = await requests.get("https://httpbin.org/get", {
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    },
    params: { page: 1, size: 20 }, // appended to query string
});
console.log(resp.status);   // 200
console.log(resp.text);     // response body as string
console.log(resp.json);     // response body parsed as JSON
```

Supported methods: `get` `post` `put` `patch` `delete` `head` `options` `trace`.

#### Session (persistent connection + cookies + retry)

A session reuses one `LibCurl` instance, so the TCP/TLS connection and cookies are kept between requests — pass it a shared `instance` to get the same behavior across sessions:

```ts
const session = requests.session({
    httpVersion: "http2",
    redirect: true,
    timeout: 15, // seconds
    // ja3: "chrome131",
    // akamai: "auto",
    // proxy: "http://user:pass@127.0.0.1:8888",
});

const a = await session.get("https://example.com/login");
const b = await session.post("https://example.com/login", {
    json: { username: "user", password: "pass" }, // sets Content-Type: application/json
    // or use data for form-encoded bodies:
    // data: { username: "user", password: "pass" },
});
```

Session-only options:

```ts
const session = requests.session({
    defaultRequestHeaders: { // merged into every request of this session
        "User-Agent": "Mozilla/5.0 ... Chrome/150.0.0.0 Safari/537.36",
    },
    cookies: { // pre-set cookies for the given uri
        value: { name: "a", value: "b" },
        uri: "https://example.com",
    },
    autoSortRequestHeaders: "auto", // reorder headers like Chrome fetch
    requestType: "fetch",           // "fetch" | "XMLHttpRequest"
});
```

Session methods (in addition to the HTTP verbs):

```ts
session.setDefaultRequestHeaders(headers);
session.setCookie("key", "value", ".example.com", "/"); // set cookie manually
session.getCookie("key", ".example.com");               // get one cookie value
session.getCookies();                                   // "a=b; c=d;"
session.getCookiesMap();   // Map<string, { domain, subDomain, path, secure, timestamp, value }>
session.deleteCookie("key", ".example.com");
session.retry(3);          // returns a NEW session that retries up to 3 times
session.setProxy(proxy);
session.setTimeout(connectTime, sendTime); // seconds
session.setRedirect(true);
session.setHttpVersion("http2");
session.setInterface("eth0");
session.setJA3Fingerprint("chrome150");
session.setAkamaiFingerprint("auto");
session.setHttp3Fingerprint("auto");
session.getLastEffectiveUrl();
```

`retry` accepts a condition callback:

```ts
const retrySession = session.retry(3, (resp, error) => {
    // return true to stop retrying, false to retry again
    if (error) return false;
    return resp.status < 500;
});
```

#### Request options

| Option | Type | Description |
| :----- | :--- | :---------- |
| `headers` | `string \| object \| string[] \| [string, string][]` | Request headers. String form is `"Key: value\nKey2: value2"`. |
| `params` | `URLSearchParams \| string \| object` | Appended to the URL query string. |
| `json` | `object` | Sends the object as JSON body, sets `Content-Type: application/json`. |
| `data` | `string \| Uint8Array \| URLSearchParams \| object` | Sends a body. Objects are form-encoded (`a=1&b=2`), and `Content-Type` is set automatically. Cannot be combined with `json`. |
| `timeout` | `number` | Timeout in seconds. |
| `redirect` | `boolean` | Follow redirects (default `false`). |
| `proxy` | `string \| { proxy, username, password }` | Proxy, e.g. `"http://127.0.0.1:8888"`, `"socks5://user:pass@host:1080"`, or an account object. For HTTP/3 use a SOCKS5 proxy with UDP relay — see [HTTP/3 through a SOCKS5 UDP proxy](#http3-through-a-socks5-udp-proxy). |
| `httpVersion` | `"http1.1" \| "http2" \| "http3" \| "http3_only"` | HTTP protocol version. |
| `interface` | `string` | Bind to a specific network interface. |
| `ja3` | see [Fingerprints](#3-fingerprints) | TLS (JA3) fingerprint. |
| `akamai` | see [Fingerprints](#3-fingerprints) | HTTP/2 Akamai fingerprint. |
| `http3Fingerprint` | see [Fingerprints](#3-fingerprints) | HTTP/3 (QUIC) fingerprint. |
| `autoSortRequestHeaders` | `"auto" \| "chrome130" \| "chrome131" \| boolean` | Auto-sort request headers like Chrome fetch. |
| `tlsVerifySigalgs` | `string \| (string \| number)[]` | Custom TLS signature algorithms. |
| `requestType` | `"fetch" \| "XMLHttpRequest"` | HTTP/2 pseudo-header ordering style. |
| `headersOrder` | `string[]` | Explicit order of request headers for the next request only. |
| `h2config` | `{ weight: number, streamId?: number }` | Customize the HTTP/2 stream weight / next stream id. |
| `sslCert` | `{ certBlob, privateKeyBlob?, type?, password? }` | Client certificate (`type`: `"PEM" \| "DER" \| "P12"`). |
| `sslVerify` | `{ caPath: string }` | Custom CA bundle path. |

#### HTTP/3 through a SOCKS5 UDP proxy

HTTP/3 runs over QUIC, which uses **UDP** instead of TCP — so a regular HTTP/HTTPS proxy (which relays TCP) cannot carry it. To proxy HTTP/3, use a **SOCKS5 proxy that supports UDP relay** (SOCKS5 UDP ASSOCIATE, RFC 1928 §7). When an HTTP/3 request is paired with a `socks5://` proxy, the client automatically negotiates a UDP relay with the proxy and tunnels QUIC through it — no special scheme or extra option is needed:

```ts
const session = requests.session({
    httpVersion: "http3_only",           // or "http3"
    proxy: "socks5://user:pass@host:port", // a socks5 proxy with UDP relay
    http3Fingerprint: "auto",            // QUIC fingerprint still applies
});

const resp = await session.get("https://fp.impersonate.pro/api/http3");
console.log(resp.json.protocol);         // "http3"
```

The proxy object form and `setProxy` work too:

```ts
session.setProxy({
    proxy: "socks5://host:port",
    username: "user",
    password: "pass",
});
```

Same for `fetch`:

```ts
await fetch("https://example.com", {
    httpVersion: "http3_only",
    proxy: "socks5://user:pass@host:port",
});
```

Behavior notes:

* `http3_only` fails hard (throws `Couldn't connect to server`) if the proxy has no working UDP relay.
* `http3` falls back to TCP (HTTP/1.1/2 through the proxy) when the UDP relay fails — the response will not be HTTP/3.
* Very few proxy vendors support SOCKS5 UDP relay (most are HTTP/HTTPS-only or SOCKS5-TCP-only; those that support UDP typically ship it as a beta feature) — confirm with your provider before relying on it.

#### Response

| Property | Type | Description |
| :------- | :--- | :---------- |
| `status` | `number` | HTTP status code. |
| `text` | `string` | Decoded response body. |
| `json` | `object` | `JSON.parse(text)`. |
| `buffer` | `Uint8Array` | Raw response body. |
| `headers` | `string` | Raw response headers. |
| `headersMap` | `Headers` | Response headers as a `Headers` object. |
| `contentLength` | `number` | Response body length. |
| `encodedBodySize` | `number` | Wire-level (pre-decompression) body size. |

### 2. fetch (fetch-style)

```ts
import { fetch } from "@ossiana/node-libcurl";

const resp = await fetch("https://httpbin.org/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { hello: "world" }, // object is JSON.stringify'd
    redirect: true,
    ja3: "chrome150",
    akamai: "auto",
    httpVersion: "http3",
});

await resp.text();          // Promise<string>
await resp.json();          // Promise<object>
await resp.arraybuffer();   // Promise<ArrayBuffer>
await resp.headers();       // Promise<Headers>
await resp.cookies();       // Promise<string>
await resp.cookiesMap();    // Promise<Map<string, {...}>>
await resp.lastEffectiveUrl(); // Promise<string>
resp.status();              // number (sync)
resp.contentLength();
resp.encodedBodySize();
```

Options (all optional): `method` (default `"GET"`), `headers`, `body`, `redirect`, `cookies`, `httpVersion`, `verbose`, `proxy`, `timeout`, `interface`, `instance`, `ja3`, `akamai`, `autoSortRequestHeaders`, `sslCert`, `sslVerify`, `tlsVerifySigalgs`, `http3Fingerprint` (default `"auto"`).

Pass a shared `LibCurl` instance via `instance` to keep a persistent connection across calls:

```ts
const curl = new LibCurl();
const r1 = await fetch("https://example.com/a", { instance: curl });
const r2 = await fetch("https://example.com/b", { instance: curl }); // reuses the connection
```

### 3. Fingerprints

This is the core feature — make your requests indistinguishable from a real browser.

#### JA3 (TLS fingerprint)

```ts
ja3: "auto"                       // pick by User-Agent Chrome version (default)
ja3: "chrome99" | "chrome101" | "chrome110" | "chrome124" | "chrome131" | "chrome133" | "chrome150"
ja3: "771,4865-4866-4867-...,0-23-65281-10-11-35-16-...,29-23-24,0"  // custom JA3 string
```

The built-in versions randomize the TLS extension order per request (like real Chrome), and `"auto"` selects a preset matching the `Chrome/x.y` version in your `User-Agent` header.

#### Akamai (HTTP/2 fingerprint)

```ts
akamai: "auto"        // default
akamai: "chrome99" | "chrome107" | "chrome119"
akamai: "1:65536;3:1000;4:6291456;6:262144|15663105|0|m,a,s,p"  // custom string
```

#### HTTP/3 fingerprint

```ts
http3Fingerprint: "auto"            // default
http3Fingerprint: "chrome126" | "chrome150"
http3Fingerprint: {                 // fully custom config
    scid: "scid=0",
    settings: "1:65536;6:262144;7:100;51:1;GREASE",
    transport_params: "12584:0x4f524947;9:103;1:30000;7:6291456;15:AUTO;4:15728640;GREASE;32:65536;3:1472;17:1@1,GREASE;8:100;6:6291456;12583:174718;5:6291456",
    tls: "ciphers=1,2,3;alps=h3;grease=off;rand=on",
    permutation: "0,15,19,23,9,1,14,21,17,4,7",
    verify_sigalgs: "0x0403,0x0804,0x0401,0x0503,0x0805,0x0501,0x0806,0x0601,0x0201",
},
```

> Proxied HTTP/3 needs a SOCKS5 proxy with UDP relay — see [HTTP/3 through a SOCKS5 UDP proxy](#http3-through-a-socks5-udp-proxy).

#### TLS signature algorithms (HTTP/1.1 HTTP/2)

```ts
tlsVerifySigalgs: [
    0x0403, "ecdsa_secp256r1_sha256", "rsa_pss_rsae_sha256", "rsa_pkcs1_sha256", ...
]
```

#### Auto-sorted request headers

With `autoSortRequestHeaders: "auto"` (default), request headers are automatically re-ordered the same way Chrome's `fetch` does (prefix / client-hint / middle / suffix groups). Use `"chrome130"` / `"chrome131"` to pin a specific ordering version.

### 4. LibCurl (low-level)

```ts
import { LibCurl } from "@ossiana/node-libcurl";

const curl = new LibCurl();
curl.open("POST", "https://example.com/api");
curl.setRequestHeaders({ "Content-Type": "application/json" });
curl.setJA3Fingerprint("chrome150");
curl.setAkamaiFingerprint("auto");
curl.setHttp3Fingerprint("auto");
curl.setProxy("127.0.0.1:8888");          // or { proxy, username, password }
curl.setTimeout(10, 20);                  // connect / total, seconds
curl.setRedirect(true);
curl.setHttpVersion("http2");
curl.setInterface("eth0");
curl.setVerbose(true);                    // print curl internal logs
await curl.send({ hello: "world" });      // object is JSON.stringify'd

curl.getResponseStatus();       // number
curl.getResponseHeaders();      // string
curl.getResponseHeadersMap();   // Headers
curl.getResponseString();       // string
curl.getResponseBody();         // Uint8Array
curl.getResponseContentLength();
curl.getResponseEncodedBodySize();
curl.getCookies();              // "a=b; c=d;"
curl.getLastEffectiveUrl();
```

Other setters: `setRequestHeader(key, value)`, `setCookie({name, value, domain, path})`, `getCookie({name, domain, path})`, `getCookiesMap()`, `deleteCookie()`, `setSSLVerify({caPath})`, `setSSLCert(certBlob, privateKeyBlob?, "PEM"|"DER"|"P12", password?)`, `setTLSVerifySigalgs()`, `setHttp2NextStreamId(streamId)`, `setHttp2StreamWeight(weight)`, `setAutoSortRequestHeaders()`, `setRequestType("fetch"|"XMLHttpRequest")`, `setNextRequestType()`, `setNextRequestHeadersOrder(order)`.

> **Note:** one `LibCurl` instance can only run one request at a time — calling `send()` while a request is in flight throws.

### 5. WebSocket

```ts
const ws = new LibCurlWebSocket("wss://echo.websocket.org", {
    userAgent: "Mozilla/5.0 ... Chrome/150.0.0.0 Safari/537.36",
    origin: "https://example.com",
    cookie: "session=abc",
    protocol: "chat",
    timeout: 30,
    ja3: "chrome150",
    // instance: sharedCurl, // reuse an existing LibCurl
});

ws.onopen = () => {
    ws.send("hello");
    ws.send(new Uint8Array([1, 2, 3]));
};
ws.onmessage = (data: Uint8Array) => { /* receive */ };
ws.onclose = () => {};
ws.onerror = (message: string) => {};

ws.close();
```

------------

## Difference from Node.js `fetch`

* The TLS fingerprint (JA3), HTTP/2 (Akamai) and HTTP/3 fingerprints can be customized to look like Chrome or Firefox — node-libcurl patches BoringSSL and ships a custom HTTP/2/3 stack, so the handshake, header ordering and cipher suites match real browsers.
* Request headers can be auto-sorted exactly like Chrome's `fetch` (`autoSortRequestHeaders`).
* Persistent connections and cookie jars are first-class (session API).
* Client certificates, custom CA, per-interface binding, custom TLS signature algorithms, and HTTP/2 stream weight control are all supported.
