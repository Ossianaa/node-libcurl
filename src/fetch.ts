import {
    LibCurl,
    LibCurlBodyInfo,
    LibCurlMethodInfo,
    LibCurlHeadersInfo,
    LibCurlCookiesAttr,
    LibCurlHttpVersionInfo,
    LibCurlProxyInfo,
    LibCurlCookiesInfo,
    LibCurlInterfaceInfo,
    LibCurlJA3FingerPrintInfo,
    LibCurlRequestHeadersAttr,
    LibCurlAkamaiFingerPrintInfo,
} from "./libcurl";
import { libcurlRandomJA3Fingerprint, libcurlSetCookies } from "./utils";

interface LibCurlRequestInfo {
    method?: LibCurlMethodInfo;
    headers?: LibCurlHeadersInfo;
    body?: LibCurlBodyInfo;
    redirect?: boolean;
    cookies?: LibCurlCookiesInfo;
    httpVersion?: LibCurlHttpVersionInfo;
    verbose?: boolean;
    proxy?: LibCurlProxyInfo;
    timeout?: number;
    interface?: LibCurlInterfaceInfo;
    /**
     * 传入LibCurl实例可以做持久化连接
     */
    instance?: LibCurl;
    ja3?: LibCurlJA3FingerPrintInfo;
    akamai?: LibCurlAkamaiFingerPrintInfo;

    /**
     * @experimental
     * 自动重排请求头 对标chrome fetch方法
     */
    autoSortRequestHeaders?: boolean;
}

interface LibCurlResponseInfo {
    status: () => number;
    contentLength: () => number;
    arraybuffer: () => Promise<ArrayBuffer>;
    text: () => Promise<string>;
    json: () => Promise<object>;
    headers: () => Promise<Headers>;
    cookies: () => Promise<string>;
    cookiesMap: () => Promise<LibCurlCookiesAttr>;
}

export async function fetch(
    url: string | URL,
    request: LibCurlRequestInfo = {},
): Promise<LibCurlResponseInfo> {
    request.instance ||= new LibCurl();
    const curl = request.instance;
    const {
        method = "GET",
        headers,
        redirect = false,
        httpVersion = 0,
        verbose = false,
        proxy,
        body,
        cookies,
        timeout,
        interface: interface_,
        ja3,
        akamai,
        autoSortRequestHeaders,
    } = request;
    curl.open(method, url + "");
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
        curl.setInterface(interface_);
    }
    if (verbose) {
        curl.setVerbose(verbose);
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
    if (timeout) {
        curl.setTimeout(timeout, timeout);
    }
    curl.setJA3Fingerprint(ja3 || libcurlRandomJA3Fingerprint());
    if (akamai) {
        curl.setAkamaiFingerprint(akamai);
    }
    if (typeof autoSortRequestHeaders != "undefined") {
        curl.enableAutoSortRequestHeaders(autoSortRequestHeaders);
    }
    await curl.send(body);
    return {
        status: () => curl.getResponseStatus(),
        contentLength: () => curl.getResponseContentLength(),
        arraybuffer: async () => curl.getResponseBody().buffer,
        text: async () => curl.getResponseString(),
        json: async () => JSON.parse(curl.getResponseString()),
        headers: async () => curl.getResponseHeadersMap(),
        cookies: async () => curl.getCookies(),
        cookiesMap: async () => curl.getCookiesMap(),
    } as LibCurlResponseInfo;
}
