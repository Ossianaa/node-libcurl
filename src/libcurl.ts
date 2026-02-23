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
    | "http3";

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

export type LibCurlJA3FingerPrintImpl =
    | "chrome99"
    | "chrome101"
    | "chrome110"
    | "chrome124"
    | "chrome131"
    | "chrome133"
    | "chrome146"
    | "auto";
export type LibCurlAkamaiFingerPrintImpl =
    | "chrome99"
    | "chrome107"
    | "chrome119"
    | "auto";

const randomStringExtensions = (exts: string) =>
    exts
        .split("-")
        .sort(() => (Math.random() > 0.5 ? 1 : -1))
        .join("-");

const LibCurlJA3FingerPrintImplMap: {
    [K in LibCurlJA3FingerPrintImpl]: K extends Exclude<
        LibCurlJA3FingerPrintImpl,
        "auto"
    >
        ? () => string
        : (chromeVersion: number) => string;
} = {
    chrome99: () =>
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21-41,29-23-24,0`,
    chrome101: () =>
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21-41,29-23-24,0`,
    chrome110: () =>
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${randomStringExtensions("0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21")}-41,29-23-24,0`,
    chrome124: () =>
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${randomStringExtensions("0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-65037-21")}-41,25497-29-23-24,0`,
    chrome131: () =>
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${randomStringExtensions("0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-65037-21")}-41,4588-29-23-24,0`,
    chrome133: () =>
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${randomStringExtensions("0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17613-65037-21")}-41,4588-29-23-24,0`,
    chrome146: () =>
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${randomStringExtensions("0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17613-65037-51764-21")}-41,4588-29-23-24,0`,
    auto(chromeVersion?: number) {
        if (chromeVersion < 101) {
            return this.chrome99();
        } else if (chromeVersion < 110) {
            return this.chrome101();
        } else if (chromeVersion < 124) {
            return this.chrome110();
        } else if (chromeVersion < 131) {
            return this.chrome124();
        } else if (chromeVersion < 133) {
            return this.chrome131();
        } else if (chromeVersion < 146) {
            return this.chrome133();
        } else {
            return this.chrome146();
        }
    },
};

const LibCurlAkamaiFingerPrintImplMap: {
    [K in LibCurlAkamaiFingerPrintImpl]: K extends Exclude<
        LibCurlAkamaiFingerPrintImpl,
        "auto"
    >
        ? () => string
        : (chromeVersion: number) => string;
} = {
    chrome99: () => `1:65536;3:1000;4:6291456;6:262144|15663105|0|m,a,s,p`,
    chrome107: () => `1:65536;2:0;3:1000;4:6291456;6:262144|15663105|0|m,a,s,p`,
    chrome119: () => `1:65536;2:0;4:6291456;6:262144|15663105|0|m,a,s,p`,
    auto(chromeVersion?: number) {
        if (chromeVersion < 107) {
            return this.chrome99();
        } else if (chromeVersion < 119) {
            return this.chrome107();
        } else {
            return this.chrome119();
        }
    },
};

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

export type LibCurlJA3FingerPrintInfo = string | LibCurlJA3FingerPrintImpl;
export type LibCurlAkamaiFingerPrintInfo =
    | string
    | LibCurlAkamaiFingerPrintImpl;

export enum LibCurlJA3TlsVersion {
    TLSv1_2 = 771,
    TLSv1_3 = 772,
}

export enum LibCurlJA3Cipher {
    "NULL-SHA" = 0x0002,
    "DES-CBC3-SHA" = 0x000a,
    "AES128-SHA" = 0x002f,
    "AES256-SHA" = 0x0035,
    "DHE-RSA-AES128-SHA" = 0x0033,
    "DHE-RSA-AES256-SHA" = 0x0039,
    "AES128-SHA256" = 0x003c,
    "AES256-SHA256" = 0x003d,
    "DHE-RSA-AES128-SHA256" = 0x0067,
    "DHE-RSA-AES256-SHA256" = 0x006b,
    "PSK-AES128-CBC-SHA" = 0x008c,
    "PSK-AES256-CBC-SHA" = 0x008d,
    "AES128-GCM-SHA256" = 0x009c,
    "AES256-GCM-SHA384" = 0x009d,
    "DHE-RSA-AES128-GCM-SHA256" = 0x009e,
    "DHE-RSA-AES256-GCM-SHA384" = 0x009f,

    "TLS_AES_128_GCM_SHA256" = 0x1301,
    "TLS_AES_256_GCM_SHA384" = 0x1302,
    "TLS_CHACHA20_POLY1305_SHA256" = 0x1303,
    "ECDHE-ECDSA-DES-CBC3-SHA" = 0xc008,
    "ECDHE-ECDSA-AES128-SHA" = 0xc009,
    "ECDHE-ECDSA-AES256-SHA" = 0xc00a,
    "ECDHE-RSA-DES-CBC3-SHA" = 0xc012,
    "ECDHE-RSA-AES128-SHA" = 0xc013,
    "ECDHE-RSA-AES256-SHA" = 0xc014,
    "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256" = 0xc023,
    "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384" = 0xc024,
    "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256" = 0xc027,
    "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384" = 0xc028,
    "ECDHE-ECDSA-AES128-GCM-SHA256" = 0xc02b,
    "ECDHE-ECDSA-AES256-GCM-SHA384" = 0xc02c,
    "ECDHE-RSA-AES128-GCM-SHA256" = 0xc02f,
    "ECDHE-RSA-AES256-GCM-SHA384" = 0xc030,
    "ECDHE-PSK-AES128-CBC-SHA" = 0xc035,
    "ECDHE-PSK-AES256-CBC-SHA" = 0xc036,
    "ECDHE-RSA-CHACHA20-POLY1305" = 0xcca8,
    "ECDHE-ECDSA-CHACHA20-POLY1305" = 0xcca9,
    "ECDHE-PSK-CHACHA20-POLY1305" = 0xccac,
}

export enum LibCurlJA3Extension {
    TLSEXT_TYPE_server_name = 0,
    TLSEXT_TYPE_status_request = 5,
    TLSEXT_TYPE_ec_point_formats = 11,
    TLSEXT_TYPE_signature_algorithms = 13,
    TLSEXT_TYPE_srtp = 14,
    TLSEXT_TYPE_application_layer_protocol_negotiation = 16,
    TLSEXT_TYPE_padding = 21,
    TLSEXT_TYPE_extended_master_secret = 23,
    TLSEXT_TYPE_quic_transport_parameters_legacy = 0xffa5,
    TLSEXT_TYPE_quic_transport_parameters = 57,
    TLSEXT_TYPE_cert_compression = 27,
    TLSEXT_TYPE_session_ticket = 35,
    TLSEXT_TYPE_supported_groups = 10,
    TLSEXT_TYPE_pre_shared_key = 41,
    TLSEXT_TYPE_early_data = 42,
    TLSEXT_TYPE_supported_versions = 43,
    TLSEXT_TYPE_cookie = 44,
    TLSEXT_TYPE_psk_key_exchange_modes = 45,
    TLSEXT_TYPE_certificate_authorities = 47,
    TLSEXT_TYPE_signature_algorithms_cert = 50,
    TLSEXT_TYPE_key_share = 51,
    TLSEXT_TYPE_renegotiate = 0xff01,
    TLSEXT_TYPE_delegated_credential = 0x22,
    TLSEXT_TYPE_application_settings_old = 17513,
    TLSEXT_TYPE_application_settings = 17613,
    TLSEXT_TYPE_encrypted_client_hello = 0xfe0d,
    TLSEXT_TYPE_ech_outer_extensions = 0xfd00,
    TLSEXT_TYPE_certificate_timestamp = 18,
    TLSEXT_TYPE_next_proto_neg = 13172,
    TLSEXT_TYPE_channel_id = 30032,
    TLSEXT_TYPE_record_size_limit = 28,
    TLSEXT_TYPE_delegated_credentials = 34,
    TLSEXT_TYPE_pake = 0x8a3b,
    TLSEXT_TYPE_trust_anchors = 0xca34,
}

export enum LibCurlJA3SupportGroup {
    "P-256" = 23,
    "P-384" = 24,
    "P-521" = 25,
    X25519 = 29,
    ffdhe2048 = 256,
    ffdhe3072 = 257,
    X25519Kyber768Draft00 = 25497,
    X25519MLKEM768 = 4588,
}

export enum LibCurlJA3EcPointFormat {
    uncompressed = 0,
    compressed_fixed = 1,
    compressed_variable = 2,
}

const LibCurlBoringSSLExtensionPermutation: LibCurlJA3Extension[] = [
    LibCurlJA3Extension.TLSEXT_TYPE_server_name,
    LibCurlJA3Extension.TLSEXT_TYPE_encrypted_client_hello,
    LibCurlJA3Extension.TLSEXT_TYPE_extended_master_secret,
    LibCurlJA3Extension.TLSEXT_TYPE_renegotiate,
    LibCurlJA3Extension.TLSEXT_TYPE_supported_groups,
    LibCurlJA3Extension.TLSEXT_TYPE_ec_point_formats,
    LibCurlJA3Extension.TLSEXT_TYPE_session_ticket,
    LibCurlJA3Extension.TLSEXT_TYPE_application_layer_protocol_negotiation,
    LibCurlJA3Extension.TLSEXT_TYPE_status_request,
    LibCurlJA3Extension.TLSEXT_TYPE_signature_algorithms,
    LibCurlJA3Extension.TLSEXT_TYPE_next_proto_neg,
    LibCurlJA3Extension.TLSEXT_TYPE_certificate_timestamp,
    LibCurlJA3Extension.TLSEXT_TYPE_channel_id,
    LibCurlJA3Extension.TLSEXT_TYPE_srtp,
    LibCurlJA3Extension.TLSEXT_TYPE_key_share,
    LibCurlJA3Extension.TLSEXT_TYPE_psk_key_exchange_modes,
    LibCurlJA3Extension.TLSEXT_TYPE_early_data,
    LibCurlJA3Extension.TLSEXT_TYPE_supported_versions,
    LibCurlJA3Extension.TLSEXT_TYPE_cookie,
    LibCurlJA3Extension.TLSEXT_TYPE_quic_transport_parameters,
    LibCurlJA3Extension.TLSEXT_TYPE_quic_transport_parameters_legacy,
    LibCurlJA3Extension.TLSEXT_TYPE_cert_compression,
    LibCurlJA3Extension.TLSEXT_TYPE_delegated_credential,
    LibCurlJA3Extension.TLSEXT_TYPE_application_settings,
    LibCurlJA3Extension.TLSEXT_TYPE_application_settings_old,
    LibCurlJA3Extension.TLSEXT_TYPE_record_size_limit, //firefox
    LibCurlJA3Extension.TLSEXT_TYPE_pake,
    LibCurlJA3Extension.TLSEXT_TYPE_trust_anchors,
    LibCurlJA3Extension.TLSEXT_TYPE_pre_shared_key,
];

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

export type LibCurlRequestHeadersOrder = Array<string> | null;
export type LibCurlRequestType = "fetch" | "XMLHttpRequest";
const textEncoder = new TextEncoder();

export class LibCurl {
    private m_libCurl_impl_: any;
    private m_method_: LibCurlMethodInfo;
    private m_isSending_: boolean;
    private m_requestHeaders_: LibCurlRequestHeadersAttr;
    private m_autoSortRequestHeaders: LibCurlAutoSortRequestHeadersOption =
        "auto";
    private m_nextRequestHeadersOrderMap: CaseInsensitiveMap = null;
    private m_requestType: LibCurlRequestType = "fetch";
    private m_nextRequestType: LibCurlRequestType | null = null;
    private m_chromeVersion: number = 133;

    constructor() {
        this.m_libCurl_impl_ = new BaoLibCurl();
        this.m_requestHeaders_ = new CaseInsensitiveMap();
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
     *
     * @param connectTime 连接上远程服务器的最长等待时间
     * @param sendTime 发送最长等待时间
     * sendTime时长包含connectTime 所以sendTime要大于connectTime
     */
    public setTimeout(connectTime: number, sendTime: number): void {
        this.checkSending();
        if (connectTime > sendTime) {
            throw new LibCurlError("连接时间大于发送等待时间.");
        }
        this.m_libCurl_impl_.setTimeout(connectTime, sendTime);
    }

    /**
     *
     * @param key
     * @param value
     * @param domain cookie作用域 sample: .baidu.com  baike.baidu.com
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
     * @param domain cookie作用域 sample: .baidu.com  baike.baidu.com
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
     * @returns 返回所有Cookies sample:'a=b;c=d;'
     */
    public getCookies(cookieOpt?: LibCurlGetCookiesOption): string {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        return httpCookiesToArray(cookies_)
            .filter(cookieOptFilter(cookieOpt))
            .map((e) => `${e[5]}=${encodeURIComponent(e[6])};`)
            .join(" ");
    }

    /**
     * @param {LibCurlGetCookiesOption}cookieOpt
     * @returns 返回所有Cookie的Map 如果有相同的键 则后键覆盖前键
     */
    public getCookiesMap(
        cookieOpt?: LibCurlGetCookiesOption,
    ): LibCurlCookiesAttr {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        return httpCookiesToArray(cookies_)
            .filter(cookieOptFilter(cookieOpt))
            .reduce((e: LibCurlCookiesAttr, t: LibCurlCookieAttrArray) => {
                e.set(t[5], {
                    domain: t[0],
                    subDomain: t[1],
                    path: t[2],
                    secure: t[3],
                    timestamp: t[4],
                    value: t[6],
                } as LibCurlCookieAttrObject);
                return e;
            }, new Map<string, LibCurlCookieAttrObject>());
    }

    /**
     *
     * @param cookieOpt
     * @returns 返回该cookieOpt对应的cookieValue
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
     * @returns 返回响应头
     */
    public getResponseHeaders(): string {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseHeaders();
    }

    /**
     * @returns 返回响应头 Map
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
            lines.map((line: string) =>
                line
                    .split(": ", 2)
                    .map((e) => String.fromCharCode(...textEncoder.encode(e))),
            ),
        );
    }

    /**
     *
     * @returns 返回状态码
     * sample: 200 403 404
     */
    public getResponseStatus(): number {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseStatus();
    }

    /**
     *
     * @returns 返回正文长度
     */
    public getResponseContentLength(): number {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseContentLength();
    }

    /**
     *
     * @param config 是否验证证书和名称
     */
    public setSSLVerify(config: LibCurlSSLVerifyConfig): void {
        this.checkSending();
        this.m_libCurl_impl_.setSSLVerify(config.caPath);
    }

    /**
     *
     * @param enable 是否允许重定向
     */
    public setRedirect(enable: boolean): void {
        this.checkSending();
        this.m_libCurl_impl_.setRedirect(enable);
    }

    /**
     * 打印libcurl内部的 解析信息、连接信息、tls信息等等
     */
    public setVerbose(enable: boolean): void {
        this.checkSending();
        this.m_libCurl_impl_.setVerbose(!!enable);
    }

    /**
     *
     * @param version
     * 设置http版本号
     */
    public setHttpVersion(version: LibCurlHttpVersionInfo): void {
        this.checkSending();
        let _version = version;
        if (version == "http1.1") {
            _version = 0;
        } else if (version == "http2") {
            _version = 1;
        }
        if (version == "http3") {
            _version = 2;
        }
        this.m_libCurl_impl_.setHttpVersion(_version);
    }

    /**
     * 指定网卡访问
     * @param network
     */
    public setInterface(network: LibCurlInterfaceInfo): void {
        this.checkSending();
        this.m_libCurl_impl_.setInterface(network);
    }

    /**
     * 设置JA3指纹
     * @param ja3
     */
    public setJA3Fingerprint(ja3: LibCurlJA3FingerPrintInfo = "auto"): void {
        this.checkSending();
        const ja3Arr = (
            LibCurlJA3FingerPrintImplMap[ja3]?.(this.m_chromeVersion) || ja3
        ).split(",");
        if (ja3Arr.length != 5) {
            throw new LibCurlError("ja3 fingerprint error");
        }
        const tlsVersion = ja3Arr.at(0);
        if (!LibCurlJA3TlsVersion[ja3Arr.at(0)]) {
            throw new LibCurlError("ja3 fingerprint tlsVersion no support");
        }
        let tls13_ciphers = [];
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
            if (extension == 41) {
                //pre-shared-key
                return 127;
            }
            const pos = LibCurlBoringSSLExtensionPermutation.indexOf(extension);
            if (pos == -1) {
                throw new LibCurlError(
                    `ja3 fingerprint extension ${extension} no support`,
                );
            }
            return pos + 1;
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
        this.m_libCurl_impl_.setJA3Fingerprint(
            parseInt(tlsVersion),
            cipherArr.join(":"),
            String.fromCharCode(...tls13_ciphers, 0),
            String.fromCharCode(...extension_permutation, 0),
            supportGroups.join(":"),
            0,
        );
    }

    /**
     * 设置akamai h2指纹
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
     * 设置h2 stream_id
     * @param stream_id
     */
    public setHttp2NextStreamId(stream_id: number): void {
        if (stream_id < 1 || stream_id % 2 == 0) {
            throw new LibCurlError("stream_id error");
        }
        this.m_libCurl_impl_.setHttp2NextStreamId(stream_id);
    }

    /**
     * 设置h2 weight
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
        privateKeyBlob: LibCurlSSLBlob = null,
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
        if (this.m_nextRequestHeadersOrderMap) {
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
            this.m_nextRequestHeadersOrderMap = null;
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

        const processedFixedPrefixArr = [];
        const processedFixedSuffixArr = [];

        const extraHeaders = [];
        let customHeaders = [];
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
                const [_key, value] =
                    extraHeaders.find((j) => j[0].toLowerCase() == key) ||
                    customHeaders.find((j) => j[0].toLowerCase() == key);
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
     * @param body POST PUT PATCH时 发送的body
     * 当body不为string或uint8array时 此函数将用JSON.stringify转换对象
     */
    public async send(body?: LibCurlBodyInfo): Promise<undefined> | undefined {
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
            let sendData: Omit<LibCurlBodyInfo, "object">;
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
