import { randomInt } from "crypto";
import {
    BaoLibCurl,
    processRequestHeaders,
    processRequestHeadersV2,
} from "../scripts/bindings";
import {
    httpCookiesToArray,
    cookieOptFilter,
    CaseInsensitiveMap,
    parseHeadersLine,
} from "./utils";

BaoLibCurl.globalInit();

enum LibCurlHttpVersionInfoEnum {
    http1_1,
    http2,
    http3,
    http3_only,
}

export type LibCurlHttpVersionInfo =
    | LibCurlHttpVersionInfoEnum
    | "http1.1"
    | "http2"
    | "http3"
    | "http3_only";

/** True for HTTP/3 requests. The HTTP/3 fingerprint sets
 *  CURLOPT_TRUST_ANCHORS, which is shared with the JA3 (HTTP/2)
 *  fingerprint; applying it on non-H3 requests would overwrite the JA3
 *  trust_anchors value. */
export const isLibCurlHttp3Version = (
    v?: LibCurlHttpVersionInfo,
): boolean =>
    v === "http3" ||
    v === "http3_only" ||
    v === LibCurlHttpVersionInfoEnum.http3 ||
    v === LibCurlHttpVersionInfoEnum.http3_only;

/** Applies the HTTP/3 fingerprint only when the request uses HTTP/3.
 *  The HTTP/3 fingerprint sets CURLOPT_TRUST_ANCHORS, which is shared with
 *  the JA3 (HTTP/2) fingerprint; applying it on non-H3 requests would
 *  overwrite the JA3 trust_anchors value. */
export const applyHttp3Fingerprint = (
    curl: LibCurl,
    httpVersion: LibCurlHttpVersionInfo | undefined,
    http3Fingerprint: LibCurlHttp3FingerPrintInfo | undefined,
): void => {
    if (isLibCurlHttp3Version(httpVersion)) {
        curl.setHttp3Fingerprint(http3Fingerprint || "auto");
    }
};

//Domain         Secure  Path    CORS    TimeStamp       Name    Value
export type LibCurlSetCookieOption = {
    domain: string;
    // secure?: boolean;
    path?: string;
    // cors?: boolean;
    name: string;
    value: string;
};

export type LibCurlCookiesInfo = string | { [key: string]: string };

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
    subDomain: boolean,
    path: string,
    secure: boolean,
    timestamp: number,
    name: string,
    value: string,
];

export type LibCurlCookieAttrObject = {
    domain: string;
    subDomain: boolean;
    path: string;
    secure: boolean;
    timestamp: number;
    value: string;
};

export type LibCurlCookiesAttr = Map<string, LibCurlCookieAttrObject>;

export type LibCurlRequestHeadersAttr = CaseInsensitiveMap;

export type LibCurlInterfaceInfo = string;


import {
    LibCurlJA3FingerPrintImplMap,
    LibCurlAkamaiFingerPrintImplMap,
    LibCurlHttp3FingerPrintImplMap,
    LibCurlJA3TlsVersion,
    LibCurlJA3Cipher,
    LibCurlBoringSSLExtensionPermutation,
    LibCurlJA3SupportGroup,
    LibCurlTLSVerifySigalgs,
    LibCurlTLSVerifySigalgsInfo,
    LibCurlJA3FingerPrintInfo,
    LibCurlAkamaiFingerPrintInfo,
    LibCurlHttp3FingerPrintInfo,
    LibCurlHttp3FingerPrintImpl,
} from "./fingerprints";
export {
    LibCurlJA3FingerPrintImpl,
    LibCurlAkamaiFingerPrintImpl,
    LibCurlHttp3FingerPrintImpl,
    LibCurlJA3FingerPrintInfo,
    LibCurlAkamaiFingerPrintInfo,
    LibCurlHttp3FingerPrintInfo,
    LibCurlJA3TlsVersion,
    LibCurlJA3Cipher,
    LibCurlJA3Extension,
    LibCurlTLSVerifySigalgs,
    LibCurlTLSVerifySigalgsInfo,
    LibCurlJA3SupportGroup,
    LibCurlJA3EcPointFormat,
} from "./fingerprints";


