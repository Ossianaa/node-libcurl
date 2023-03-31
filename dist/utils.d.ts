import { LibCurl, LibCurlCookieAttrArray, LibCurlCookiesInfo, LibCurlGetCookiesOption } from "./libcurl";
export declare const httpCookiesToArray: (cookies: string) => LibCurlCookieAttrArray[];
export declare const cookieOptFilter: (cookieOpt: LibCurlGetCookiesOption) => (e: LibCurlCookieAttrArray) => boolean;
export declare const libcurlSetCookies: (curl: LibCurl, cookies: LibCurlCookiesInfo, domain: string) => void;
export declare const libcurlRandomJA3Fingerprint: () => string;
export declare const md5: (e: string) => string;
