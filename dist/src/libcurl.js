"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibCurl = exports.LibCurl_HTTP_VERSION = void 0;
const bindings_1 = __importDefault(require("bindings"));
const { BaoLibCurl } = (0, bindings_1.default)('bao_curl_node_addon');
var LibCurl_HTTP_VERSION;
(function (LibCurl_HTTP_VERSION) {
    LibCurl_HTTP_VERSION[LibCurl_HTTP_VERSION["http1_1"] = 0] = "http1_1";
    LibCurl_HTTP_VERSION[LibCurl_HTTP_VERSION["http2"] = 1] = "http2";
})(LibCurl_HTTP_VERSION = exports.LibCurl_HTTP_VERSION || (exports.LibCurl_HTTP_VERSION = {}));
class LibCurl {
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
        this.m_libCurl_impl_.open(method, url);
        this.m_isAsync_ = async;
    }
    setRequestHeader(key, value) {
        this.checkSending();
        this.m_libCurl_impl_.setRequestHeader(key, value);
    }
    setRequestHeaders(headers) {
        this.checkSending();
        this.m_libCurl_impl_.setRequestHeaders(headers);
    }
    setProxy(proxy, username, password) {
        this.checkSending();
        if (username && password) {
            this.m_libCurl_impl_.setProxy(proxy);
        }
        else {
            this.m_libCurl_impl_.setProxy(proxy, username, password);
        }
    }
    setTimeout(connectTime, sendTime) {
        this.checkSending();
        if (connectTime > sendTime) {
            throw new Error('连接时间大于发送等待时间.');
        }
        this.m_libCurl_impl_.setTimeout(connectTime, sendTime);
    }
    setCookie(key, value, domain) {
        this.checkSending();
        this.m_libCurl_impl_.setCookie(key, value, domain);
    }
    removeCookie(key, domain) {
        this.checkSending();
        this.m_libCurl_impl_.removeCookie(key, domain);
    }
    getCookies() {
        this.checkSending();
        return this.m_libCurl_impl_.getCookies();
    }
    getCookie(key) {
        this.checkSending();
        return this.m_libCurl_impl_.getCookie(key);
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
                const callback = () => {
                    this.m_isSending_ = false;
                    resolve(void 0);
                };
                if (body) {
                    this.m_libCurl_impl_.sendAsync(body, callback);
                }
                else {
                    this.m_libCurl_impl_.sendAsync(callback);
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
    getResponseJsonp(callbackName) {
        this.checkSending();
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