const defaultSortRequestHeadersConfig = {
    prefix: ["host", "connection", "content-length", "pragma", "cache-control"],
    clientHint: [
        "upgrade-insecure-requests",
        "sec-ch-ua",
        "sec-ch-ua-mobile",
        "sec-ch-ua-full-version",
        "sec-ch-ua-arch",
        "sec-ch-ua-platform",
        "sec-ch-ua-platform-version",
        "sec-ch-ua-model",
        "sec-ch-ua-bitness",
        "sec-ch-ua-wow64",
        "sec-ch-ua-full-version-list",
        "sec-ch-ua-form-factors",
        "user-agent",
    ],
    suffix: [
        "accept",
        "access-control-request-method",
        "access-control-request-headers",
        "access-control-request-private-network",
        "origin",
        "x-client-data",
        "sec-fetch-site",
        "sec-fetch-mode",
        "sec-fetch-user",
        "sec-fetch-dest",
        "sec-fetch-storage-access",
        "referer",
        "accept-encoding",
        "accept-language",
        "cookie",
        "priority",
        "if-none-match",
    ],
};

const autoSortRequestHeadersConfig = {
    ...defaultSortRequestHeadersConfig,
    processFunction: processRequestHeaders,
};

const autoSortRequestHeadersConfigV2 = {
    ...defaultSortRequestHeadersConfig,
    processFunction: processRequestHeadersV2,
};

const LibCurlAutoSortRequestHeadersImplMap = (
    opt: LibCurlAutoSortRequestHeadersOption,
    chromeVersion: number,
) => {
    if (opt === "auto" || opt === true) {
        if (chromeVersion) {
            return chromeVersion <= 130
                ? autoSortRequestHeadersConfig
                : autoSortRequestHeadersConfigV2;
        } else {
            return autoSortRequestHeadersConfigV2;
        }
    } else if (opt === "chrome130") {
        return autoSortRequestHeadersConfig;
    } else if (opt === "chrome131") {
        return autoSortRequestHeadersConfigV2;
    } else {
        console.error(
            "[LibCurlAutoSortRequestHeadersOption] unknown option",
            opt,
        );
        return autoSortRequestHeadersConfigV2;
    }
};



interface LibCurlCommonHeaders {
    "User-Agent":
        | "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
        | "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0";
    "Content-Type":
        | "application/x-www-form-urlencoded"
        | "application/json"
        | "application/octet-stream"
        | "application/protobuf"
        | "text/plain";
    Host: string;
    Referer: string;
}

export type LibCurlHeadersInfo =
    | string
    | { [key: string]: string }
    | Array<string>
    | Array<[string, string]>
    | LibCurlRequestHeadersAttr
    | LibCurlCommonHeaders;

export type LibCurlBodyInfo = string | Uint8Array | URLSearchParams | object;

export type LibCurlMethodInfo =
    | "GET"
    | "POST"
    | "HEAD"
    | "PUT"
    | "DELETE"
    | "CONNECT"
    | "OPTIONS"
    | "TRACE"
    | "PATCH";

export type LibCurlProxyWithAccountInfo = {
    proxy: string;
    username: string;
    password: string;
};

export type LibCurlProxyInfo = string | LibCurlProxyWithAccountInfo;

/**
 * CURLOPT_CONNECT_TO connection replacement
 * When the request host is HOST:PORT, actually connect to CONNECT-TO-HOST:CONNECT-TO-PORT
 * Format: HOST:PORT:CONNECT-TO-HOST:CONNECT-TO-PORT
 * sample: foo.abc.com:443:static.abc.com:443
 */
export type LibCurlConnectToInfo = string | Array<string>;

export type LibCurlURLInfo = string | URL;

export type LibCurlSSLBlob = Uint8Array | Buffer;
export type LibCurlSSLCertType = "PEM" | "DER" | "P12";

export type LibCurlSSLVerifyConfig = {
    caPath: string;
};

export class LibCurlError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export type LibCurlAutoSortRequestHeadersOption =
    | "auto"
    | boolean
    | "chrome130"
    | "chrome131";

export type LibCurlRequestHeadersOrder = Array<string>;
export type LibCurlRequestType = "fetch" | "XMLHttpRequest";

