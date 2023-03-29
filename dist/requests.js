"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requests = void 0;
const libcurl_1 = require("./libcurl");
const utils_1 = require("./utils");
class requestsResponse {
    curl;
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
    get contentLength() {
        return this.curl.getResponseContentLength();
    }
}
const assignURLSearchParam = (target, source) => {
    source.forEach((value, key) => {
        target.append(key, value);
    });
};
class requests {
    option;
    needSetCookies;
    constructor(option = {}) {
        this.option = { ...option };
        const { cookies, timeout, verbose, interface: interface_ } = option;
        const curl = this.option.instance ||= new libcurl_1.LibCurl();
        if (cookies) {
            this.needSetCookies = !!cookies;
        }
        if (timeout) {
            curl.setTimeout(timeout, timeout);
        }
        if (verbose) {
            curl.printInnerLogger();
        }
        if (interface_) {
            curl.setDnsInterface(interface_);
        }
    }
    static session(option = {}) {
        return new requests(option);
    }
    static async get(url, requestOpt) {
        return requests.sendRequestStaic('GET', url, requestOpt);
    }
    static async post(url, requestOpt) {
        return requests.sendRequestStaic('POST', url, requestOpt);
    }
    static async put(url, requestOpt) {
        return requests.sendRequestStaic('PUT', url, requestOpt);
    }
    static async patch(url, requestOpt) {
        return requests.sendRequestStaic('PATCH', url, requestOpt);
    }
    static async trace(url, requestOpt) {
        return requests.sendRequestStaic('TRACE', url, requestOpt);
    }
    static async head(url, requestOpt) {
        return requests.sendRequestStaic('HEAD', url, requestOpt);
    }
    async get(url, requestOpt) {
        return this.sendRequest('GET', url, requestOpt);
    }
    async post(url, requestOpt) {
        return this.sendRequest('POST', url, requestOpt);
    }
    async put(url, requestOpt) {
        return this.sendRequest('PUT', url, requestOpt);
    }
    async patch(url, requestOpt) {
        return this.sendRequest('PATCH', url, requestOpt);
    }
    async trace(url, requestOpt) {
        return this.sendRequest('TRACE', url, requestOpt);
    }
    async head(url, requestOpt) {
        return this.sendRequest('HEAD', url, requestOpt);
    }
    setCookie(key, value, domain, path = '') {
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
    async sendRequest(method, url, requestOpt) {
        const { instance: curl, redirect = false, proxy, httpVersion, cookies } = this.option;
        const { headers, data, json, params } = requestOpt || {};
        if (data && json) {
            throw new libcurl_1.LibCurlError('both data and json exist');
        }
        const url_ = new URL(url);
        if (this.needSetCookies) {
            this.needSetCookies = false;
            (0, utils_1.libcurlSetCookies)(curl, cookies, url_.hostname.split('.').slice(-2).join('.'));
        }
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
        if (typeof httpVersion != 'undefined') {
            curl.setHttpVersion(httpVersion);
        }
        if (proxy) {
            curl.setProxy(proxy);
        }
        let hasContentType = false;
        if (headers && (data || json)) {
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
            await curl.send(json);
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
                    curl.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                }
            }
            if (data instanceof Uint8Array) {
            }
            else if (!(data instanceof URLSearchParams) &&
                typeof data == 'object' && data != null) {
                sendData = Object.keys(data).map((e) => {
                    const value = data[e];
                    const type = typeof value;
                    if (['object', 'boolean'].includes(type)) {
                        return [e, JSON.stringify(value)];
                    }
                    else if (type == 'undefined') {
                        return [e, ''];
                    }
                    else if (['string', 'number'].includes(type)) {
                        return [e, value + ''];
                    }
                    else {
                        throw new libcurl_1.LibCurlError(`data unkown type ${type}`);
                    }
                })
                    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                    .join('&');
            }
            await curl.send(sendData);
        }
        else {
            await curl.send();
        }
        return new requestsResponse(curl);
    }
    static async sendRequestStaic(method, url, requestStaticOpt) {
        return requests.session(requestStaticOpt).sendRequest(method, url, requestStaticOpt);
    }
}
exports.requests = requests;
//# sourceMappingURL=requests.js.map