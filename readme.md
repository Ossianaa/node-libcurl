# node-libcurl

## Different with Nodejs fetch api
* The fingerprint can be customized to look like chrome or firefox ,it modified the BoringSSL extension, set the custom cipher suite with Libcurl
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



## Use Sample

```javascript
import { LibCurl, fetch, requests } from '@ossiana/node-libcurl'

```

```javascript
fetch("https://www.google.com").then(e => e.json())
```

```javascript
const session = requests.session({
    redirect: true,
    cookies: {
        value: "a=1",
        url: "google.com"
    }，
    proxy: "user:pwd@ip:port",
    defaultRequestHeaders: [
        ["sec-ch-ua-platform", '"Windows"'],
        ["user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"],
        ["sec-ch-ua", '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"'],
        ["sec-ch-ua-mobile", "?0"],
        ["accept", "*/*"],
        ["sec-fetch-site", "same-origin"],
        ["sec-fetch-mode", "cors"],
        ["sec-fetch-dest", "empty"],
        ["sec-fetch-storage-access", "none"],
        ["referer", "https://www.google.com/search?q=1"],
        ["accept-encoding", "gzip, deflate, br, zstd"],
        ["accept-language", "en-US"],
        ["priority", "u=1, i"],
    ],
    httpVersion: "http2",
    verbose: true,
    timeout: 15, // 15 seconds
    // interface: "eth0",
    ja3: "auto",
    akamai: "auto",
    autoSortRequestHeaders: true,
    requestType: "fetch",
    // sslCert: {
    //     certBlob: ...;
    //     privateKeyBlob: ...;
    //     type: "PEM";
    //     password: ...;
    // }
});

await session.post("https://www.google.com", {
    params: {
        a: "b",
    },
    headers: {
        "Content-Type": "application/octet-stream",
    },
    data: new Uint8Array([1, 2, 3]),
    h2config: {
        weight: 220,
        streamId: 13,
    },
    // overwrite `autoSortRequestHeaders` [[Once]]
    headersOrder: [
        "referer",
        "Content-Type",
        ...
    ],
    // overwrite `requestType` [[Once]]
    requestType: "XMLHttpRequest"
})
   .then(e => console.log(e.text));
```
