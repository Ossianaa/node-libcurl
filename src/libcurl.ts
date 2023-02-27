import bindings from 'bindings'
import { httpCookiesToArray, cookieOptFilter } from './utils';

const { BaoLibCurl } = bindings('bao_curl_node_addon');

export enum LibCurl_HTTP_VERSION {
    http1_1,
    http2,
}

//Domain         Secure  Path    CORS    TimeStamp       Name    Value
export type LibCurlSetCookieOption = {
    domain?: string;
    // secure?: boolean;
    path?: string;
    // cors?: boolean;
    name: string;
    value: string;
}

export type LibCurlCookiesInfo = string | { [key: string]: string };


export type LibCurlGetCookiesOption = {
    domain?: string;
    path?: string;
}

export type LibCurlGetCookieOption = {
    name: string;
    domain: string;
    path?: string;
}

export type LibCurlCookieAttrArray = [
    domain: string, secure: boolean, path: string, cors: boolean, timestamp: number, name: string, value: string
]

export type LibCurlCookieAttrObject = {
    domain: string, secure: boolean, path: string, cors: boolean, timestamp: number, value: string
}

export type LibCurlCookiesAttr = Map<string, LibCurlCookieAttrObject>

export type LibCurlHeadersAttr = Map<string, string>

export type LibCurlHeadersInfo = string | { [key: string]: [value: string] } | LibCurlHeadersAttr

export type LibCurlBodyInfo = string | Uint8Array | any;

export type LibCurlMethodInfo = 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH'

export type LibCurlProxyWithAccountInfo = {
    proxy: string;
    username: string;
    password: string;
};

export type LibCurlProxyInfo = string | LibCurlProxyWithAccountInfo;


export class LibCurlError extends Error {
    constructor(e: string) {
        super(e)
    }
}

export class LibCurl {
    private m_libCurl_impl_: any;
    private m_isAsync_: boolean;
    private m_isSending_: boolean;
    constructor() {
        this.m_libCurl_impl_ = new BaoLibCurl();
    }
    private checkSending(): void {
        if (this.m_isSending_) {
            throw new Error('the last request is sending, don\'t send one more request on one instance!')
        }
    }
    public open(method: LibCurlMethodInfo, url: string, async: boolean = true): void {
        this.checkSending();
        this.m_libCurl_impl_.open(method, url);
        this.m_isAsync_ = async;
    }

    public setRequestHeader(key: string, value: string): void {
        this.checkSending();
        this.m_libCurl_impl_.setRequestHeader(key, value);
    }

    /**
     * 
     * @param headers 多个header 以\n换行链接的文本
     */
    public setRequestHeaders(headers: LibCurlHeadersInfo): void {
        this.checkSending();
        if (!headers) {
            return;
        }
        if (headers instanceof Map) {
            headers.forEach((value, key) => this.m_libCurl_impl_.setRequestHeader(key, value))
        } else if (typeof headers == 'string') {
            this.m_libCurl_impl_.setRequestHeaders(headers);
        } else if (typeof headers == 'object') {
            Object.keys(headers).forEach((key) => {
                const value = headers[key];
                this.m_libCurl_impl_.setRequestHeader(key, value);
            })
        } else {
            throw new TypeError('unkown type')
        }
    }

    /**
     * 
     * @param proxy host:port sample:127.0.0.1:8888
     * @param username 
     * @param password 
     */
    public setProxy(proxyOpt: LibCurlProxyInfo): void {
        this.checkSending();
        if (typeof proxyOpt == 'string') {
            this.m_libCurl_impl_.setProxy(proxyOpt);
        } else {
            this.m_libCurl_impl_.setProxy(proxyOpt.proxy, proxyOpt.username, proxyOpt.password);
        }
    }

    /**
     * 
     * @param connectTime 连接上远程服务器的最长等待时间
     * @param sendTime 发送最长等待时间
     * sendTime时长包含connectTime 所以sendTime要大于connectTime
     */
    public setTimeout(connectTime: number, sendTime: number): void {
        this.checkSending();
        if (connectTime > sendTime) {
            throw new Error('连接时间大于发送等待时间.');
        }
        this.m_libCurl_impl_.setTimeout(connectTime, sendTime);
    }

    /**
     * 
     * @param key 
     * @param value 
     * @param domain cookie作用域 sample: .baidu.com  baike.baidu.com
     */
    public setCookie(cookieOpt: LibCurlSetCookieOption): void {
        this.checkSending();
        this.m_libCurl_impl_.setCookie(cookieOpt.name, cookieOpt.value, cookieOpt.domain, cookieOpt.path);
    }

    /**
     * 
     * @param cookieOpt 
     * @param domain cookie作用域 sample: .baidu.com  baike.baidu.com
     */
    public deleteCookie(cookieOpt: LibCurlGetCookieOption): void {
        this.checkSending();
        this.m_libCurl_impl_.deleteCookie(cookieOpt.name, cookieOpt.domain, cookieOpt.path || "/");
    }

