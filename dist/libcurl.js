"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibCurl = exports.LibCurlError = exports.LibCurlJA3EcPointFormat = exports.LibCurlJA3SupportGroup = exports.LibCurlJA3Extension = exports.LibCurlJA3Cipher = exports.LibCurlJA3TlsVersion = exports.LibCurlHttpVersionInfo = void 0;
const bindings_1 = __importDefault(require("bindings"));
const utils_1 = require("./utils");
const { BaoLibCurl } = (0, bindings_1.default)('bao_curl_node_addon');
var LibCurlHttpVersionInfo;
(function (LibCurlHttpVersionInfo) {
    LibCurlHttpVersionInfo[LibCurlHttpVersionInfo["http1_1"] = 0] = "http1_1";
    LibCurlHttpVersionInfo[LibCurlHttpVersionInfo["http2"] = 1] = "http2";
})(LibCurlHttpVersionInfo = exports.LibCurlHttpVersionInfo || (exports.LibCurlHttpVersionInfo = {}));
var LibCurlJA3TlsVersion;
(function (LibCurlJA3TlsVersion) {
    LibCurlJA3TlsVersion[LibCurlJA3TlsVersion["TLSv1_2"] = 771] = "TLSv1_2";
    LibCurlJA3TlsVersion[LibCurlJA3TlsVersion["TLSv1_3"] = 772] = "TLSv1_3";
})(LibCurlJA3TlsVersion = exports.LibCurlJA3TlsVersion || (exports.LibCurlJA3TlsVersion = {}));
var LibCurlJA3Cipher;
(function (LibCurlJA3Cipher) {
    LibCurlJA3Cipher[LibCurlJA3Cipher["NULL-SHA"] = 2] = "NULL-SHA";
    LibCurlJA3Cipher[LibCurlJA3Cipher["DES-CBC3-SHA"] = 10] = "DES-CBC3-SHA";
    LibCurlJA3Cipher[LibCurlJA3Cipher["AES128-SHA"] = 47] = "AES128-SHA";
    LibCurlJA3Cipher[LibCurlJA3Cipher["AES256-SHA"] = 53] = "AES256-SHA";
    LibCurlJA3Cipher[LibCurlJA3Cipher["PSK-AES128-CBC-SHA"] = 140] = "PSK-AES128-CBC-SHA";
    LibCurlJA3Cipher[LibCurlJA3Cipher["PSK-AES256-CBC-SHA"] = 141] = "PSK-AES256-CBC-SHA";
    LibCurlJA3Cipher[LibCurlJA3Cipher["AES128-GCM-SHA256"] = 156] = "AES128-GCM-SHA256";
    LibCurlJA3Cipher[LibCurlJA3Cipher["AES256-GCM-SHA384"] = 157] = "AES256-GCM-SHA384";
    LibCurlJA3Cipher[LibCurlJA3Cipher["TLS_AES_128_GCM_SHA256"] = 4865] = "TLS_AES_128_GCM_SHA256";
    LibCurlJA3Cipher[LibCurlJA3Cipher["TLS_AES_256_GCM_SHA384"] = 4866] = "TLS_AES_256_GCM_SHA384";
    LibCurlJA3Cipher[LibCurlJA3Cipher["TLS_CHACHA20_POLY1305_SHA256"] = 4867] = "TLS_CHACHA20_POLY1305_SHA256";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-ECDSA-AES128-SHA"] = 49161] = "ECDHE-ECDSA-AES128-SHA";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-ECDSA-AES256-SHA"] = 49162] = "ECDHE-ECDSA-AES256-SHA";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-RSA-AES128-SHA"] = 49171] = "ECDHE-RSA-AES128-SHA";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-RSA-AES256-SHA"] = 49172] = "ECDHE-RSA-AES256-SHA";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-ECDSA-AES128-GCM-SHA256"] = 49195] = "ECDHE-ECDSA-AES128-GCM-SHA256";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-ECDSA-AES256-GCM-SHA384"] = 49196] = "ECDHE-ECDSA-AES256-GCM-SHA384";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-RSA-AES128-GCM-SHA256"] = 49199] = "ECDHE-RSA-AES128-GCM-SHA256";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-RSA-AES256-GCM-SHA384"] = 49200] = "ECDHE-RSA-AES256-GCM-SHA384";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-PSK-AES128-CBC-SHA"] = 49205] = "ECDHE-PSK-AES128-CBC-SHA";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-PSK-AES256-CBC-SHA"] = 49206] = "ECDHE-PSK-AES256-CBC-SHA";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-RSA-CHACHA20-POLY1305"] = 52392] = "ECDHE-RSA-CHACHA20-POLY1305";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-ECDSA-CHACHA20-POLY1305"] = 52393] = "ECDHE-ECDSA-CHACHA20-POLY1305";
    LibCurlJA3Cipher[LibCurlJA3Cipher["ECDHE-PSK-CHACHA20-POLY1305"] = 52396] = "ECDHE-PSK-CHACHA20-POLY1305";
})(LibCurlJA3Cipher = exports.LibCurlJA3Cipher || (exports.LibCurlJA3Cipher = {}));
var LibCurlJA3Extension;
(function (LibCurlJA3Extension) {
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_server_name"] = 0] = "TLSEXT_TYPE_server_name";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_status_request"] = 5] = "TLSEXT_TYPE_status_request";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_ec_point_formats"] = 11] = "TLSEXT_TYPE_ec_point_formats";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_signature_algorithms"] = 13] = "TLSEXT_TYPE_signature_algorithms";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_srtp"] = 14] = "TLSEXT_TYPE_srtp";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_application_layer_protocol_negotiation"] = 16] = "TLSEXT_TYPE_application_layer_protocol_negotiation";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_padding"] = 21] = "TLSEXT_TYPE_padding";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_extended_master_secret"] = 23] = "TLSEXT_TYPE_extended_master_secret";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_quic_transport_parameters_legacy"] = 65445] = "TLSEXT_TYPE_quic_transport_parameters_legacy";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_quic_transport_parameters"] = 57] = "TLSEXT_TYPE_quic_transport_parameters";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_cert_compression"] = 27] = "TLSEXT_TYPE_cert_compression";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_session_ticket"] = 35] = "TLSEXT_TYPE_session_ticket";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_supported_groups"] = 10] = "TLSEXT_TYPE_supported_groups";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_pre_shared_key"] = 41] = "TLSEXT_TYPE_pre_shared_key";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_early_data"] = 42] = "TLSEXT_TYPE_early_data";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_supported_versions"] = 43] = "TLSEXT_TYPE_supported_versions";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_cookie"] = 44] = "TLSEXT_TYPE_cookie";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_psk_key_exchange_modes"] = 45] = "TLSEXT_TYPE_psk_key_exchange_modes";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_certificate_authorities"] = 47] = "TLSEXT_TYPE_certificate_authorities";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_signature_algorithms_cert"] = 50] = "TLSEXT_TYPE_signature_algorithms_cert";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_key_share"] = 51] = "TLSEXT_TYPE_key_share";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_renegotiate"] = 65281] = "TLSEXT_TYPE_renegotiate";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_delegated_credential"] = 34] = "TLSEXT_TYPE_delegated_credential";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_application_settings"] = 17513] = "TLSEXT_TYPE_application_settings";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_encrypted_client_hello"] = 65037] = "TLSEXT_TYPE_encrypted_client_hello";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_ech_outer_extensions"] = 64768] = "TLSEXT_TYPE_ech_outer_extensions";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_certificate_timestamp"] = 18] = "TLSEXT_TYPE_certificate_timestamp";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_next_proto_neg"] = 13172] = "TLSEXT_TYPE_next_proto_neg";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_channel_id"] = 30032] = "TLSEXT_TYPE_channel_id";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_record_size_limit"] = 28] = "TLSEXT_TYPE_record_size_limit";
    LibCurlJA3Extension[LibCurlJA3Extension["TLSEXT_TYPE_delegated_credentials"] = 34] = "TLSEXT_TYPE_delegated_credentials";
})(LibCurlJA3Extension = exports.LibCurlJA3Extension || (exports.LibCurlJA3Extension = {}));
var LibCurlJA3SupportGroup;
(function (LibCurlJA3SupportGroup) {
    LibCurlJA3SupportGroup[LibCurlJA3SupportGroup["P-256"] = 23] = "P-256";
    LibCurlJA3SupportGroup[LibCurlJA3SupportGroup["P-384"] = 24] = "P-384";
    LibCurlJA3SupportGroup[LibCurlJA3SupportGroup["P-521"] = 25] = "P-521";
    LibCurlJA3SupportGroup[LibCurlJA3SupportGroup["X25519"] = 29] = "X25519";
    LibCurlJA3SupportGroup[LibCurlJA3SupportGroup["ffdhe2048"] = 256] = "ffdhe2048";
    LibCurlJA3SupportGroup[LibCurlJA3SupportGroup["ffdhe3072"] = 257] = "ffdhe3072";
})(LibCurlJA3SupportGroup = exports.LibCurlJA3SupportGroup || (exports.LibCurlJA3SupportGroup = {}));
var LibCurlJA3EcPointFormat;
(function (LibCurlJA3EcPointFormat) {
    LibCurlJA3EcPointFormat[LibCurlJA3EcPointFormat["uncompressed"] = 0] = "uncompressed";
    LibCurlJA3EcPointFormat[LibCurlJA3EcPointFormat["compressed_fixed"] = 1] = "compressed_fixed";
    LibCurlJA3EcPointFormat[LibCurlJA3EcPointFormat["compressed_variable"] = 2] = "compressed_variable";
})(LibCurlJA3EcPointFormat = exports.LibCurlJA3EcPointFormat || (exports.LibCurlJA3EcPointFormat = {}));
const LibCurlBoringSSLExtensionPermutation = [
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
    LibCurlJA3Extension.TLSEXT_TYPE_record_size_limit,
    LibCurlJA3Extension.TLSEXT_TYPE_pre_shared_key,
];
class LibCurlError extends Error {
    constructor(message, stack) {
        super(message);
        if (stack) {
            this.stack += stack;
        }
    }
}
exports.LibCurlError = LibCurlError;
class LibCurl {
    m_libCurl_impl_;
    m_isAsync_;
    m_isSending_;
    constructor() {
        this.m_libCurl_impl_ = new BaoLibCurl();
    }
    checkSending() {
        if (this.m_isSending_) {
            throw new Error('the last request is sending, don\'t send one more request on one instance!');
        }
    }
    open(method, url, async = true) {
        this.checkSending();
        this.m_libCurl_impl_.open(method, url + '');
        this.m_isAsync_ = async;
    }
    setRequestHeader(key, value) {
        this.checkSending();
        this.m_libCurl_impl_.setRequestHeader(key, value);
    }
    setRequestHeaders(headers) {
        this.checkSending();
        if (!headers) {
            return;
        }
        if (headers instanceof Map) {
            headers.forEach((value, key) => this.m_libCurl_impl_.setRequestHeader(key, value));
        }
        else if (typeof headers == 'string') {
            this.m_libCurl_impl_.setRequestHeaders(headers);
        }
        else if (typeof headers == 'object') {
            Object.keys(headers).forEach((key) => {
                const value = headers[key];
                this.m_libCurl_impl_.setRequestHeader(key, value);
            });
        }
        else {
            throw new TypeError('unkown type');
        }
    }
    setProxy(proxyOpt) {
        this.checkSending();
        if (typeof proxyOpt == 'string') {
            this.m_libCurl_impl_.setProxy(proxyOpt);
        }
        else {
            this.m_libCurl_impl_.setProxy(proxyOpt.proxy, proxyOpt.username, proxyOpt.password);
        }
    }
    setTimeout(connectTime, sendTime) {
        this.checkSending();
        if (connectTime > sendTime) {
            throw new Error('连接时间大于发送等待时间.');
        }
        this.m_libCurl_impl_.setTimeout(connectTime, sendTime);
    }
    setCookie(cookieOpt) {
        this.checkSending();
        this.m_libCurl_impl_.setCookie(cookieOpt.name, cookieOpt.value, cookieOpt.domain, cookieOpt.path);
    }
    deleteCookie(cookieOpt) {
        this.checkSending();
        this.m_libCurl_impl_.deleteCookie(cookieOpt.name, cookieOpt.domain, cookieOpt.path || "/");
    }
    getCookies(cookieOpt) {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        return (0, utils_1.httpCookiesToArray)(cookies_).filter((0, utils_1.cookieOptFilter)(cookieOpt)).map(e => `${e[5]}=${encodeURIComponent(e[6])};`).join(' ');
    }
    getCookiesMap(cookieOpt) {
        this.checkSending();
        const cookies_ = this.m_libCurl_impl_.getCookies();
        return (0, utils_1.httpCookiesToArray)(cookies_).filter((0, utils_1.cookieOptFilter)(cookieOpt)).reduce((e, t) => {
            e.set(t[5], {
                domain: t[0],
                subDomain: t[1],
                path: t[2],
                secure: t[3],
                timestamp: t[4],
                value: t[6],
            });
            return e;
        }, new Map());
    }
    getCookie(cookieOpt) {
        this.checkSending();
        return this.m_libCurl_impl_.getCookie(cookieOpt.name, cookieOpt.domain || ".", cookieOpt.path || "/");
    }
    getResponseHeaders() {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseHeaders();
    }
    getResponseHeadersMap() {
        this.checkSending();
        const headers_ = this.m_libCurl_impl_.getResponseHeaders();
        return headers_.split('\r\n')
            .slice(1)
            .reduce((e, t) => {
            if (!t) {
                return e;
            }
            const [key, value] = t.split(': ');
            e.set(key, value);
            return e;
        }, new Map());
    }
    getResponseStatus() {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseStatus();
    }
    getResponseContentLength() {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseContentLength();
    }
    reset() {
        this.checkSending();
        this.m_libCurl_impl_.reset();
    }
    setRedirect(isAllow) {
        this.checkSending();
        this.m_libCurl_impl_.setRedirect(isAllow);
    }
    printInnerLogger() {
        this.checkSending();
        this.m_libCurl_impl_.printInnerLogger();
    }
    setHttpVersion(version) {
        this.checkSending();
        this.m_libCurl_impl_.setHttpVersion(version);
    }
    setDnsInterface(network) {
        this.checkSending();
        this.m_libCurl_impl_.setDnsInterface(network);
    }
    setJA3Fingerprint(ja3) {
        this.checkSending();
        const ja3Arr = ja3.replaceAll('\s', '').split(',');
        if (ja3Arr.length != 5) {
            throw new LibCurlError('ja3 fingerprint error');
        }
        const tlsVersion = ja3Arr.at(0);
        if (!LibCurlJA3TlsVersion[ja3Arr.at(0)]) {
            throw new LibCurlError('ja3 fingerprint tlsVersion no support');
        }
        let tls13_ciphers = [];
        const cipherArr = ja3Arr.at(1).split('-').map((key) => {
            const cipher = LibCurlJA3Cipher[key];
            if (!cipher) {
                throw new LibCurlError(`ja3 fingerprint cipher ${key} no support`);
            }
            if (cipher.startsWith('TLS_')) {
                const pos = ['4865', '4866', '4867'].indexOf(key);
                if (pos == -1) {
                    throw new LibCurlError(`ja3 fingerprint TLSv1.3 cipher ${key} no support`);
                }
                tls13_ciphers.push(pos + 1);
                return;
            }
            return cipher;
        }).filter(Boolean);
        const extensions = ja3Arr.at(2).split('-').filter((extension) => {
            return extension != '21';
        }).map(e => parseInt(e));
        const extension_permutation = extensions.map((extension) => {
            const pos = LibCurlBoringSSLExtensionPermutation.indexOf(extension);
            if (pos == -1) {
                throw new LibCurlError(`ja3 fingerprint extension ${extension} no support`);
            }
            return pos + 1;
        });
        const supportGroups = ja3Arr.at(3).split('-').map((key) => {
            if (!LibCurlJA3SupportGroup[key]) {
                throw new LibCurlError(`ja3 fingerprint supportGroup ${key} no support`);
            }
            return LibCurlJA3SupportGroup[key];
        });
        this.m_libCurl_impl_.setJA3Fingerprint(parseInt(tlsVersion), cipherArr.join(':'), String.fromCharCode(...tls13_ciphers, 0), String.fromCharCode(...extension_permutation, 0), supportGroups.join(':'), 0);
    }
    send(body) {
        this.checkSending();
        this.m_isSending_ = true;
        if (this.m_isAsync_) {
            return new Promise((resolve, reject) => {
                const callStack = '\n    ' + new Error().stack.slice(10);
                const callback = (curlcode, curlcodeError) => {
                    this.m_isSending_ = false;
                    if (curlcode != 0) {
                        reject(new LibCurlError(curlcodeError, callStack));
                    }
                    else {
                        resolve(void 0);
                    }
                };
                if (body) {
                    if (body instanceof URLSearchParams) {
                        this.m_libCurl_impl_.sendAsync(body + '', callback);
                    }
                    else {
                        this.m_libCurl_impl_.sendAsync(body, callback);
                    }
                }
                else {
                    this.m_libCurl_impl_.sendAsync(callback);
                }
            });
        }
        if (body) {
            if (body instanceof URLSearchParams) {
                this.m_libCurl_impl_.send(body + '');
            }
            else {
                this.m_libCurl_impl_.send(body);
            }
        }
        else {
            this.m_libCurl_impl_.send();
        }
    }
    getResponseBody() {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseBody();
    }
    getResponseString() {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseString();
    }
    getResponseJson() {
        this.checkSending();
        return JSON.parse(this.getResponseString());
    }
}
exports.LibCurl = LibCurl;
//# sourceMappingURL=libcurl.js.map