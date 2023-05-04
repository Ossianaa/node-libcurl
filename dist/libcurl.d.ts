export declare enum LibCurlHttpVersionInfo {
    http1_1 = 0,
    http2 = 1
}
export type LibCurlSetCookieOption = {
    domain: string;
    path?: string;
    name: string;
    value: string;
};
export type LibCurlCookiesInfo = string | {
    [key: string]: string;
};
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
    value: string
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
export type LibCurlHeadersAttr = Map<string, string>;
export type LibCurlInterfaceInfo = string;
export type LibCurlJA3FingerPrintInfo = string;
export declare enum LibCurlJA3TlsVersion {
    TLSv1_2 = 771,
    TLSv1_3 = 772
}
export declare enum LibCurlJA3Cipher {
    'NULL-SHA' = 2,
    'DES-CBC3-SHA' = 10,
    'AES128-SHA' = 47,
    'AES256-SHA' = 53,
    'PSK-AES128-CBC-SHA' = 140,
    'PSK-AES256-CBC-SHA' = 141,
    'AES128-GCM-SHA256' = 156,
    'AES256-GCM-SHA384' = 157,
    'TLS_AES_128_GCM_SHA256' = 4865,
    'TLS_AES_256_GCM_SHA384' = 4866,
    'TLS_CHACHA20_POLY1305_SHA256' = 4867,
    'ECDHE-ECDSA-AES128-SHA' = 49161,
    'ECDHE-ECDSA-AES256-SHA' = 49162,
    'ECDHE-RSA-AES128-SHA' = 49171,
    'ECDHE-RSA-AES256-SHA' = 49172,
    'ECDHE-ECDSA-AES128-GCM-SHA256' = 49195,
    'ECDHE-ECDSA-AES256-GCM-SHA384' = 49196,
    'ECDHE-RSA-AES128-GCM-SHA256' = 49199,
    'ECDHE-RSA-AES256-GCM-SHA384' = 49200,
    'ECDHE-PSK-AES128-CBC-SHA' = 49205,
    'ECDHE-PSK-AES256-CBC-SHA' = 49206,
    'ECDHE-RSA-CHACHA20-POLY1305' = 52392,
    'ECDHE-ECDSA-CHACHA20-POLY1305' = 52393,
    'ECDHE-PSK-CHACHA20-POLY1305' = 52396
}
export declare enum LibCurlJA3Extension {
    TLSEXT_TYPE_server_name = 0,
    TLSEXT_TYPE_status_request = 5,
    TLSEXT_TYPE_ec_point_formats = 11,
    TLSEXT_TYPE_signature_algorithms = 13,
    TLSEXT_TYPE_srtp = 14,
    TLSEXT_TYPE_application_layer_protocol_negotiation = 16,
    TLSEXT_TYPE_padding = 21,
    TLSEXT_TYPE_extended_master_secret = 23,
    TLSEXT_TYPE_quic_transport_parameters_legacy = 65445,
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
    TLSEXT_TYPE_renegotiate = 65281,
    TLSEXT_TYPE_delegated_credential = 34,
    TLSEXT_TYPE_application_settings = 17513,
    TLSEXT_TYPE_encrypted_client_hello = 65037,
    TLSEXT_TYPE_ech_outer_extensions = 64768,
    TLSEXT_TYPE_certificate_timestamp = 18,
    TLSEXT_TYPE_next_proto_neg = 13172,
    TLSEXT_TYPE_channel_id = 30032,
    TLSEXT_TYPE_record_size_limit = 28,
    TLSEXT_TYPE_delegated_credentials = 34
}
export declare enum LibCurlJA3SupportGroup {
    "P-256" = 23,
    "P-384" = 24,
    "P-521" = 25,
    X25519 = 29,
    ffdhe2048 = 256,
    ffdhe3072 = 257
}
export declare enum LibCurlJA3EcPointFormat {
    uncompressed = 0,
    compressed_fixed = 1,
    compressed_variable = 2
}
interface LibCurlCommonHeaders {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36' | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0';
    'Content-Type': 'application/x-www-form-urlencoded' | 'application/json' | 'application/octet-stream' | 'application/protobuf' | 'text/plain';
    'Host': string;
    'Referer': string;
}
export type LibCurlHeadersInfo = string | {
    [key: string]: [value: string];
} | LibCurlHeadersAttr | LibCurlCommonHeaders;
export type LibCurlBodyInfo = string | Uint8Array | URLSearchParams | object;
export type LibCurlMethodInfo = 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
export type LibCurlProxyWithAccountInfo = {
    proxy: string;
    username: string;
    password: string;
};
export type LibCurlProxyInfo = string | LibCurlProxyWithAccountInfo;
export type LibCurlURLInfo = string | URL;
export declare class LibCurlError extends Error {
    constructor(message: string);
}
export declare class LibCurl {
    private m_libCurl_impl_;
    private m_isSending_;
    constructor();
    private static multiExecute;
    private checkSending;
    open(method: LibCurlMethodInfo, url: LibCurlURLInfo): void;
    setRequestHeader(key: string, value: string): void;
    setRequestHeaders(headers: LibCurlHeadersInfo): void;
    setProxy(proxyOpt: LibCurlProxyInfo): void;
    setTimeout(connectTime: number, sendTime: number): void;
    setCookie(cookieOpt: LibCurlSetCookieOption): void;
    deleteCookie(cookieOpt: LibCurlGetCookieOption): void;
    getCookies(cookieOpt?: LibCurlGetCookiesOption): string;
    getCookiesMap(cookieOpt?: LibCurlGetCookiesOption): LibCurlCookiesAttr;
    getCookie(cookieOpt: LibCurlGetCookieOption): string;
    getResponseHeaders(): string;
    getResponseHeadersMap(): LibCurlHeadersAttr;
    getResponseStatus(): number;
    getResponseContentLength(): number;
    reset(): void;
    setRedirect(isAllow: boolean): void;
    printInnerLogger(): void;
    setHttpVersion(version: LibCurlHttpVersionInfo): void;
    setInterface(network: LibCurlInterfaceInfo): void;
    setJA3Fingerprint(ja3: LibCurlJA3FingerPrintInfo): void;
    send(body?: LibCurlBodyInfo): Promise<undefined> | undefined;
    getResponseBody(): Uint8Array;
    getResponseString(): string;
    getResponseJson(): Object;
}
export {};
