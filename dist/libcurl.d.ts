export declare enum LibCurl_HTTP_VERSION {
    http1_1 = 0,
    http2 = 1
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
    setCookie(key: string, value: string, domain: string): void;
    removeCookie(key: string, domain: string): void;
    getCookies(): string;
    getCookie(key: string): string;
    getResponseHeaders(): string;
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