/** Contract of the native binding instance wrapped by LibCurl. */
export interface BaoLibCurlImpl {
    open(method: string, url: string): void;
    setRequestHeader(key: string, value: string): void;
    setProxy(proxy: string): void;
    setProxy(proxy: string, username: string, password: string): void;
    setConnectTo(connectTo: string): void;
    setTimeout(connectTime: number, sendTime: number): void;
    setCookie(
        name: string,
        value: string,
        domain: string,
        path: string,
    ): void;
    deleteCookie(name: string, domain: string, path: string): void;
    getCookies(): string;
    getCookie(name: string, domain: string, path: string): string;
    getResponseHeaders(): string;
    getResponseStatus(): number;
    getResponseContentLength(): number;
    getResponseEncodedBodySize(): number;
    setSSLVerify(caPath: string): void;
    setTLSVerifySigalgs(sigalgs: string): void;
    setRedirect(enable: boolean): void;
    setVerbose(enable: boolean): void;
    setHttpVersion(version: number): void;
    setInterface(network: string): void;
    setJA3Fingerprint(
        tlsVersion: number,
        cipher: string,
        tls13Cipher: string,
        extensions: string,
        supportGroups: string,
        ecPointFormats: number,
        trustAnchors: string,
    ): void;
    setAkamaiFingerprint(
        settings: string,
        windowUpdate: number,
        streams: string,
        pseudoHeadersOrder: string,
    ): void;
    setHttp3Fingerprint(
        scid: string,
        settings: string,
        transportParams: string,
        tls: string,
        permutation: string,
        verifySigalgs: string,
        trustAnchors: string,
    ): void;
    setHttp2NextStreamId(streamId: number): void;
    setHttp2StreamWeight(weight: number): void;
    setSSLCert(
        certBlob: Uint8Array,
        privateKeyBlob: Uint8Array | null,
        type: string,
        password: string,
    ): void;
    sendAsync(body?: string | Uint8Array): Promise<undefined>;
    getResponseBody(): Uint8Array;
    getResponseString(): string;
    getLastEffectiveUrl(): string;
    getLastCode(): number;
    getLastCodeError(): string;
}

/** Contract of the native WebSocket binding wrapped by LibCurlWebSocket. */
export interface LibCurlWebSocketImpl {
    open(url: string): void;
    send(data: Uint8Array | string): void;
    close(): void;
    setOnOpen(callback: () => void): void;
    setOnClose(callback: () => void): void;
    setOnError(callback: (message: string) => void): void;
    setOnMessage(callback: (data: Uint8Array) => void): void;
}

export class LibCurl {
    private m_libCurl_impl_: BaoLibCurlImpl;
    private m_method_: LibCurlMethodInfo = "GET";
    private m_isSending_: boolean = false;
    private m_requestHeaders_: LibCurlRequestHeadersAttr =
        new CaseInsensitiveMap();
    private m_autoSortRequestHeaders: LibCurlAutoSortRequestHeadersOption =
        "auto";
    private m_nextRequestHeadersOrderMap: CaseInsensitiveMap =
        new CaseInsensitiveMap();
    private m_requestType: LibCurlRequestType = "fetch";
    private m_nextRequestType: LibCurlRequestType | null = null;
    private m_chromeVersion: number = 152;
    private m_hasCustomTLSVerifySigalgs: boolean = false;
    /* Last JA3/HTTP/3 fingerprint arguments actually applied to the native
     * handle. Re-applying identical values on every request is skipped;
     * preset fingerprints ("chrome152" etc.) re-randomize per request
     * (extension order, transport params), so their resolved arguments
     * differ and are applied again. JA3 and HTTP/3 fingerprints share
     * CURLOPT_TRUST_ANCHORS, so applying one invalidates the other's
     * cached arguments. */
    private m_lastJA3FingerprintArgs: string | null = null;
    private m_lastHttp3FingerprintArgs: string | null = null;

    private formatTLSVerifySigalgs(
        sigalgs: LibCurlTLSVerifySigalgsInfo,
    ): string {
        if (typeof sigalgs === "string") {
            return sigalgs;
        }
        return sigalgs
            .map((sigalg) => {
                if (typeof sigalg === "number") {
                    return `0x${sigalg.toString(16).padStart(4, "0")}`;
                }
                if (typeof sigalg === "string") {
                    if (sigalg.startsWith("0x") || sigalg.startsWith("0X")) {
                        return sigalg;
                    }
                    const value =
                        LibCurlTLSVerifySigalgs[
                            sigalg as keyof typeof LibCurlTLSVerifySigalgs
                        ];
                    if (typeof value === "number") {
                        return `0x${value.toString(16).padStart(4, "0")}`;
                    }
                    return sigalg;
                }
                return String(sigalg);
            })
            .join(",");
    }

    constructor() {
        this.m_libCurl_impl_ = new BaoLibCurl();
    }

    /** The underlying native binding instance (advanced use). */
    public get impl(): BaoLibCurlImpl {
        return this.m_libCurl_impl_;
    }
    private checkSending(): void {
        if (this.m_isSending_) {
            throw new LibCurlError(
                "the last request is sending, don't send one more request on one instance!",
            );
        }
    }

    private checkError(): void {
        const code: number = this.m_libCurl_impl_.getLastCode();
        if (code == 0) {
            return;
        }
        const error: string = this.m_libCurl_impl_.getLastCodeError();
        throw new LibCurlError(error);
    }

    public setAutoSortRequestHeaders(
        option: LibCurlAutoSortRequestHeadersOption,
    ) {
        this.m_autoSortRequestHeaders = option;
    }

