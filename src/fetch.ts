import { LibCurl, LibCurlBodyInfo, LibCurlMethodInfo, LibCurlHeadersInfo, LibCurlCookiesAttr, LibCurlHttpVersionInfo, LibCurlProxyInfo, LibCurlCookiesInfo, LibCurlInterfaceInfo } from "./libcurl";
import { libcurlSetCookies } from "./utils";

interface LibCurlRequestInfo {
    method?: LibCurlMethodInfo;
    headers?: LibCurlHeadersInfo;
    body?: LibCurlBodyInfo;
    redirect?: boolean;
    cookies?: LibCurlCookiesInfo;
    httpVersion?: LibCurlHttpVersionInfo;
    openInnerLog?: boolean;
    proxy?: LibCurlProxyInfo;
    interface?: LibCurlInterfaceInfo;
    /**
     * 传入LibCurl实例可以做持久化连接
     */
    instance?: LibCurl;
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

export async function fetch(url: string | URL, request: LibCurlRequestInfo = {}): Promise<LibCurlResponseInfo> {
    request.instance ||= new LibCurl();
    const curl = request.instance;
    const { method = "GET",
        headers, redirect = false, httpVersion = 0,
        openInnerLog = false, proxy, body, cookies,
        interface: interface_,
    } = request;
    curl.open(method, url + '', true);
    if (headers) {
        curl.setRequestHeaders(headers);
    }
    if (redirect) {
        curl.setRedirect(true);
    }
    if (httpVersion) {
        curl.setHttpVersion(httpVersion);
    }
    if (interface_) {
        curl.setDnsInterface(interface_);
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
    await curl.send(body);
    return {
        status: () => curl.getResponseStatus(),
        contentLength: () => curl.getResponseContentLength(),
        arraybuffer: async () => curl.getResponseBody().buffer,
        text: async () => curl.getResponseString(),
        json: async () => curl.getResponseJson(),
        headers: async () => curl.getResponseHeaders(),
        cookies: async () => curl.getCookies(),
        cookiesMap: async () => curl.getCookiesMap(),
    } as LibCurlResponseInfo;

}