"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetch = void 0;
const libcurl_1 = require("./libcurl");
const utils_1 = require("./utils");
async function fetch(url, request = {}) {
    request.instance ||= new libcurl_1.LibCurl();
    const curl = request.instance;
    const { method = "GET", headers, redirect = false, httpVersion = 0, openInnerLog = false, proxy, body, cookies } = request;
    curl.open(method, url + '', true);
    if (headers) {
        curl.setRequestHeaders(headers);
    }
    if (redirect) {
        curl.setRedirect(true);
    }
    if (httpVersion) {
        curl.setHttpVersion(httpVersion);
    }
    if (openInnerLog) {
        curl.printInnerLogger();
    }
    if (cookies) {
        const { hostname } = new URL(url);
        if (cookies) {
            (0, utils_1.libcurlSetCookies)(curl, cookies, hostname);
        }
    }
    if (proxy) {
        curl.setProxy(proxy);
    }
    await curl.send(body);
    return {
        status: () => curl.getResponseStatus(),
        arraybuffer: async () => curl.getResponseBody().buffer,
        text: async () => curl.getResponseString(),
        json: async () => curl.getResponseJson(),
        headers: async () => curl.getResponseHeaders(),
        cookies: async () => curl.getCookies(),
        cookiesMap: async () => curl.getCookiesMap(),
    };
}
exports.fetch = fetch;
//# sourceMappingURL=fetch.js.map