    public setRequestType(requestType: LibCurlRequestType) {
        this.m_requestType = requestType;
    }

    public setNextRequestType(requestType: LibCurlRequestType) {
        this.m_nextRequestType = requestType;
    }

    public setNextRequestHeadersOrder(
        headerKeysOrder: LibCurlRequestHeadersOrder,
    ) {
        const map = new CaseInsensitiveMap();
        headerKeysOrder.forEach((key) => map.set(key, ""));
        this.m_nextRequestHeadersOrderMap = map;
    }

    public open(method: LibCurlMethodInfo, url: LibCurlURLInfo): void {
        this.checkSending();
        this.m_method_ = method;
        this.m_libCurl_impl_.open(method, url + "");
    }

    public setRequestHeader(key: string, value: string): void {
        if (typeof key != "string" || typeof value != "string") {
            throw new LibCurlError("setRequestHeader type error");
        }
        const _key = key.trimStart();
        if (/user-agent/i.test(_key)) {
            const chromeVersion = value.match(/Chrome\/([\d.]+)/i)?.[1];
            if (chromeVersion) {
                this.m_chromeVersion = parseInt(chromeVersion);
            }
        }
        this.m_requestHeaders_.set(_key, value);
    }

    /**
     *
     * @param headers
     */
    public setRequestHeaders(headers: LibCurlHeadersInfo): void {
        this.checkSending();
        if (!headers) {
            return;
        }
        if (headers instanceof CaseInsensitiveMap) {
            headers.forEach((value, key) => this.setRequestHeader(key, value));
        } else if (typeof headers == "string") {
            headers
                .split(/\r?\n/)
                .filter((line) => line.trim() !== "")
                .forEach((line) => {
                    try {
                        const { key, value } = parseHeadersLine(line);
                        this.setRequestHeader(key, value);
                    } catch (error) {
                        throw new LibCurlError(
                            `setRequestHeader error [${line}]`,
                        );
                    }
                });
        } else if (Array.isArray(headers)) {
            if (typeof headers[0] === "string") {
                headers.forEach((line) => {
                    if (typeof line != "string") {
                        throw new LibCurlError(
                            `setRequestHeader type error [${line}]`,
                        );
                    }
                    try {
                        const { key, value } = parseHeadersLine(line);
                        this.setRequestHeader(key, value);
                    } catch (error) {
                        throw new LibCurlError(
                            `setRequestHeader error [${line}]`,
                        );
                    }
                });
            } else {
                headers.forEach((line) => {
                    if (!Array.isArray(line)) {
                        throw new LibCurlError(
                            `setRequestHeader type error [${line}]`,
                        );
                    }
                    try {
                        const [key, value] = line;
                        this.setRequestHeader(key, value);
                    } catch (error) {
                        throw new LibCurlError(
                            `setRequestHeader error [${line}]`,
                        );
                    }
                });
            }
        } else if (typeof headers == "object") {
            Object.keys(headers).forEach((key) => {
                const value = headers[key];
                this.setRequestHeader(key, value);
            });
        } else {
            throw new LibCurlError("setRequestHeader unkown type");
        }
    }

    /**
     *
     * @param proxy host:port sample:127.0.0.1:8888
     * @param username
     * @param password
     */
    public setProxy(proxyOpt: LibCurlProxyInfo): void {
        this.checkSending();
        if (typeof proxyOpt == "string") {
            this.m_libCurl_impl_.setProxy(proxyOpt);
        } else {
            this.m_libCurl_impl_.setProxy(
                proxyOpt.proxy,
                proxyOpt.username,
                proxyOpt.password,
            );
        }
        this.checkError();
    }

    /**
     * Connection replacement: when the request host is HOST:PORT, actually connect to CONNECT-TO-HOST:CONNECT-TO-PORT
     * DNS resolution points directly to CONNECT-TO-HOST
     * @param connectTo format: HOST:PORT:CONNECT-TO-HOST:CONNECT-TO-PORT
     * sample: foo.abc.com:443:static.abc.com:443
     */
    public setConnectTo(connectTo: LibCurlConnectToInfo): void {
        this.checkSending();
        this.m_libCurl_impl_.setConnectTo(
            Array.isArray(connectTo) ? connectTo.join("\n") : connectTo,
        );
        this.checkError();
    }

    /**
     *
     * @param connectTime max time to connect to the remote server
     * @param sendTime max time to send
     * sendTime includes connectTime, so sendTime must be greater than connectTime
     */
    public setTimeout(connectTime: number, sendTime: number): void {
        this.checkSending();
        if (connectTime > sendTime) {
            throw new LibCurlError("connectTime cannot be greater than sendTime.");
        }
        this.m_libCurl_impl_.setTimeout(connectTime, sendTime);
    }

