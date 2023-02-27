import { LibCurl, LibCurlBodyInfo, LibCurlMethodInfo, LibCurlHeadersInfo, LibCurlCookiesAttr, LibCurl_HTTP_VERSION, LibCurlProxyInfo, LibCurlCookiesInfo } from "./libcurl";
import { libcurlSetCookies } from "./utils";

type LibCurlHttpVersionInfo = LibCurl_HTTP_VERSION;

interface LibCurlRequestInfo {
    method?: LibCurlMethodInfo;
    headers?: LibCurlHeadersInfo;
    body?: LibCurlBodyInfo;
    redirect?: boolean;
    cookies?: LibCurlCookiesInfo;
    httpVersion?: LibCurlHttpVersionInfo;
    openInnerLog?: boolean;
    proxy?: LibCurlProxyInfo;
    /**
     * 传入LibCurl实例可以做持久化连接
     */
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

export async function fetch(url: string | URL, request: LibCurlRequestInfo = {}): Promise<LibCurlResponseInfo> {
    request.instance ||= new LibCurl();
    const curl = request.instance;
    const { method = "GET",
        headers, redirect = false, httpVersion = 0,
        openInnerLog = false, proxy, body, cookies } = request;
    curl.open(method, url + '', true);
    curl.setRequestHeaders(headers);
    if (redirect) {
        curl.setRedirect(true);
    }
    if (httpVersion) {
        curl.setHttpVersion(httpVersion);
    }
    if (openInnerLog) {
        curl.printInnerLogger();
    }
    if (cookies) {
        const { hostname } = new URL(url);
        if (cookies) {
            libcurlSetCookies(curl, cookies, hostname);
        }
    }
    if (proxy) {
        curl.setProxy(proxy);
    }
    let promise: Promise<undefined>;
    if (body) {
        promise = curl.send(body);
    } else {
        promise = curl.send();
    }
    await promise;
    return {
        status: () => curl.getResponseStatus(),
        arraybuffer: async () => curl.getResponseBody().buffer,
        text: async () => curl.getResponseString(),
        json: async () => curl.getResponseJson(),
        jsonp: async (callbackName?: string) => curl.getResponseJsonp(callbackName),
        headers: async () => curl.getResponseHeaders(),
        cookies: async () => curl.getCookies(),
        cookiesMap: async () => curl.getCookiesMap(),
    } as LibCurlResponseInfo;

}