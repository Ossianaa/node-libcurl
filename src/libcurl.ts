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

export type LibCurlInterfaceInfo = string;

export type LibCurlJA3FingerPrintInfo = string;

export enum LibCurlJA3TlsVersion {
    TLSv1_2 = 771,
    TLSv1_3 = 772,
}

export enum LibCurlJA3Cipher {
    'NULL-SHA' = 0x0002,
    'DES-CBC3-SHA' = 0x000A,
    'AES128-SHA' = 0x002F,
    'AES256-SHA' = 0x0035,
    'PSK-AES128-CBC-SHA' = 0x008C,
    'PSK-AES256-CBC-SHA' = 0x008D,
    'AES128-GCM-SHA256' = 0x009C,
    'AES256-GCM-SHA384' = 0x009D,
    'TLS_AES_128_GCM_SHA256' = 0x1301,
    'TLS_AES_256_GCM_SHA384' = 0x1302,
    'TLS_CHACHA20_POLY1305_SHA256' = 0x1303,
    'ECDHE-ECDSA-AES128-SHA' = 0xC009,
    'ECDHE-ECDSA-AES256-SHA' = 0xC00A,
    'ECDHE-RSA-AES128-SHA' = 0xC013,
    'ECDHE-RSA-AES256-SHA' = 0xC014,
    'ECDHE-ECDSA-AES128-GCM-SHA256' = 0xC02B,
    'ECDHE-ECDSA-AES256-GCM-SHA384' = 0xC02C,
    'ECDHE-RSA-AES128-GCM-SHA256' = 0xC02F,
    'ECDHE-RSA-AES256-GCM-SHA384' = 0xC030,
    'ECDHE-PSK-AES128-CBC-SHA' = 0xC035,
    'ECDHE-PSK-AES256-CBC-SHA' = 0xC036,
    'ECDHE-RSA-CHACHA20-POLY1305' = 0xCCA8,
    'ECDHE-ECDSA-CHACHA20-POLY1305' = 0xCCA9,
    'ECDHE-PSK-CHACHA20-POLY1305' = 0xCCAC
}

export enum LibCurlJA3SupportGroup {
    "P-256" = 23,
    "P-384" = 24,
    "P-521" = 25,
    ffdhe2048 = 256,
    ffdhe3072 = 257,
    X25519 = 29,
}

export enum LibCurlJA3EcPointFormat {
    uncompressed = 0,
    compressed_fixed = 1,
    compressed_variable = 2,
}


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
        /* this.setJA3Fingerprint(
            '771,4866-4865-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,27-51-17513-35-45-16-13-0-10-23-18-43-11-5-65281-21-41,29-23-24,0'
        ) */
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
        return httpCookiesToArray(cookies_).filter(cookieOptFilter(cookieOpt)).map(e => `${e[5]}=${encodeURIComponent(e[6])};`).join(' ');
    }

    /**
     * @param {LibCurlGetCookiesOption}cookieOpt
     * @returns 返回所有Cookie的Map 如果有相同的键 则后键覆盖前键
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
     * @returns 返回该cookieOpt对应的cookieValue
     * sample: 
     */
    public getCookie(cookieOpt: LibCurlGetCookieOption): string {
        this.checkSending();
        return this.m_libCurl_impl_.getCookie(cookieOpt.name, cookieOpt.domain || ".", cookieOpt.path || "/");
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
     * 
     * @returns 返回正文长度
     */
    public getResponseContentLength(): number {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseContentLength();
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
    public setHttpVersion(version: LibCurlHttpVersionInfo): void {
        this.checkSending();
        this.m_libCurl_impl_.setHttpVersion(version);
    }

    /**
     * 指定网卡访问
     * @param network 
     */
    public setDnsInterface(network: LibCurlInterfaceInfo): void {
        this.checkSending();
        this.m_libCurl_impl_.setDnsInterface(network);
    }

    /**
     * 指定网卡访问
     * @param network 
     */
    public setJA3Fingerprint(ja3: LibCurlJA3FingerPrintInfo): void {
        this.checkSending();
        const ja3Arr = ja3.split(',');
        if (ja3Arr.length != 5) {
            throw new LibCurlError('ja3 fingerprint error')
        }
        const tlsVersion = ja3Arr.at(0);
        if (!LibCurlJA3TlsVersion[ja3Arr.at(0)]) {
            throw new LibCurlError('ja3 fingerprint tlsVersion no support')
        }
        let tls13_ciphers = [];
        const cipherArr = ja3Arr.at(1).split('-').map((key) => {
            const cipher = LibCurlJA3Cipher[key];
            if (!cipher) {
                throw new LibCurlError(`ja3 fingerprint cipher ${key} no support`)
            }
            if (['4865','4866','4867'].includes(key)) {
                tls13_ciphers.push(cipher);
                return ''
            }
            return cipher;
        }).filter(Boolean);

        // const extensions = ja3Arr.at(2).split('-')

        const supportGroups = ja3Arr.at(3).split('-').map((key) => {
            if (!LibCurlJA3SupportGroup[key]) {
                throw new LibCurlError(`ja3 fingerprint supportGroup ${key} no support`)
            }
            return LibCurlJA3SupportGroup[key];
        });

        /*  const ecPointFormat = LibCurlJA3EcPointFormat[ja3Arr.at(4)];
         if (!ecPointFormat) {
             throw new LibCurlError('ja3 fingerprint ecPointFormat no support')
         } */
        console.log(parseInt(tlsVersion),
            cipherArr.join(':'),
            tls13_ciphers.join(':'),
            "",
            supportGroups.join(':'),
            0,);

        this.m_libCurl_impl_.setJA3Fingerprint(
            parseInt(tlsVersion),
            cipherArr.join(':'),
            tls13_ciphers.join(':'),
            "",
            supportGroups.join(':'),
            0,
        );
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