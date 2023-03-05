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
        const { cookies, timeout, verbose } = option;
        const curl = (_a = this.option).instance || (_a.instance = new libcurl_1.LibCurl());
        if (cookies) {
            (0, utils_1.libcurlSetCookies)(curl, cookies, '.');
        }
        if (timeout) {
            curl.setTimeout(timeout, timeout);
        }
        if (verbose) {
            curl.printInnerLogger();
        }
    }
    static session(option = {}) {
        return new requests(option);
    }
    static get(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.sendRequestStaic('GET', url, requestOpt);
        });
    }
    static post(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.sendRequestStaic('POST', url, requestOpt);
        });
    }
    static put(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.sendRequestStaic('PUT', url, requestOpt);
        });
    }
    static patch(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.sendRequestStaic('PATCH', url, requestOpt);
        });
    }
    static trace(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.sendRequestStaic('TRACE', url, requestOpt);
        });
    }
    static head(url, requestOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.sendRequestStaic('HEAD', url, requestOpt);
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
            const { headers, data, json, params } = requestOpt || {};
            if (data && json) {
                throw new libcurl_1.LibCurlError('both data and json exist');
            }
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
            let hasContentType = false;
            if (data || json) {
                const contentTypeFilter = (e) => e.some(e => e.toLocaleLowerCase() == 'content-type');
                if (typeof headers == 'string') {
                    hasContentType = /content-type/i.test(headers);
                }
                else if (headers instanceof Map) {
                    hasContentType = contentTypeFilter([...headers.keys()]);
                }
                else {
                    hasContentType = contentTypeFilter(Object.keys(headers));
                }
            }
            if (json) {
                if (!hasContentType) {
                    curl.setRequestHeader('Content-Type', 'application/json');
                }
                yield curl.send(json);
            }
            else if (data) {
                let sendData = data;
                if (!hasContentType) {
                    if (typeof data == 'string') {
                        curl.setRequestHeader('Content-Type', 'text/plain');
                    }
                    else if (data instanceof URLSearchParams) {
                        curl.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    }
                    else if (data instanceof Uint8Array) {
                        curl.setRequestHeader('Content-Type', 'application/octet-stream');
                    }
                    else {
                        sendData = Object.keys(data).map((e) => {
                            const value = data[e];
                            const type = typeof value;
                            if (['object', 'boolean', 'number']) {
                                return [e, JSON.stringify(value)];
                            }
                            else if (type == 'undefined') {
                                return [e, ''];
                            }
                            else if (type == 'string') {
                                return [e, value];
                            }
                            else {
                                throw new libcurl_1.LibCurlError(`data unkown type ${type}`);
                            }
                        })
                            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                            .join('&');
                    }
                }
                yield curl.send(sendData);
            }
            return new requestsResponse(curl);
        });
    }
    static sendRequestStaic(method, url, requestStaticOpt) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests.session(requestStaticOpt).sendRequest(method, url, requestStaticOpt);
        });
    }
}
exports.requests = requests;
//# sourceMappingURL=requests.js.map