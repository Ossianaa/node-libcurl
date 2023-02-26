import { LibCurl, LibCurlCookiesAttr, LibCurl_HTTP_VERSION } from "./libcurl";

type LibCurlHeadersInfo = [string, string][] | object | string;
type LibCurlBodyInfo = string | Uint8Array | any;
type LibCurlCookiesInfo = string | object;
type LibCurlHttpVersionInfo = LibCurl_HTTP_VERSION;
type LibCurlMethodInfo = 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH'

type LibCurlProxyWithAccountInfo = {
    proxy: string;
    username: string;
    password: string;
};
type LibCurlProxyInfo = string | LibCurlProxyWithAccountInfo;

interface LibCurlRequestInfo {
    method?: LibCurlMethodInfo;
    headers?: LibCurlHeadersInfo;
    body?: LibCurlBodyInfo;
    redirect?: boolean;
    cookies?: LibCurlCookiesInfo;
    httpVersion?: LibCurlHttpVersionInfo;
    openInnerLog?: boolean;
    proxy?: LibCurlProxyInfo;
    /**
     * 传入LibCurl实例可以做持久化连接
     */
    instance?: LibCurl;
}

interface LibCurlResponseInfo {
    status: () => number;
    arraybuffer: () => Promise<ArrayBuffer>;
    text: () => Promise<string>;
    json: () => Promise<object>;
    jsonp: (callbackName?: string) => Promise<object>;
    headers: () => Promise<string>;
    cookies: () => Promise<string>;
    cookiesMap: () => Promise<LibCurlCookiesAttr>;
}

export async function fetch(url: string | URL, request: LibCurlRequestInfo = {}): Promise<LibCurlResponseInfo> {
    request.instance ||= new LibCurl();
    const curl = request.instance;
    return new Promise((resolve, reject) => {
        const { method = "GET",
            headers = [], redirect = false, httpVersion = 0,
            openInnerLog = false, proxy, body, cookies } = request;
        curl.open(method, url + '', true);
        if (Array.isArray(headers)) {
            headers.forEach(([key, value]) => {
                curl.setRequestHeader(key, value);
            });
        } else if (typeof headers == 'object') {
            Object.keys(headers).forEach((key: string) => {
                curl.setRequestHeader(key, headers[key]);
            })
        } else {
            curl.setRequestHeaders(headers);
        }
        if (redirect) {
            curl.setRedirect(true);
        }
        if (httpVersion) {
            curl.setHttpVersion(httpVersion);
        }
        if (openInnerLog) {
            curl.printInnerLogger();
        }
        if (cookies) {
            const { hostname } = new URL(url);
            if (typeof cookies == 'string') {
                cookies.replace(/\s+/g, '')
                    .split(';')
                    .reverse()//保证顺序不颠倒
                    .map(e => e.split('=', 2))
                    .forEach(([key, value]) => {
                        curl.setCookie({
                            name: key,
                            value,
                            domain: hostname,
                            path: '/',
                        })
                    });
            } else {
                Object.keys(cookies).forEach(key => {
                    curl.setCookie({
                        name: key,
                        value: cookies[key],
                        domain: hostname,
                        path: '/',
                    });
                })
            }
        }
        if (proxy) {
            if (typeof proxy == "string") {
                curl.setProxy(proxy);
            } else {
                const {
                    proxy: proxy_,
                    username,
                    password,
                } = proxy;
                curl.setProxy(proxy_, username, password);
            }
        }
        let promise: Promise<undefined>;
        if (body) {
            promise = curl.send(body);
        } else {
            promise = curl.send();
        }
        promise.then(() => {

            resolve(
                {
                    status: () => curl.getResponseStatus(),
                    arraybuffer: async () => curl.getResponseBody().buffer,
                    text: async () => curl.getResponseString(),
                    json: async () => curl.getResponseJson(),
                    jsonp: async (callbackName?: string) => curl.getResponseJsonp(callbackName),
                    headers: async () => curl.getResponseHeaders(),
                    cookies: async () => curl.getCookies(),
                    cookiesMap: async () => curl.getCookiesMap(),
                }
            )
        })

    })
}