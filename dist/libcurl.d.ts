export declare enum LibCurlHttpVersionInfo {
    http1_1 = 0,
    http2 = 1
}
export type LibCurlSetCookieOption = {
    domain?: string;
    path?: string;
    name: string;
    value: string;
};
export type LibCurlCookiesInfo = string | {
    [key: string]: string;
};
export type LibCurlGetCookiesOption = {
    domain?: string;
    path?: string;
};
export type LibCurlGetCookieOption = {
    name: string;
    domain: string;
    path?: string;
};
export type LibCurlCookieAttrArray = [
    domain: string,
    secure: boolean,
    path: string,
    cors: boolean,
    timestamp: number,
    name: string,
    value: string
];
export type LibCurlCookieAttrObject = {
    domain: string;
    secure: boolean;
    path: string;
    cors: boolean;
    timestamp: number;
    value: string;
};
export type LibCurlCookiesAttr = Map<string, LibCurlCookieAttrObject>;
export type LibCurlHeadersAttr = Map<string, string>;
interface LibCurlCommonHeaders {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36' | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0';
    'Content-Type': 'application/x-www-form-urlencoded' | 'application/json' | 'application/octet-stream' | 'application/protobuf' | 'text/plain';
    'Host': string;
    'Referer': string;
}
export type LibCurlHeadersInfo = string | {
    [key: string]: [value: string];
} | LibCurlHeadersAttr | LibCurlCommonHeaders;
export type LibCurlBodyInfo = string | Uint8Array | URLSearchParams | object;
export type LibCurlMethodInfo = 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
export type LibCurlProxyWithAccountInfo = {
    proxy: string;
    username: string;
    password: string;
};
export type LibCurlProxyInfo = string | LibCurlProxyWithAccountInfo;
export type LibCurlURLInfo = string | URL;
export declare class LibCurlError extends Error {
    constructor(e: string);
}
export declare class LibCurl {
    private m_libCurl_impl_;
    private m_isAsync_;
    private m_isSending_;
    constructor();
    private checkSending;
    open(method: LibCurlMethodInfo, url: LibCurlURLInfo, async?: boolean): void;
    setRequestHeader(key: string, value: string): void;
    setRequestHeaders(headers: LibCurlHeadersInfo): void;
    setProxy(proxyOpt: LibCurlProxyInfo): void;
    setTimeout(connectTime: number, sendTime: number): void;
    setCookie(cookieOpt: LibCurlSetCookieOption): void;
    deleteCookie(cookieOpt: LibCurlGetCookieOption): void;
    getCookies(cookieOpt?: LibCurlGetCookiesOption): string;
    getCookiesMap(cookieOpt?: LibCurlGetCookiesOption): LibCurlCookiesAttr;
    getCookie(cookieOpt: LibCurlGetCookieOption): string;
    getResponseHeaders(): string;
    getResponseHeadersMap(): LibCurlHeadersAttr;
    getResponseStatus(): number;
    reset(): void;
    setRedirect(isAllow: boolean): void;
    printInnerLogger(): void;
    setHttpVersion(version: LibCurlHttpVersionInfo): void;
    send(body?: LibCurlBodyInfo): Promise<undefined> | undefined;
    getResponseBody(): Uint8Array;
    getResponseString(): string;
    getResponseJson(): Object;
}
export {};
