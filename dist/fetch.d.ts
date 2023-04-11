import { LibCurl, LibCurlBodyInfo, LibCurlMethodInfo, LibCurlHeadersInfo, LibCurlCookiesAttr, LibCurlHttpVersionInfo, LibCurlProxyInfo, LibCurlCookiesInfo, LibCurlInterfaceInfo, LibCurlJA3FingerPrintInfo } from "./libcurl";
interface LibCurlRequestInfo {
    method?: LibCurlMethodInfo;
    headers?: LibCurlHeadersInfo;
    body?: LibCurlBodyInfo;
    redirect?: boolean;
    cookies?: LibCurlCookiesInfo;
    httpVersion?: LibCurlHttpVersionInfo;
    openInnerLog?: boolean;
    proxy?: LibCurlProxyInfo;
    timeout?: number;
    interface?: LibCurlInterfaceInfo;
    instance?: LibCurl;
    ja3?: LibCurlJA3FingerPrintInfo;
}
interface LibCurlResponseInfo {
    status: () => number;
    contentLength: () => number;
    arraybuffer: () => Promise<ArrayBuffer>;
    text: () => Promise<string>;
    json: () => Promise<object>;
    headers: () => Promise<string>;
    cookies: () => Promise<string>;
    cookiesMap: () => Promise<LibCurlCookiesAttr>;
}
export declare function fetch(url: string | URL, request?: LibCurlRequestInfo): Promise<LibCurlResponseInfo>;
export {};
