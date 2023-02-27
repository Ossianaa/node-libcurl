"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibCurl = exports.LibCurlError = exports.LibCurl_HTTP_VERSION = void 0;
const bindings_1 = __importDefault(require("bindings"));
const { BaoLibCurl } = (0, bindings_1.default)('bao_curl_node_addon');
var LibCurl_HTTP_VERSION;
(function (LibCurl_HTTP_VERSION) {
    LibCurl_HTTP_VERSION[LibCurl_HTTP_VERSION["http1_1"] = 0] = "http1_1";
    LibCurl_HTTP_VERSION[LibCurl_HTTP_VERSION["http2"] = 1] = "http2";
})(LibCurl_HTTP_VERSION = exports.LibCurl_HTTP_VERSION || (exports.LibCurl_HTTP_VERSION = {}));
const httpCookiesToArray = (cookies) => {
    const stringBooleanToJsBoolean = (e) => {
        switch (e) {
            case 'TRUE':
                return true;
            case 'FALSE':
                return false;
            default:
                throw new Error(`unkonw type ${e}`);
        }
    };
    const cookies_ = [];
    for (const it of cookies.split('\n')) {
        if (!it) {
            continue;
        }
        const [domain, secure, path, cors, timestamp, name, value] = it.split('\t');
        cookies_.push([domain, stringBooleanToJsBoolean(secure), path, stringBooleanToJsBoolean(cors), parseInt(timestamp), name, value]);
    }
    return cookies_;
};
const cookieOptFilter = (cookieOpt) => {
    return (e) => {
        if (cookieOpt) {
            if (cookieOpt.domain) {
                if (cookieOpt.domain != e[0])
                    return false;
            }
            if (cookieOpt.path) {
                if (cookieOpt.path != e[2])
                    return false;
            }
        }
        return true;
    };
};
class LibCurlError extends Error {
    constructor(e) {
        super(e);
    }
}
exports.LibCurlError = LibCurlError;
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
            this.m_libCurl_impl_.setProxy(proxy, username, password);
        }
        else {
            this.m_libCurl_impl_.setProxy(proxy);
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
        return httpCookiesToArray(cookies_).filter(cookieOptFilter(cookieOpt)).map(e => `${e[5]}=${encodeURIComponent(e[6])}`).join(';');
    }
    getCookiesMap(cookieOpt) {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        return httpCookiesToArray(cookies_).filter(cookieOptFilter(cookieOpt)).reduce((e, t) => {
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
            [, jsonstr] = new RegExp(`\s*${callbackName}[\s\S]*(.*)[\s\S]*`, 'g').exec(str);
        }
        else {
            try {
                eval(str);
                throw new Error('it seem not a jsonp');
            }
            catch (error) {
                try {
                    [, callbackName] = /(.*) is not defined/g.exec(error.message);
                    return this.getResponseJsonp(callbackName);
                }
                catch (_a) {
                    throw new Error('it seem not a jsonp');
                }
            }
        }
        return eval(jsonstr);
    }
}
exports.LibCurl = LibCurl;
//# sourceMappingURL=libcurl.js.map