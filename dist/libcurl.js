"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibCurl = exports.LibCurlError = exports.LibCurlHttpVersionInfo = void 0;
const bindings_1 = __importDefault(require("bindings"));
const utils_1 = require("./utils");
const { BaoLibCurl } = (0, bindings_1.default)('bao_curl_node_addon');
var LibCurlHttpVersionInfo;
(function (LibCurlHttpVersionInfo) {
    LibCurlHttpVersionInfo[LibCurlHttpVersionInfo["http1_1"] = 0] = "http1_1";
    LibCurlHttpVersionInfo[LibCurlHttpVersionInfo["http2"] = 1] = "http2";
})(LibCurlHttpVersionInfo = exports.LibCurlHttpVersionInfo || (exports.LibCurlHttpVersionInfo = {}));
class LibCurlError extends Error {
    constructor(e) {
        super(e);
    }
}
exports.LibCurlError = LibCurlError;
class LibCurl {
    m_libCurl_impl_;
    m_isAsync_;
    m_isSending_;
    constructor() {
        this.m_libCurl_impl_ = new BaoLibCurl();
    }
    checkSending() {
        if (this.m_isSending_) {
            throw new Error('the last request is sending, don\'t send one more request on one instance!');
        }
    }
    open(method, url, async = true) {
        this.checkSending();
        this.m_libCurl_impl_.open(method, url + '');
        this.m_isAsync_ = async;
    }
    setRequestHeader(key, value) {
        this.checkSending();
        this.m_libCurl_impl_.setRequestHeader(key, value);
    }
    setRequestHeaders(headers) {
        this.checkSending();
        if (!headers) {
            return;
        }
        if (headers instanceof Map) {
            headers.forEach((value, key) => this.m_libCurl_impl_.setRequestHeader(key, value));
        }
        else if (typeof headers == 'string') {
            this.m_libCurl_impl_.setRequestHeaders(headers);
        }
        else if (typeof headers == 'object') {
            Object.keys(headers).forEach((key) => {
                const value = headers[key];
                this.m_libCurl_impl_.setRequestHeader(key, value);
            });
        }
        else {
            throw new TypeError('unkown type');
        }
    }
    setProxy(proxyOpt) {
        this.checkSending();
        if (typeof proxyOpt == 'string') {
            this.m_libCurl_impl_.setProxy(proxyOpt);
        }
        else {
            this.m_libCurl_impl_.setProxy(proxyOpt.proxy, proxyOpt.username, proxyOpt.password);
        }
    }
    setTimeout(connectTime, sendTime) {
        this.checkSending();
        if (connectTime > sendTime) {
            throw new Error('连接时间大于发送等待时间.');
        }
        this.m_libCurl_impl_.setTimeout(connectTime, sendTime);
    }
    setCookie(cookieOpt) {
        this.checkSending();
        this.m_libCurl_impl_.setCookie(cookieOpt.name, cookieOpt.value, cookieOpt.domain, cookieOpt.path);
    }
    deleteCookie(cookieOpt) {
        this.checkSending();
        this.m_libCurl_impl_.deleteCookie(cookieOpt.name, cookieOpt.domain, cookieOpt.path || "/");
    }
    getCookies(cookieOpt) {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        return (0, utils_1.httpCookiesToArray)(cookies_).filter((0, utils_1.cookieOptFilter)(cookieOpt)).map(e => `${e[5]}=${encodeURIComponent(e[6])};`).join(' ');
    }
    getCookiesMap(cookieOpt) {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        return (0, utils_1.httpCookiesToArray)(cookies_).filter((0, utils_1.cookieOptFilter)(cookieOpt)).reduce((e, t) => {
            e.set(t[5], {
                domain: t[0],
                secure: t[1],
                path: t[2],
                cors: t[3],
                timestamp: t[4],
                value: t[6],
            });
            return e;
        }, new Map());
    }
    getCookie(cookieOpt) {
        this.checkSending();
        return this.m_libCurl_impl_.getCookie(cookieOpt.name, cookieOpt.domain || "", cookieOpt.path || "");
    }
    getResponseHeaders() {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseHeaders();
    }
    getResponseHeadersMap() {
        this.checkSending();
        const headers_ = this.m_libCurl_impl_.getResponseHeaders();
        return headers_.split('\r\n')
            .slice(1)
            .reduce((e, t) => {
            if (!t) {
                return e;
            }
            const [key, value] = t.split(': ');
            e.set(key, value);
            return e;
        }, new Map());
    }
    getResponseStatus() {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseStatus();
    }
    reset() {
        this.checkSending();
        this.m_libCurl_impl_.reset();
    }
    setRedirect(isAllow) {
        this.checkSending();
        this.m_libCurl_impl_.setRedirect(isAllow);
    }
    printInnerLogger() {
        this.checkSending();
        this.m_libCurl_impl_.printInnerLogger();
    }
    setHttpVersion(version) {
        this.checkSending();
        this.m_libCurl_impl_.setHttpVersion(version);
    }
    send(body) {
        this.checkSending();
        this.m_isSending_ = true;
        if (this.m_isAsync_) {
            return new Promise((resolve, reject) => {
                const callback = (curlcode, curlcodeError) => {
                    this.m_isSending_ = false;
                    if (curlcode != 0) {
                        reject(new LibCurlError(curlcodeError));
                    }
                    else {
                        resolve(void 0);
                    }
                };
                if (body) {
                    if (body instanceof URLSearchParams) {
                        this.m_libCurl_impl_.sendAsync(body + '', callback);
                    }
                    else {
                        this.m_libCurl_impl_.sendAsync(body, callback);
                    }
                }
                else {
                    this.m_libCurl_impl_.sendAsync(callback);
                }
            });
        }
        if (body) {
            if (body instanceof URLSearchParams) {
                this.m_libCurl_impl_.send(body + '');
            }
            else {
                this.m_libCurl_impl_.send(body);
            }
        }
        else {
            this.m_libCurl_impl_.send();
        }
    }
    getResponseBody() {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseBody();
    }
    getResponseString() {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseString();
    }
    getResponseJson() {
        this.checkSending();
        return JSON.parse(this.getResponseString());
    }
}
exports.LibCurl = LibCurl;
//# sourceMappingURL=libcurl.js.map