    /**
     *
     * @param key
     * @param value
     * @param domain cookie scope sample: .baidu.com  baike.baidu.com
     */
    public setCookie(cookieOpt: LibCurlSetCookieOption): void {
        this.checkSending();
        this.m_libCurl_impl_.setCookie(
            cookieOpt.name,
            cookieOpt.value,
            cookieOpt.domain,
            cookieOpt.path || "/",
        );
    }

    /**
     *
     * @param cookieOpt
     * @param domain cookie scope sample: .baidu.com  baike.baidu.com
     */
    public deleteCookie(cookieOpt: LibCurlGetCookieOption): void {
        this.checkSending();
        this.m_libCurl_impl_.deleteCookie(
            cookieOpt.name,
            cookieOpt.domain,
            cookieOpt.path || "/",
        );
    }

    /**
     * @param {LibCurlGetCookiesOption}cookieOpt
     * @returns all cookies sample:'a=b;c=d;'
     */
    public getCookies(cookieOpt?: LibCurlGetCookiesOption): string {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        let arr = httpCookiesToArray(cookies_);
        if (cookieOpt) {
            arr = arr.filter(cookieOptFilter(cookieOpt));
        }
        return arr.map((e) => `${e[5]}=${encodeURIComponent(e[6])};`).join(" ");
    }

    /**
     * @param {LibCurlGetCookiesOption}cookieOpt
     * @returns a Map of all cookies; on duplicate keys the later key overrides the former
     */
    public getCookiesMap(
        cookieOpt?: LibCurlGetCookiesOption,
    ): LibCurlCookiesAttr {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        let arr = httpCookiesToArray(cookies_);
        if (cookieOpt) {
            arr = arr.filter(cookieOptFilter(cookieOpt));
        }
        return arr.reduce(
            (e: LibCurlCookiesAttr, t: LibCurlCookieAttrArray) => {
                e.set(t[5], {
                    domain: t[0],
                    subDomain: t[1],
                    path: t[2],
                    secure: t[3],
                    timestamp: t[4],
                    value: t[6],
                } as LibCurlCookieAttrObject);
                return e;
            },
            new Map<string, LibCurlCookieAttrObject>(),
        );
    }

    /**
     *
     * @param cookieOpt
     * @returns the cookieValue for the given cookieOpt
     * sample:
     */
    public getCookie(cookieOpt: LibCurlGetCookieOption): string {
        this.checkSending();
        return this.m_libCurl_impl_.getCookie(
            cookieOpt.name,
            cookieOpt.domain || ".",
            cookieOpt.path || "/",
        );
    }

    /**
     *
     * @returns the response headers
     */
    public getResponseHeaders(): string {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseHeaders();
    }

    /**
     * @returns a Map of the response headers
     */
    public getResponseHeadersMap(): Headers {
        this.checkSending();
        const headers_ = this.m_libCurl_impl_.getResponseHeaders();
        const lines = headers_
            .split("\r\n")
            .filter(Boolean)
            .filter((header: string) => !header.startsWith("HTTP/"))
            .filter((header: string) => header.includes(": "));
        return new Headers(
            lines.map((line: string) => {
                const [key, value] = line.split(": ", 2);
                return [key, value] as [string, string];
            }),
        );
    }

    /**
     *
     * @returns the response status code
     * sample: 200 403 404
     */
    public getResponseStatus(): number {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseStatus();
    }

    /**
     *
     * @returns the response body length
     */
    public getResponseContentLength(): number {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseContentLength();
    }

    /**
     *
     * @returns the transfer-encoded body size (before decompression)
     */
    public getResponseEncodedBodySize(): number {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseEncodedBodySize();
    }

    /**
     *
     * @param config whether to verify the certificate and hostname
     */
    public setSSLVerify(config: LibCurlSSLVerifyConfig): void {
        this.checkSending();
        this.m_libCurl_impl_.setSSLVerify(config.caPath);
    }

    public setTLSVerifySigalgs(sigalgs: LibCurlTLSVerifySigalgsInfo): void {
        this.checkSending();
        this.m_hasCustomTLSVerifySigalgs = true;
        this.applyTLSVerifySigalgs(sigalgs);
    }

    private applyTLSVerifySigalgs(sigalgs: LibCurlTLSVerifySigalgsInfo): void {
        const formatted = this.formatTLSVerifySigalgs(sigalgs);
        if (!formatted) {
            return;
        }
        this.m_libCurl_impl_.setTLSVerifySigalgs(formatted);
    }

