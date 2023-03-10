import { LibCurl, LibCurlCookieAttrArray, LibCurlCookiesInfo, LibCurlGetCookiesOption } from "./libcurl";
export declare const httpCookiesToArray: (cookies: string) => LibCurlCookieAttrArray[];
export declare const cookieOptFilter: (cookieOpt: LibCurlGetCookiesOption) => (e: LibCurlCookieAttrArray) => boolean;
export declare const libcurlSetCookies: (curl: LibCurl, cookies: LibCurlCookiesInfo, domain: string) => void;
