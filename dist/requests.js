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
exports.requests = void 0;
const libcurl_1 = require("./libcurl");
const utils_1 = require("./utils");
class requestsResponse {
    constructor(curl) {
        this.curl = curl;
    }
    get text() {
        return this.curl.getResponseString();
    }
    get json() {
        return this.curl.getResponseJson();
    }
    get buffer() {
        return this.curl.getResponseBody();
    }
    get headers() {
        return this.curl.getResponseHeaders();
    }
    get headersMap() {
        return this.curl.getResponseHeadersMap();
    }
    get status() {
        return this.curl.getResponseStatus();
    }
}
const assignURLSearchParam = (target, source) => {
    source.forEach((value, key) => {
        target.append(key, value);
    });
};
class requests {
    constructor(option = {}) {
        var _a;
        this.option = Object.assign({}, option);
        const { cookies, timeout } = option;
        const curl = (_a = this.option).instance || (_a.instance = new libcurl_1.LibCurl());
        if (cookies) {
            (0, utils_1.libcurlSetCookies)(curl, cookies, '.');
        }
        if (timeout) {
            curl.setTimeout(timeout, timeout);
        }
    }
    static session(option = {}) {
        return new requests(option);
    }
    static get(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.session().sendRequest('GET', url, requestOpt);
        });
    }
    static post(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.session().sendRequest('POST', url, requestOpt);
        });
    }
    static put(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.session().sendRequest('PUT', url, requestOpt);
        });
    }
    static patch(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.session().sendRequest('PATCH', url, requestOpt);
        });
    }
    static trace(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.session().sendRequest('TRACE', url, requestOpt);
        });
    }
    static head(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.session().sendRequest('HEAD', url, requestOpt);
        });
    }
    get(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendRequest('GET', url, requestOpt);
        });
    }
    post(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendRequest('POST', url, requestOpt);
        });
    }
    put(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendRequest('PUT', url, requestOpt);
        });
    }
    patch(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendRequest('PATCH', url, requestOpt);
        });
    }
    trace(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendRequest('TRACE', url, requestOpt);
        });
    }
    head(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendRequest('HEAD', url, requestOpt);
        });
    }
    setCookie(key, value, domain = '', path = '') {
        this.option.instance.setCookie({
            name: key,
            value,
            domain,
            path,
        });
    }
    getCookie(key, domain, path) {
        return this.option.instance.getCookie({
            name: key,
            domain: domain || "",
            path: path || "",
        });
    }
    getCookies(domain, path) {
        if (arguments.length == 0) {
            return this.option.instance.getCookies();
        }
        return this.option.instance.getCookies({
            domain: domain || "",
            path: path || "",
        });
    }
    getCookiesMap(domain, path) {
        if (arguments.length == 0) {
            return this.option.instance.getCookiesMap();
        }
        return this.option.instance.getCookiesMap({
            domain: domain || "",
            path: path || "",
        });
    }
    deleteCookie(key, domain, path) {
        this.option.instance.deleteCookie({
            name: key,
            domain: domain,
            path: path || "/",
        });
    }
    sendRequest(method, url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            const { instance: curl, redirect = false, proxy, httpVersion } = this.option;
            const { headers, body, params } = requestOpt || {};
            const url_ = new URL(url);
            if (params) {
                assignURLSearchParam(url_.searchParams, new URLSearchParams(params));
            }
            curl.open(method, url_, true);
            if (headers) {
                curl.setRequestHeaders(headers);
            }
            if (redirect) {
                curl.setRedirect(true);
            }
            if (httpVersion) {
                curl.setHttpVersion(httpVersion);
            }
            if (proxy) {
                curl.setProxy(proxy);
            }
            yield curl.send(body);
            return new requestsResponse(curl);
        });
    }
}
exports.requests = requests;
//# sourceMappingURL=requests.js.map