    /**
     *
     * @param enable whether to allow redirects
     */
    public setRedirect(enable: boolean): void {
        this.checkSending();
        this.m_libCurl_impl_.setRedirect(enable);
    }

    /**
     * Print libcurl internal info: DNS resolution, connection, TLS, etc.
     */
    public setVerbose(enable: boolean): void {
        this.checkSending();
        this.m_libCurl_impl_.setVerbose(!!enable);
    }

    /**
     *
     * @param version
     * Set the HTTP version
     */
    public setHttpVersion(version: LibCurlHttpVersionInfo): void {
        this.checkSending();
        const _version =
            typeof version == "string"
                ? ({ "http1.1": 0, http2: 1, http3: 2, http3_only: 3 } as const)[
                      version
                  ]
                : version;
        this.m_libCurl_impl_.setHttpVersion(_version);
    }

    /**
     * Bind requests to a specific network interface
     * @param network
     */
    public setInterface(network: LibCurlInterfaceInfo): void {
        this.checkSending();
        this.m_libCurl_impl_.setInterface(network);
    }

    /**
     * Set the JA3 fingerprint
     * @param ja3
     */
    public setJA3Fingerprint(ja3: LibCurlJA3FingerPrintInfo = "auto"): void {
        this.checkSending();
        const [ja3String, tlsVerifySigalgs, trustAnchors] =
            LibCurlJA3FingerPrintImplMap[ja3]?.(this.m_chromeVersion) || [
                ja3,
                [],
                undefined,
            ];
        const ja3Arr = ja3String.split(",");
        if (ja3Arr.length != 5) {
            throw new LibCurlError("ja3 fingerprint error");
        }
        const tlsVersion = ja3Arr.at(0);
        if (!LibCurlJA3TlsVersion[ja3Arr.at(0)]) {
            throw new LibCurlError("ja3 fingerprint tlsVersion no support");
        }
        let tls13_ciphers: number[] = [];
        const cipherArr = ja3Arr
            .at(1)
            .split("-")
            .map((key) => {
                const cipher = LibCurlJA3Cipher[key];
                if (!cipher) {
                    throw new LibCurlError(
                        `ja3 fingerprint cipher ${key} no support`,
                    );
                }
                if (cipher.startsWith("TLS_")) {
                    const pos = ["4865", "4866", "4867"].indexOf(key);
                    if (pos == -1) {
                        throw new LibCurlError(
                            `ja3 fingerprint TLSv1.3 cipher ${key} no support`,
                        );
                    }
                    tls13_ciphers.push(pos + 1);
                    return;
                }
                return cipher;
            })
            .filter(Boolean);

        const extensions = ja3Arr
            .at(2)
            .split("-")
            .filter((extension) => {
                return extension != "21";
            })
            .map((e) => parseInt(e));
        const extension_permutation = extensions.map((extension) => {
            const pos = LibCurlBoringSSLExtensionPermutation.indexOf(extension);
            if (pos == -1) {
                throw new LibCurlError(
                    `ja3 fingerprint extension ${extension} no support`,
                );
            }
            return pos;
        });
        const supportGroups = ja3Arr
            .at(3)
            .split("-")
            .map((key) => {
                if (!LibCurlJA3SupportGroup[key]) {
                    throw new LibCurlError(
                        `ja3 fingerprint supportGroup ${key} no support`,
                    );
                }
                return LibCurlJA3SupportGroup[key];
            });
        /*  const ecPointFormat = LibCurlJA3EcPointFormat[ja3Arr.at(4)];
         if (!ecPointFormat) {
             throw new LibCurlError('ja3 fingerprint ecPointFormat no support')
         } */
        const ja3Args = [
            parseInt(tlsVersion),
            cipherArr.join(":"),
            tls13_ciphers.join(""),
            extension_permutation.join(","),
            supportGroups.join(":"),
            0,
            trustAnchors || "",
        ].join("\u0001");
        if (ja3Args === this.m_lastJA3FingerprintArgs) {
            return;
        }
        this.m_libCurl_impl_.setJA3Fingerprint(
            parseInt(tlsVersion),
            cipherArr.join(":"),
            tls13_ciphers.join(""),
            extension_permutation.join(","),
            supportGroups.join(":"),
            0,
            trustAnchors || "",
        );
        this.m_lastJA3FingerprintArgs = ja3Args;
        /* CURLOPT_TRUST_ANCHORS is shared with the HTTP/3 fingerprint */
        this.m_lastHttp3FingerprintArgs = null;
        if (!this.m_hasCustomTLSVerifySigalgs) {
            this.applyTLSVerifySigalgs(tlsVerifySigalgs);
        }
    }

