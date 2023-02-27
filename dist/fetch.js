"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetch = void 0;
const libcurl_1 = require("./libcurl");
const utils_1 = require("./utils");
function fetch(url, request = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        request.instance || (request.instance = new libcurl_1.LibCurl());
        const curl = request.instance;
        const { method = "GET", headers, redirect = false, httpVersion = 0, openInnerLog = false, proxy, body, cookies } = request;
        curl.open(method, url + '', true);
        curl.setRequestHeaders(headers);
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
        yield curl.send(body);
        return {
            status: () => curl.getResponseStatus(),
            arraybuffer: () => __awaiter(this, void 0, void 0, function* () { return curl.getResponseBody().buffer; }),
            text: () => __awaiter(this, void 0, void 0, function* () { return curl.getResponseString(); }),
            json: () => __awaiter(this, void 0, void 0, function* () { return curl.getResponseJson(); }),
            headers: () => __awaiter(this, void 0, void 0, function* () { return curl.getResponseHeaders(); }),
            cookies: () => __awaiter(this, void 0, void 0, function* () { return curl.getCookies(); }),
            cookiesMap: () => __awaiter(this, void 0, void 0, function* () { return curl.getCookiesMap(); }),
        };
    });
}
exports.fetch = fetch;
//# sourceMappingURL=fetch.js.map