    /**
     * @param {LibCurlGetCookiesOption}cookieOpt
     * @returns 返回所有Cookies sample:'a=b;c=d;'
     */
    public getCookies(cookieOpt?: LibCurlGetCookiesOption): string {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        return httpCookiesToArray(cookies_).filter(cookieOptFilter(cookieOpt)).map(e => `${e[5]}=${encodeURIComponent(e[6])}`).join(';');
    }

    /**
     * @param {LibCurlGetCookiesOption}cookieOpt
     * @returns 返回所有Cookie的Map
     */
    public getCookiesMap(cookieOpt?: LibCurlGetCookiesOption): LibCurlCookiesAttr {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        return httpCookiesToArray(cookies_).filter(cookieOptFilter(cookieOpt)).reduce((e: LibCurlCookiesAttr, t: LibCurlCookieAttrArray) => {
            e.set(t[5], {
                domain: t[0],
                secure: t[1],
                path: t[2],
                cors: t[3],
                timestamp: t[4],
                value: t[6],
            } as LibCurlCookieAttrObject)
            return e;
        }, new Map<string, LibCurlCookieAttrObject>());
    }

    /**
     * 
     * @param cookieOpt
     * @returns 返回该cookieOpt对应的cookieValue
     * sample: 
     */
    public getCookie(cookieOpt: LibCurlGetCookieOption): string {
        this.checkSending();
        return this.m_libCurl_impl_.getCookie(cookieOpt.name, cookieOpt.domain || "", cookieOpt.path || "");
    }

    /**
     * 
     * @returns 返回响应头
     */
    public getResponseHeaders(): string {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseHeaders();
    }

    /**
     * @returns 返回响应头 Map
     */
    public getResponseHeadersMap(): LibCurlHeadersAttr {
        this.checkSending();
        const headers_ = this.m_libCurl_impl_.getResponseHeaders();
        return headers_.split('\r\n')
            .slice(1)//HTTP/1.1 200 OK
            .reduce((e: LibCurlHeadersAttr, t: string) => {
                if (!t) {
                    return e;
                }
                const [key, value] = t.split(': ');
                e.set(key, value);
                return e;
            }, new Map<string, string>());
    }

    /**
     * 
     * @returns 返回状态码
     * sample: 200 403 404
     */
    public getResponseStatus(): number {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseStatus();
    }

    /**
     * 重置curl 包括之前的所有设定
     */
    public reset(): void {
        this.checkSending();
        this.m_libCurl_impl_.reset();
    }

    /**
     * 
     * @param isAllow 是否允许重定向
     */
    public setRedirect(isAllow: boolean): void {
        this.checkSending();
        this.m_libCurl_impl_.setRedirect(isAllow);
    }

    /**
     * 打印libcurl内部的 解析信息、连接信息、tls信息等等
     */
    public printInnerLogger(): void {
        this.checkSending();
        this.m_libCurl_impl_.printInnerLogger();
    }

    /**
     * 
     * @param version 
     * 设置http版本号
     */
    public setHttpVersion(version: LibCurl_HTTP_VERSION): void {
        this.checkSending();
        this.m_libCurl_impl_.setHttpVersion(version);
    }

    /**
     * 
     * @param body POST PUT PATCH时 发送的body
     * 当body不为string或uint8array时 此函数将用JSON.stringify转换对象
     */
    public send(body?: LibCurlBodyInfo): Promise<undefined> | undefined {
        this.checkSending();
        this.m_isSending_ = true;
        if (this.m_isAsync_) {
            return new Promise((resolve, reject) => {
                const callback = (curlcode, curlcodeError) => {
                    this.m_isSending_ = false;
                    if (curlcode != 0) {
                        reject(new LibCurlError(curlcodeError));
                    } else {
                        resolve(void 0);
                    }
                };
                if (body) {
                    this.m_libCurl_impl_.sendAsync(body, callback);
                } else {
                    this.m_libCurl_impl_.sendAsync(callback);
                }
            })
        }
        if (body) {
            this.m_libCurl_impl_.send(body);
        } else {
            this.m_libCurl_impl_.send();
        }
    }

    public getResponseBody(): Uint8Array {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseBody();
    }

    public getResponseString(): string {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseString();
    }

    public getResponseJson(): Object {
        this.checkSending();
        return JSON.parse(this.getResponseString());
    }

    /**
     * 
     * @param callbackName 
     * @returns JSON
     * unsafe
     * sample __WX__({a:1})
     */
    public getResponseJsonp(callbackName?: string): Object {
        this.checkSending();
        const str: string = this.getResponseString();
        let jsonstr: string = str;
        if (callbackName) {
            [, jsonstr] = new RegExp(`\s*${callbackName}[\s\S]*(.*)[\s\S]*`, 'g').exec(str)
        } else {
            try {
                eval(str)
                throw new Error('it seem not a jsonp');
            } catch (error) {
                try {
                    [, callbackName] = /(.*) is not defined/g.exec(error.message);
                    return this.getResponseJsonp(callbackName);
                } catch {
                    throw new Error('it seem not a jsonp')
                }
            }
        }
        return eval(jsonstr);
    }
}