    /**
     * Set the Akamai h2 fingerprint
     * @param akamai
     */
    public setAkamaiFingerprint(
        akamai: LibCurlAkamaiFingerPrintInfo = "auto",
    ): void {
        const [settings, window_update, streams, pseudo_headers_order] = (
            LibCurlAkamaiFingerPrintImplMap[akamai]?.(this.m_chromeVersion) ||
            akamai
        ).split("|");
        this.m_libCurl_impl_.setAkamaiFingerprint(
            settings.replaceAll(",", ";"),
            parseInt(window_update),
            streams,
            pseudo_headers_order.replaceAll(",", ""),
        );
    }

    /**
     * Set the HTTP/3 fingerprint
     */
    public setHttp3Fingerprint(
        http3Fingerprint: LibCurlHttp3FingerPrintInfo = "auto",
    ): void {
        this.checkSending();
        const presetConfig =
            typeof http3Fingerprint == "string"
                ? LibCurlHttp3FingerPrintImplMap[
                      http3Fingerprint as LibCurlHttp3FingerPrintImpl
                  ]?.(this.m_chromeVersion)
                : undefined;
        const config = presetConfig || http3Fingerprint;
        if (typeof config == "string") {
            throw new LibCurlError("http3 fingerprint no support");
        }
        const http3Args = [
            config.scid,
            config.settings,
            config.transport_params,
            config.tls,
            config.permutation,
            config.verify_sigalgs,
            config.trust_anchors || "",
        ].join("\u0001");
        if (http3Args === this.m_lastHttp3FingerprintArgs) {
            return;
        }
        this.m_libCurl_impl_.setHttp3Fingerprint(
            config.scid,
            config.settings,
            config.transport_params,
            config.tls,
            config.permutation,
            config.verify_sigalgs,
            config.trust_anchors || "",
        );
        this.m_lastHttp3FingerprintArgs = http3Args;
        /* CURLOPT_TRUST_ANCHORS is shared with the JA3 (HTTP/2) fingerprint */
        this.m_lastJA3FingerprintArgs = null;
    }

    /**
     * Set the h2 stream_id
     * @param stream_id
     */
    public setHttp2NextStreamId(stream_id: number): void {
        if (stream_id < 1 || stream_id % 2 == 0) {
            throw new LibCurlError("stream_id error");
        }
        this.m_libCurl_impl_.setHttp2NextStreamId(stream_id);
    }

    /**
     * Set the h2 weight
     * @param weight
     */
    public setHttp2StreamWeight(weight: number): void {
        if (weight < 0 || weight > 256) {
            throw new LibCurlError("weight error");
        }
        this.m_libCurl_impl_.setHttp2StreamWeight(weight);
    }

    public setSSLCert(
        certBlob: LibCurlSSLBlob,
        privateKeyBlob?: LibCurlSSLBlob,
        type: LibCurlSSLCertType = "PEM",
        password: string = "",
    ): void {
        this.m_libCurl_impl_.setSSLCert(
            certBlob,
            privateKeyBlob || null,
            type,
            password,
        );
    }

