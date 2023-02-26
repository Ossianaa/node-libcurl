import { LibCurl, LibCurlCookiesAttr, LibCurlHeadersAttr, LibCurl_HTTP_VERSION } from "./libcurl";
type requestsHttpVersionInfo = LibCurl_HTTP_VERSION;
type requestsHeadersInfo = [string, string][] | object | string;
type requestsBodyInfo = string | Uint8Array | any;
type requestsCookiesInfo = string | object;
type requestsWithAccountInfo = {
    proxy: string;
    username: string;
    password: string;
};
type requestsInfo = string | requestsWithAccountInfo;
interface requestsResponseImp {
    readonly text: string;
    readonly json: object;
    readonly buffer: Uint8Array;
    readonly headers: string;
    readonly status: number;
    jsonp(callbackName?: string): object;
}
declare class requestsResponse implements requestsResponseImp {
    private curl;
    constructor(curl: LibCurl);
    get text(): string;
    get json(): object;
    get buffer(): Uint8Array;
    get headers(): string;
    get headersMap(): LibCurlHeadersAttr;
    get status(): number;
    jsonp(callbackName?: string): object;
}
interface requestsInitOption {
    redirect?: boolean;
    cookies?: requestsCookiesInfo;
    proxy?: requestsInfo;
    body?: requestsBodyInfo;
    httpVersion?: requestsHttpVersionInfo;
    instance?: LibCurl;
}
interface requestsOption {
    headers?: requestsHeadersInfo;
    body?: requestsBodyInfo;
}
export declare class requests {
    private option;
    constructor(option?: requestsInitOption);
    static session(option?: requestsInitOption): requests;
    get(url: URL | string, requestOpt?: requestsOption): Promise<requestsResponse>;
    post(url: URL | string, requestOpt?: requestsOption): Promise<requestsResponse>;
    put(url: URL | string, requestOpt?: requestsOption): Promise<requestsResponse>;
    patch(url: URL | string, requestOpt?: requestsOption): Promise<requestsResponse>;
    trace(url: URL | string, requestOpt?: requestsOption): Promise<requestsResponse>;
    setCookie(key: string, value: string, domain?: string, path?: string): void;
    getCookie(key: string, domain?: string, path?: string): string;
    getCookies(domain?: string, path?: string): string;
    getCookiesMap(domain?: string, path?: string): LibCurlCookiesAttr;
    deleteCookie(key: string, domain: string, path?: string): void;
    private sendRequest;
}
export {};
