import {
    LibCurl,
    LibCurlBodyInfo,
    LibCurlMethodInfo,
    LibCurlHeadersInfo,
    LibCurlCookiesAttr,
    LibCurlHttpVersionInfo,
    LibCurlProxyInfo,
    LibCurlConnectToInfo,
    LibCurlCookiesInfo,
    LibCurlInterfaceInfo,
    LibCurlJA3FingerPrintInfo,
    LibCurlAkamaiFingerPrintInfo,
    LibCurlAutoSortRequestHeadersOption,
    LibCurlSSLCertType,
    LibCurlSSLBlob,
    LibCurlSSLVerifyConfig,
    LibCurlTLSVerifySigalgsInfo,
    LibCurlHttp3FingerPrintInfo,
    applyHttp3Fingerprint,
} from "./libcurl";
import { libcurlSetCookies } from "./utils";

interface LibCurlRequestInfo {
    method?: LibCurlMethodInfo;
    headers?: LibCurlHeadersInfo;
    body?: LibCurlBodyInfo;
    redirect?: boolean;
    cookies?: LibCurlCookiesInfo;
    httpVersion?: LibCurlHttpVersionInfo;
    verbose?: boolean;
    proxy?: LibCurlProxyInfo;
    /**
     * Connection replacement: when the request host is HOST:PORT, actually connect to CONNECT-TO-HOST:CONNECT-TO-PORT
     * Format: HOST:PORT:CONNECT-TO-HOST:CONNECT-TO-PORT
     * sample: "foo.abc.com:443:static.abc.com:443"
     */
    connectTo?: LibCurlConnectToInfo;
    timeout?: number;
    interface?: LibCurlInterfaceInfo;
    /**
     * Pass a LibCurl instance to enable persistent connections
     */
    instance?: LibCurl;
    ja3?: LibCurlJA3FingerPrintInfo;
    akamai?: LibCurlAkamaiFingerPrintInfo;

    /**
     * @experimental
     * Automatically reorder request headers, matching the Chrome fetch behavior
     */
    autoSortRequestHeaders?: LibCurlAutoSortRequestHeadersOption;

    sslCert?: {
        certBlob: LibCurlSSLBlob;
        privateKeyBlob: LibCurlSSLBlob;
        type: LibCurlSSLCertType;
        password?: string;
    };

    sslVerify?: LibCurlSSLVerifyConfig;
    tlsVerifySigalgs?: LibCurlTLSVerifySigalgsInfo;
    http3Fingerprint?: LibCurlHttp3FingerPrintInfo;
}

interface LibCurlResponseInfo {
    status: () => number;
    contentLength: () => number;
    encodedBodySize: () => number;
    arraybuffer: () => Promise<ArrayBuffer>;
    text: () => Promise<string>;
    json: () => Promise<object>;
    headers: () => Promise<Headers>;
    cookies: () => Promise<string>;
    cookiesMap: () => Promise<LibCurlCookiesAttr>;
    lastEffectiveUrl: () => Promise<string>;
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
        connectTo,
        body,
        cookies,
        timeout,
        interface: interface_,
        ja3,
        akamai,
        autoSortRequestHeaders,
        sslCert,
        sslVerify,
        tlsVerifySigalgs,
        http3Fingerprint,
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
        libcurlSetCookies(curl, cookies, hostname);
    }
    if (proxy) {
        curl.setProxy(proxy);
    }
    if (connectTo) {
        curl.setConnectTo(connectTo);
    }
    if (timeout) {
        curl.setTimeout(timeout, timeout);
    }
    curl.setJA3Fingerprint(ja3);
    if (akamai) {
        curl.setAkamaiFingerprint(akamai);
    }
    if (typeof autoSortRequestHeaders != "undefined") {
        curl.setAutoSortRequestHeaders(autoSortRequestHeaders);
    }
    if (typeof sslCert != "undefined") {
        curl.setSSLCert(
            sslCert.certBlob,
            sslCert.privateKeyBlob,
            sslCert.type,
            sslCert.password,
        );
    }
    if (typeof sslVerify != "undefined") {
        curl.setSSLVerify(sslVerify);
    }
    if (typeof tlsVerifySigalgs != "undefined") {
        curl.setTLSVerifySigalgs(tlsVerifySigalgs);
    }
    applyHttp3Fingerprint(curl, httpVersion, http3Fingerprint);
    await curl.send(body);
    return {
        status: () => curl.getResponseStatus(),
        contentLength: () => curl.getResponseContentLength(),
        encodedBodySize: () => curl.getResponseEncodedBodySize(),
        arraybuffer: async () => curl.getResponseBody().buffer,
        text: async () => curl.getResponseString(),
        json: async () => JSON.parse(curl.getResponseString()),
        headers: async () => curl.getResponseHeadersMap(),
        cookies: async () => curl.getCookies(),
        cookiesMap: async () => curl.getCookiesMap(),
        lastEffectiveUrl: async () => curl.getLastEffectiveUrl(),
    } as LibCurlResponseInfo;
}