    private beforeProcessRequestHeaders(contentLength?: number) {
        if (typeof contentLength == "number") {
            this.setRequestHeader("Content-Length", contentLength + "");
        }
        if (!this.m_requestHeaders_.has("Cookie")) {
            this.setRequestHeader("Cookie", "");
        }
        if (this.m_nextRequestHeadersOrderMap.size > 0) {
            const keys = this.m_requestHeaders_.keys();
            const sortedKeys = this.m_nextRequestHeadersOrderMap
                .keys()
                .filter((key) => this.m_requestHeaders_.has(key));
            const unsortedKeys = keys.filter(
                (key) => !this.m_nextRequestHeadersOrderMap.has(key),
            );
            for (const key of [...sortedKeys, ...unsortedKeys]) {
                this.m_libCurl_impl_.setRequestHeader(
                    key,
                    this.m_requestHeaders_.get(key),
                );
            }
            this.m_requestHeaders_.clear();
            this.m_nextRequestHeadersOrderMap = new CaseInsensitiveMap();
            return;
        }
        if (!this.m_autoSortRequestHeaders) {
            for (const [key, value] of this.m_requestHeaders_.entries()) {
                this.m_libCurl_impl_.setRequestHeader(key, value);
            }
            this.m_requestHeaders_.clear();
            return;
        }
        if (!this.m_requestHeaders_.has("Accept")) {
            this.m_requestHeaders_.set("Accept", "*/*");
        }
        if (!this.m_requestHeaders_.has("Accept-Encoding")) {
            this.m_requestHeaders_.set(
                "Accept-Encoding",
                "gzip, deflate, br, zstd",
            );
        }

        let config = LibCurlAutoSortRequestHeadersImplMap(
            this.m_autoSortRequestHeaders,
            this.m_chromeVersion,
        );

        const processedFixedPrefixArr: Array<[string, string]> = [];
        const processedFixedSuffixArr: Array<[string, string]> = [];

        const extraHeaders: Array<[string, string]> = [];
        let customHeaders: Array<[string, string]> = [];
        for (const [key, value] of this.m_requestHeaders_.entries()) {
            const _key = (
                key.at(-1) == ":" ? key.slice(0, -1) : key
            ).toLowerCase();
            if (config.prefix.includes(_key)) {
                processedFixedPrefixArr.push([key, value]);
            } else if (config.suffix.includes(_key)) {
                if (_key == "accept" && value != "*/*") {
                    extraHeaders.push([key, value]);
                } else {
                    processedFixedSuffixArr.push([key, value]);
                    continue;
                }
            } else if (config.clientHint.includes(_key)) {
                extraHeaders.push([key, value]);
            } else {
                customHeaders.push([key, value]);
            }
        }
        let requestType = this.m_requestType;
        if (this.m_nextRequestType) {
            requestType = this.m_nextRequestType;
            this.m_nextRequestType = null;
        }

        extraHeaders.sort((a, b) =>
            config.clientHint.indexOf(a[0].toLowerCase()) <
            config.clientHint.indexOf(b[0].toLowerCase())
                ? -1
                : 1,
        );
        processedFixedPrefixArr.sort((a, b) =>
            config.prefix.indexOf(a[0].toLowerCase()) <
            config.prefix.indexOf(b[0].toLowerCase())
                ? -1
                : 1,
        );
        processedFixedSuffixArr.sort((a, b) =>
            config.suffix.indexOf(a[0].toLowerCase()) <
            config.suffix.indexOf(b[0].toLowerCase())
                ? -1
                : 1,
        );
        const processedHeaders = config
            .processFunction(
                extraHeaders.map((e) => e[0].toLowerCase()),
                customHeaders.map((e) => e[0].toLowerCase()),
                requestType === "fetch",
            )
            .reduce((e: Array<[string, string]>, key: string) => {
                const found =
                    extraHeaders.find((j) => j[0].toLowerCase() == key) ||
                    customHeaders.find((j) => j[0].toLowerCase() == key);
                if (!found) {
                    return e;
                }
                const [_key, value] = found;
                e.push([_key, value]);
                return e;
            }, []);

        for (const [key, value] of [
            ...processedFixedPrefixArr,
            ...processedHeaders,
            ...processedFixedSuffixArr,
        ]) {
            this.m_libCurl_impl_.setRequestHeader(key, value);
        }
        this.m_requestHeaders_.clear();
    }

    /**
     *
     * @param body the body sent for POST PUT PATCH requests
     * When body is not a string or Uint8Array, this function converts objects with JSON.stringify
     */
    public async send(body?: LibCurlBodyInfo): Promise<undefined> {
        this.checkSending();
        this.m_isSending_ = true;
        const isSubmitBody = !["GET", "HEAD", "OPTIONS"].includes(
            this.m_method_,
        );
        let promise;
        if (body) {
            if (!isSubmitBody) {
                throw new LibCurlError(
                    "Request with GET/HEAD method cannot have body",
                );
            }
            let sendData: string | Uint8Array;
            if (body instanceof URLSearchParams) {
                sendData = body + "";
            } else if (body instanceof Uint8Array) {
                sendData = body;
            } else if (typeof body == "object") {
                sendData = JSON.stringify(body);
            } else {
                sendData = body;
            }
            // @ts-ignore
            this.beforeProcessRequestHeaders(Buffer.from(sendData).length);
            promise = this.m_libCurl_impl_.sendAsync(sendData);
        } else {
            if (isSubmitBody) {
                this.beforeProcessRequestHeaders(0);
            } else {
                this.beforeProcessRequestHeaders();
            }
            promise = this.m_libCurl_impl_.sendAsync();
        }
        return promise
            .catch((error: string) => {
                throw new LibCurlError(error);
            })
            .finally(() => {
                this.m_isSending_ = false;
            });
    }

    public getResponseBody(): Uint8Array {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseBody();
    }

    public getResponseString(): string {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseString();
    }

    public getLastEffectiveUrl(): string {
        this.checkSending();
        return this.m_libCurl_impl_.getLastEffectiveUrl();
    }
}
