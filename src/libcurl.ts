import bindings from 'bindings'
import { httpCookiesToArray, cookieOptFilter } from './utils';

const { BaoLibCurl } = bindings('bao_curl_node_addon');

export enum LibCurlHttpVersionInfo {
    http1_1,
    http2,
}

//Domain         Secure  Path    CORS    TimeStamp       Name    Value
export type LibCurlSetCookieOption = {
    domain: string;
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
    domain: string, subDomain: boolean, path: string, secure: boolean, timestamp: number, name: string, value: string
]

export type LibCurlCookieAttrObject = {
    domain: string, subDomain: boolean, path: string, secure: boolean, timestamp: number, value: string
}

export type LibCurlCookiesAttr = Map<string, LibCurlCookieAttrObject>

export type LibCurlHeadersAttr = Map<string, string>

interface LibCurlCommonHeaders {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
    | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0',
    'Content-Type': 'application/x-www-form-urlencoded' |
    'application/json' |
    'application/octet-stream' |
    'application/protobuf' |
    'text/plain',
    'Host': string,
    'Referer': string,
}

export type LibCurlHeadersInfo = string | { [key: string]: [value: string] } | LibCurlHeadersAttr | LibCurlCommonHeaders;

export type LibCurlBodyInfo = string | Uint8Array | URLSearchParams | object;

export type LibCurlMethodInfo = 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH'

export type LibCurlProxyWithAccountInfo = {
    proxy: string;
    username: string;
    password: string;
};

export type LibCurlProxyInfo = string | LibCurlProxyWithAccountInfo;

export type LibCurlURLInfo = string | URL;

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
    public open(method: LibCurlMethodInfo, url: LibCurlURLInfo, async: boolean = true): void {
        this.checkSending();
        this.m_libCurl_impl_.open(method, url + '');
        this.m_isAsync_ = async;
    }

    public setRequestHeader(key: string, value: string): void {
        this.checkSending();
        this.m_libCurl_impl_.setRequestHeader(key, value);
    }

    /**
     * 
     * @param headers
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
     * @param connectTime ?????????????????????????????????????????????
     * @param sendTime ????????????????????????
     * sendTime????????????connectTime ??????sendTime?????????connectTime
     */
    public setTimeout(connectTime: number, sendTime: number): void {
        this.checkSending();
        if (connectTime > sendTime) {
            throw new Error('????????????????????????????????????.');
        }
        this.m_libCurl_impl_.setTimeout(connectTime, sendTime);
    }

    /**
     * 
     * @param key 
     * @param value 
     * @param domain cookie????????? sample: .baidu.com  baike.baidu.com
     */
    public setCookie(cookieOpt: LibCurlSetCookieOption): void {
        this.checkSending();
        this.m_libCurl_impl_.setCookie(cookieOpt.name, cookieOpt.value, cookieOpt.domain, cookieOpt.path);
    }

    /**
     * 
     * @param cookieOpt 
     * @param domain cookie????????? sample: .baidu.com  baike.baidu.com
     */
    public deleteCookie(cookieOpt: LibCurlGetCookieOption): void {
        this.checkSending();
        this.m_libCurl_impl_.deleteCookie(cookieOpt.name, cookieOpt.domain, cookieOpt.path || "/");
    }

    /**
     * @param {LibCurlGetCookiesOption}cookieOpt
     * @returns ????????????Cookies sample:'a=b;c=d;'
     */
    public getCookies(cookieOpt?: LibCurlGetCookiesOption): string {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        return httpCookiesToArray(cookies_).filter(cookieOptFilter(cookieOpt)).map(e => `${e[5]}=${encodeURIComponent(e[6])};`).join(' ');
    }

    /**
     * @param {LibCurlGetCookiesOption}cookieOpt
     * @returns ????????????Cookie???Map ????????????????????? ?????????????????????
     */
    public getCookiesMap(cookieOpt?: LibCurlGetCookiesOption): LibCurlCookiesAttr {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        return httpCookiesToArray(cookies_).filter(cookieOptFilter(cookieOpt)).reduce((e: LibCurlCookiesAttr, t: LibCurlCookieAttrArray) => {
            e.set(t[5], {
                domain: t[0],
                subDomain: t[1],
                path: t[2],
                secure: t[3],
                timestamp: t[4],
                value: t[6],
            } as LibCurlCookieAttrObject)
            return e;
        }, new Map<string, LibCurlCookieAttrObject>());
    }

    /**
     * 
     * @param cookieOpt
     * @returns ?????????cookieOpt?????????cookieValue
     * sample: 
     */
    public getCookie(cookieOpt: LibCurlGetCookieOption): string {
        this.checkSending();
        return this.m_libCurl_impl_.getCookie(cookieOpt.name, cookieOpt.domain || ".", cookieOpt.path || "/");
    }

    /**
     * 
     * @returns ???????????????
     */
    public getResponseHeaders(): string {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseHeaders();
    }

    /**
     * @returns ??????????????? Map
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
     * @returns ???????????????
     * sample: 200 403 404
     */
    public getResponseStatus(): number {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseStatus();
    }

    /**
     * ??????curl ???????????????????????????
     */
    public reset(): void {
        this.checkSending();
        this.m_libCurl_impl_.reset();
    }

    /**
     * 
     * @param isAllow ?????????????????????
     */
    public setRedirect(isAllow: boolean): void {
        this.checkSending();
        this.m_libCurl_impl_.setRedirect(isAllow);
    }

    /**
     * ??????libcurl????????? ??????????????????????????????tls????????????
     */
    public printInnerLogger(): void {
        this.checkSending();
        this.m_libCurl_impl_.printInnerLogger();
    }

    /**
     * 
     * @param version 
     * ??????http?????????
     */
    public setHttpVersion(version: LibCurlHttpVersionInfo): void {
        this.checkSending();
        this.m_libCurl_impl_.setHttpVersion(version);
    }

    /**
     * 
     * @param body POST PUT PATCH??? ?????????body
     * ???body??????string???uint8array??? ???????????????JSON.stringify????????????
     */
    public send(body?: LibCurlBodyInfo): Promise<undefined> | undefined {
        this.checkSending();
        this.m_isSending_ = true;
        if (this.m_isAsync_) {
            return new Promise((resolve, reject) => {
                const callback = (curlcode: number, curlcodeError: string) => {
                    this.m_isSending_ = false;
                    if (curlcode != 0) {
                        reject(new LibCurlError(curlcodeError));
                    } else {
                        resolve(void 0);
                    }
                };
                if (body) {
                    if (body instanceof URLSearchParams) {
                        this.m_libCurl_impl_.sendAsync(body + '', callback);
                    } else {
                        this.m_libCurl_impl_.sendAsync(body, callback);
                    }
                } else {
                    this.m_libCurl_impl_.sendAsync(callback);
                }
            })
        }
        if (body) {
            if (body instanceof URLSearchParams) {
                this.m_libCurl_impl_.send(body + '');
            } else {
                this.m_libCurl_impl_.send(body);
            }
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


}