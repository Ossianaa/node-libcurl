import { LibCurl, LibCurlCookiesAttr, LibCurl_HTTP_VERSION } from "./libcurl";
type LibCurlHeadersInfo = [string, string][] | object | string;
type LibCurlBodyInfo = string | Uint8Array | any;
type LibCurlCookiesInfo = string | object;
type LibCurlHttpVersionInfo = LibCurl_HTTP_VERSION;
type LibCurlMethodInfo = 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
type LibCurlProxyWithAccountInfo = {
    proxy: string;
    username: string;
    password: string;
};
type LibCurlProxyInfo = string | LibCurlProxyWithAccountInfo;
interface LibCurlRequestInfo {
    method?: LibCurlMethodInfo;
    headers?: LibCurlHeadersInfo;
    body?: LibCurlBodyInfo;
    redirect?: boolean;
    cookies?: LibCurlCookiesInfo;
    httpVersion?: LibCurlHttpVersionInfo;
    openInnerLog?: boolean;
    proxy?: LibCurlProxyInfo;
    instance?: LibCurl;
}
interface LibCurlResponseInfo {
    status: () => number;
    arraybuffer: () => Promise<ArrayBuffer>;
    text: () => Promise<string>;
    json: () => Promise<object>;
    jsonp: (callbackName?: string) => Promise<object>;
    headers: () => Promise<string>;
    cookies: () => Promise<string>;
    cookiesMap: () => Promise<LibCurlCookiesAttr>;
}
export declare function fetch(url: string | URL, request?: LibCurlRequestInfo): Promise<LibCurlResponseInfo>;
export {};
