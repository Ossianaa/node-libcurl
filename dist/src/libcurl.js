"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibCurl = void 0;
const bindings_1 = __importDefault(require("bindings"));
const { BaoLibCurl } = (0, bindings_1.default)('bao_curl_node_addon');
var HTTP_VERSION;
(function (HTTP_VERSION) {
    HTTP_VERSION[HTTP_VERSION["http1_1"] = 0] = "http1_1";
    HTTP_VERSION[HTTP_VERSION["http2"] = 1] = "http2";
})(HTTP_VERSION || (HTTP_VERSION = {}));
class LibCurl {
    constructor() {
        this.m_libCurl_impl_ = new BaoLibCurl();
    }
    open(method, url, async = true) {
        this.m_libCurl_impl_.open(method, url);
        this.m_isAsync_ = async;
    }
    setRequestHeader(key, value) {
        this.m_libCurl_impl_.setRequestHeader(key, value);
    }
    setRequestHeaders(headers) {
        this.m_libCurl_impl_.setRequestHeaders(headers);
    }
    setProxy(proxy, username, password) {
        if (username && password) {
            this.m_libCurl_impl_.setProxy(proxy);
        }
        else {
            this.m_libCurl_impl_.setProxy(proxy, username, password);
        }
    }
    setTimeout(connectTime, sendTime) {
        if (connectTime > sendTime) {
            throw new Error('连接时间大于发送等待时间.');
        }
        this.m_libCurl_impl_.setTimeout(connectTime, sendTime);
    }
    setCookie(key, value, domain) {
        this.m_libCurl_impl_.setCookie(key, value, domain);
    }
    removeCookie(key, domain) {
        this.m_libCurl_impl_.removeCookie(key, domain);
    }
    getCookies() {
        return this.m_libCurl_impl_.getCookies();
    }
    getCookie(key) {
        return this.m_libCurl_impl_.getCookie(key);
    }
    getResponseStatus() {
        return this.m_libCurl_impl_.getResponseStatus();
    }
    reset() {
        this.m_libCurl_impl_.reset();
    }
    setRedirect(isAllow) {
        this.m_libCurl_impl_.setRedirect(isAllow);
    }
    printInnerLogger() {
        this.m_libCurl_impl_.printInnerLogger();
    }
    setHttpVersion(version) {
        this.m_libCurl_impl_.setHttpVersion(version);
    }
    send(body) {
        if (this.m_isAsync_) {
            return new Promise((resolve, reject) => {
                if (body) {
                    this.m_libCurl_impl_.sendAsync(body, resolve);
                }
                else {
                    this.m_libCurl_impl_.sendAsync(resolve);
                }
            });
        }
        if (body) {
            this.m_libCurl_impl_.send(body);
        }
        else {
            this.m_libCurl_impl_.send();
        }
    }
    getResponseBody() {
        return this.m_libCurl_impl_.getResponseBody();
    }
    getResponseString() {
        return this.m_libCurl_impl_.getResponseString();
    }
    getResponseJson() {
        return JSON.parse(this.getResponseString());
    }
    getResponseJsonp(callbackName) {
        const str = this.getResponseString();
        let jsonstr = str;
        if (callbackName) {
            [, jsonstr] = new RegExp(`\s*${callbackName}\(([\s\S]*?)\)`, 'g').exec(str);
        }
        return JSON.parse(jsonstr);
    }
}
exports.LibCurl = LibCurl;
//# sourceMappingURL=libcurl.js.map