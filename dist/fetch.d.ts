import { LibCurl, LibCurlBodyInfo, LibCurlMethodInfo, LibCurlHeadersInfo, LibCurlCookiesAttr, LibCurlHttpVersionInfo, LibCurlProxyInfo, LibCurlCookiesInfo } from "./libcurl";
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
