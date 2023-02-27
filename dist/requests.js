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
    jsonp(callbackName) {
        return this.curl.getResponseJsonp(callbackName);
    }
}
class requests {
    constructor(option = {}) {
        var _a;
        this.option = Object.assign({}, option);
        const { cookies, timeout } = option;
        const curl = (_a = this.option).instance || (_a.instance = new libcurl_1.LibCurl());
        if (cookies) {
            const hostname = '.';
            if (typeof cookies == 'string') {
                cookies.replace(/\s+/g, '')
                    .split(';')
                    .reverse()
                    .map(e => e.split('=', 2))
                    .forEach(([key, value]) => {
                    curl.setCookie({
                        name: key,
                        value,
                        domain: hostname,
                        path: '/',
                    });
                });
            }
            else {
                Object.keys(cookies).forEach(key => {
                    curl.setCookie({
                        name: key,
                        value: cookies[key],
                        domain: hostname,
                        path: '/',
                    });
                });
            }
        }
        if (timeout) {
            curl.setTimeout(timeout, timeout);
        }
    }
    static session(option = {}) {
        return new requests(option);
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
            curl.open(method, url + '', true);
            const { headers, body } = requestOpt;
            if (Array.isArray(headers)) {
                headers.forEach(([key, value]) => {
                    curl.setRequestHeader(key, value);
                });
            }
            else if (typeof headers == 'object') {
                Object.keys(headers).forEach((key) => {
                    curl.setRequestHeader(key, headers[key]);
                });
            }
            else if (typeof headers == 'string') {
                curl.setRequestHeaders(headers);
            }
            if (redirect) {
                curl.setRedirect(true);
            }
            if (httpVersion) {
                curl.setHttpVersion(httpVersion);
            }
            if (proxy) {
                if (typeof proxy == "string") {
                    curl.setProxy(proxy);
                }
                else {
                    const { proxy: proxy_, username, password, } = proxy;
                    curl.setProxy(proxy_, username, password);
                }
            }
            let promise;
            if (body) {
                promise = curl.send(body);
            }
            else {
                promise = curl.send();
            }
            try {
                yield promise;
            }
            catch (error) {
                throw error;
            }
            return new requestsResponse(curl);
        });
    }
}
exports.requests = requests;
//# sourceMappingURL=requests.js.map