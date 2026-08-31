import { randomInt } from "crypto";

export type LibCurlJA3FingerPrintImpl =
    | "chrome99"
    | "chrome101"
    | "chrome110"
    | "chrome124"
    | "chrome131"
    | "chrome133"
    | "chrome150"
    | "chrome152"
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
const randomStringTrustAnchors = (trust_anchors: string) =>
    trust_anchors
        .split(",")
        .sort(() => (Math.random() > 0.5 ? 1 : -1))
        .join(",");

type LibCurlJA3FingerPrintConfig = [
    ja3String: string,
    tlsVerifySigalgs: LibCurlTLSVerifySigalgsInfo,
    trustAnchors?: string,
];

export const LibCurlJA3FingerPrintImplMap: {
    [K in LibCurlJA3FingerPrintImpl]: K extends Exclude<
        LibCurlJA3FingerPrintImpl,
        "auto"
    >
        ? () => LibCurlJA3FingerPrintConfig
        : (chromeVersion: number) => LibCurlJA3FingerPrintConfig;
} = {
    chrome99: () => [
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21-41,29-23-24,0`,
        [],
    ],
    chrome101: () => [
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21-41,29-23-24,0`,
        [],
    ],
    chrome110: () => [
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${randomStringExtensions("0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21")}-41,29-23-24,0`,
        [],
    ],
    chrome124: () => [
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${randomStringExtensions("0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-65037-21")}-41,25497-29-23-24,0`,
        [],
    ],
    chrome131: () => [
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${randomStringExtensions("0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-65037-21")}-41,4588-29-23-24,0`,
        [],
    ],
    chrome133: () => [
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${randomStringExtensions("0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17613-65037-21")}-41,4588-29-23-24,0`,
        [],
    ],
    chrome150: () => [
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${randomStringExtensions("0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17613-65037-21")}-41,4588-29-23-24,0`,
        [
            "ml_dsa_44",
            "ml_dsa_65",
            "ml_dsa_87",
            "ecdsa_secp256r1_sha256",
            "rsa_pss_rsae_sha256",
            "rsa_pkcs1_sha256",
            "ecdsa_secp384r1_sha384",
            "rsa_pss_rsae_sha384",
            "rsa_pkcs1_sha384",
            "rsa_pss_rsae_sha512",
            "rsa_pkcs1_sha512",
        ],
    ],
    chrome152: () => [
        // Chrome 152 adds the trust_anchors (0xCA34 / 51764) extension.
        // trustAnchors: the Chrome 152 root-store list
        `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${randomStringExtensions("0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17613-65037-21-51764")}-41,4588-29-23-24,0`,
        [
            "ml_dsa_44",
            "ml_dsa_65",
            "ml_dsa_87",
            "ecdsa_secp256r1_sha256",
            "rsa_pss_rsae_sha256",
            "rsa_pkcs1_sha256",
            "ecdsa_secp384r1_sha384",
            "rsa_pss_rsae_sha384",
            "rsa_pkcs1_sha384",
            "rsa_pss_rsae_sha512",
            "rsa_pkcs1_sha512",
        ],
        randomStringTrustAnchors(
            "11129.9.6,11129.9.11,44947.2.18,11129.9.15,52580.200109.1.18,11129.9.12,44947.2.15,44947.2.20,44947.2.19,52580.200109.1.13,11129.9.10,11129.9.13,52580.200109.1.11,11129.9.4,11129.9.1,52580.200109.1.12,52580.200109.1.9,44947.2.6,11129.9.5,52580.200109.1.7,11129.9.8,11129.9.7,52580.200109.1.10,44947.2.14,44947.2.13,44947.2.1,52580.200109.1.19,52580.200109.1.8",
        ),
    ],
    auto(chromeVersion?: number) {
        if (!chromeVersion) {
            return this.chrome152();
        }
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
        } else if (chromeVersion < 150) {
            return this.chrome133();
        } else if (chromeVersion < 152) {
            return this.chrome150();
        } else {
            return this.chrome152();
        }
    },
};

export const LibCurlAkamaiFingerPrintImplMap: {
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
        if (!chromeVersion) {
            return this.chrome119();
        }
        if (chromeVersion < 107) {
            return this.chrome99();
        } else if (chromeVersion < 119) {
            return this.chrome107();
        } else {
            return this.chrome119();
        }
    },
};

export type LibCurlJA3FingerPrintInfo = string | LibCurlJA3FingerPrintImpl;
export type LibCurlAkamaiFingerPrintInfo =
    | string
    | LibCurlAkamaiFingerPrintImpl;
export type LibCurlHttp3FingerPrintImpl =
    | "chrome126"
    | "chrome150"
    | "chrome152"
    | "auto";
type LibCurlHttp3FingerPrintConfig = {
    scid: string;
    settings: string;
    transport_params: string;
    tls: string;
    permutation: string;
    verify_sigalgs: string;
    trust_anchors?: string;
};
export type LibCurlHttp3FingerPrintInfo =
    | LibCurlHttp3FingerPrintConfig
    | LibCurlHttp3FingerPrintImpl;

export const LibCurlHttp3FingerPrintImplMap: {
    [K in LibCurlHttp3FingerPrintImpl]: K extends Exclude<
        LibCurlHttp3FingerPrintImpl,
        "auto"
    >
        ? () => LibCurlHttp3FingerPrintConfig
        : (chromeVersion: number) => LibCurlHttp3FingerPrintConfig;
} = {
    chrome126: () => ({
        scid: "scid=0",
        settings: "1:65536;6:262144;7:100;51:1;GREASE",
        transport_params: `9:103;18258:1;3:1472;4:15728640;GREASE;1:30000;8:100;32:65536;15:AUTO;7:6291456;5:6291456;12583:${randomInt(
            120000,
            200000,
        )};6:6291456;16741339:1@GREASE,1`,
        tls: "ciphers=1,2,3;alps=h3;grease=off;rand=on",
        permutation: "7,0,14,19,15,9,4,24,17,21,1",
        verify_sigalgs:
            "0x0403,0x0804,0x0401,0x0503,0x0805,0x0501,0x0806,0x0601,0x0201",
    }),
    chrome150: () => ({
        scid: "scid=0",
        settings: "1:65536;6:262144;7:100;51:1;GREASE",
        transport_params: `12584:0x4f524947;9:103;1:30000;7:6291456;15:AUTO;4:15728640;GREASE;32:65536;3:1472;17:1@1,GREASE;8:100;6:6291456;12583:${randomInt(
            120000,
            200000,
        )};5:6291456`,
        tls: "ciphers=1,2,3;alps=h3;grease=off;rand=on",
        permutation: "0,15,19,23,9,1,14,21,17,4,7",
        verify_sigalgs:
            "0x0403,0x0804,0x0401,0x0503,0x0805,0x0501,0x0806,0x0601,0x0201",
    }),
    chrome152: () => ({
        // Chrome 152 adds trust_anchors (kExtensions index 27) to the
        // extension set. trust_anchors: the Chrome 152 root-store list
        // (fp.impersonate.pro anchor names, H3 sample order from
        // chrome152-h3-fp.json).
        scid: "scid=0",
        settings: "1:65536;6:262144;7:100;51:1;GREASE",
        transport_params: `12584:0x4f524947;9:103;1:30000;7:6291456;15:AUTO;4:15728640;GREASE;32:65536;3:1472;17:1@1,GREASE;8:100;6:6291456;12583:${randomInt(
            120000,
            200000,
        )};5:6291456`,
        tls: "ciphers=1,2,3;alps=h3;grease=off;rand=on",
        permutation: "0,15,19,23,9,1,14,21,17,4,7,27",
        verify_sigalgs:
            "0x0403,0x0804,0x0401,0x0503,0x0805,0x0501,0x0806,0x0601,0x0201",
        trust_anchors: randomStringTrustAnchors(
            "11129.9.6,11129.9.11,44947.2.18,11129.9.15,52580.200109.1.18,11129.9.12,44947.2.15,44947.2.20,44947.2.19,52580.200109.1.13,11129.9.10,11129.9.13,52580.200109.1.11,11129.9.4,11129.9.1,52580.200109.1.12,52580.200109.1.9,44947.2.6,11129.9.5,52580.200109.1.7,11129.9.8,11129.9.7,52580.200109.1.10,44947.2.14,44947.2.13,44947.2.1,52580.200109.1.19,52580.200109.1.8",
        ),
    }),
    auto(chromeVersion?: number) {
        if (!chromeVersion) {
            return this.chrome152();
        }
        if (chromeVersion < 150) {
            return this.chrome126();
        } else if (chromeVersion < 152) {
            return this.chrome150();
        }
        return this.chrome152();
    },
};

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

export enum LibCurlTLSVerifySigalgs {
    "rsa_pkcs1_sha1" = 0x0201, // SSL_SIGN_RSA_PKCS1_SHA1
    "rsa_pkcs1_sha256" = 0x0401, // SSL_SIGN_RSA_PKCS1_SHA256
    "rsa_pkcs1_sha384" = 0x0501, // SSL_SIGN_RSA_PKCS1_SHA384
    "rsa_pkcs1_sha512" = 0x0601, // SSL_SIGN_RSA_PKCS1_SHA512
    "ecdsa_sha1" = 0x0203, // SSL_SIGN_ECDSA_SHA1
    "ecdsa_secp256r1_sha256" = 0x0403, // SSL_SIGN_ECDSA_SECP256R1_SHA256
    "ecdsa_secp384r1_sha384" = 0x0503, // SSL_SIGN_ECDSA_SECP384R1_SHA384
    "ecdsa_secp521r1_sha512" = 0x0603, // SSL_SIGN_ECDSA_SECP521R1_SHA512
    "rsa_pss_rsae_sha256" = 0x0804, // SSL_SIGN_RSA_PSS_RSAE_SHA256
    "rsa_pss_rsae_sha384" = 0x0805, // SSL_SIGN_RSA_PSS_RSAE_SHA384
    "rsa_pss_rsae_sha512" = 0x0806, // SSL_SIGN_RSA_PSS_RSAE_SHA512
    "ed25519" = 0x0807, // SSL_SIGN_ED25519
    "ml_dsa_44" = 0x0904, // SSL_SIGN_ML_DSA_44
    "ml_dsa_65" = 0x0905, // SSL_SIGN_ML_DSA_65
    "ml_dsa_87" = 0x0906, // SSL_SIGN_ML_DSA_87
    "rsa_pkcs1_sha256_legacy" = 0x0420, // SSL_SIGN_RSA_PKCS1_SHA256_LEGACY
    "rsa_pkcs1_md5_sha1" = 0xff01, // SSL_SIGN_RSA_PKCS1_MD5_SHA1
}

export type LibCurlTLSVerifySigalgsInfo =
    | string
    | Array<
          | LibCurlTLSVerifySigalgs
          | number
          | keyof typeof LibCurlTLSVerifySigalgs
      >;

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

export const LibCurlBoringSSLExtensionPermutation: LibCurlJA3Extension[] = [
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
