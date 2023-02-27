export declare enum LibCurl_HTTP_VERSION {
    http1_1 = 0,
    http2 = 1
}
export type LibCurlSetCookieOption = {
    domain?: string;
    path?: string;
    name: string;
    value: string;
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
export declare class LibCurlError extends Error {
    constructor(e: any);
}
export declare class LibCurl {
    private m_libCurl_impl_;
    private m_isAsync_;
    private m_isSending_;
    constructor();
    private checkSending;
    open(method: string, url: string, async?: boolean): void;
    setRequestHeader(key: string, value: string): void;
    setRequestHeaders(headers: string): void;
    setProxy(proxy: string, username?: string, password?: string): void;
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
    setHttpVersion(version: LibCurl_HTTP_VERSION): void;
    send(body?: string | Uint8Array | any): Promise<undefined> | undefined;
    getResponseBody(): Uint8Array;
    getResponseString(): string;
    getResponseJson(): Object;
    getResponseJsonp(callbackName?: string): Object;
}
