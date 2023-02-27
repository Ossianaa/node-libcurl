import { LibCurl, LibCurlCookiesAttr, LibCurlHeadersAttr, LibCurl_HTTP_VERSION } from "./libcurl"

type requestsHttpVersionInfo = LibCurl_HTTP_VERSION;
type requestsHeadersInfo = [string, string][] | object | string;
type requestsBodyInfo = string | Uint8Array | any;
type requestsCookiesInfo = string | object;
type requestsMethodInfo = 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH'
type requestsWithAccountInfo = {
    proxy: string;
    username: string;
    password: string;
};
type requestsInfo = string | requestsWithAccountInfo;
type requestsURL = URL | string;

interface requestsResponseImp {
    readonly text: string;
    readonly json: object;
    readonly buffer: Uint8Array;
    readonly headers: string;
    readonly headersMap: LibCurlHeadersAttr;
    readonly status: number;
    jsonp(callbackName?: string): object;
}

class requestsResponse implements requestsResponseImp {
    private curl: LibCurl;
    constructor(curl: LibCurl) {
        this.curl = curl;
    }

    public get text(): string {
        return this.curl.getResponseString();
    }

    public get json(): object {
        return this.curl.getResponseJson();
    }

    public get buffer(): Uint8Array {
        return this.curl.getResponseBody();
    }

    public get headers(): string {
        return this.curl.getResponseHeaders();
    }

    public get headersMap(): LibCurlHeadersAttr {
        return this.curl.getResponseHeadersMap();
    }

    public get status(): number {
        return this.curl.getResponseStatus();
    }

    public jsonp(callbackName?: string): object {
        return this.curl.getResponseJsonp(callbackName);
    }

}

interface requestsInitOption {
    redirect?: boolean;
    cookies?: requestsCookiesInfo;
    proxy?: requestsInfo;
    body?: requestsBodyInfo;
    httpVersion?: requestsHttpVersionInfo;

    /**
     * 单位(秒)
     */
    timeout?: number;
    /**
     * 传入LibCurl实例可以做持久化连接
     */
    instance?: LibCurl;
}

type requestsParamsInfo = URLSearchParams | string | { [key: string]: string };

interface requestsOption {
    headers?: requestsHeadersInfo;
    body?: requestsBodyInfo;
    params?: requestsParamsInfo;
}

const assignURLSearchParam = (target: URLSearchParams, source: URLSearchParams) => {
    source.forEach((value, key) => {
        target.append(key, value);
    })
}

export class requests {
    private option: requestsInitOption;
    constructor(option: requestsInitOption = {}) {
        this.option = { ...option };
        const { cookies, timeout } = option;
        const curl = this.option.instance ||= new LibCurl();

        if (cookies) {
            const hostname = '.';//暂定全局
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
        if (timeout) {
            curl.setTimeout(timeout, timeout);
        }
    }

    static session(option: requestsInitOption = {}): requests {
        return new requests(option);
    }


    //暂定6种常用方法
    static async get(url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        return requests.session().sendRequest('GET', url, requestOpt);
    }
    static async post(url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        return requests.session().sendRequest('POST', url, requestOpt);
    }
    static async put(url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        return requests.session().sendRequest('PUT', url, requestOpt);
    }
    static async patch(url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        return requests.session().sendRequest('PATCH', url, requestOpt);
    }
    static async trace(url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        return requests.session().sendRequest('TRACE', url, requestOpt);
    }
    static async head(url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        return requests.session().sendRequest('HEAD', url, requestOpt);
    }
    async get(url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        return this.sendRequest('GET', url, requestOpt);
    }
    async post(url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        return this.sendRequest('POST', url, requestOpt);
    }
    async put(url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        return this.sendRequest('PUT', url, requestOpt);
    }
    async patch(url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        return this.sendRequest('PATCH', url, requestOpt);
    }
    async trace(url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        return this.sendRequest('TRACE', url, requestOpt);
    }
    async head(url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        return this.sendRequest('HEAD', url, requestOpt);
    }

    setCookie(key: string, value: string, domain: string = '', path: string = '') {
        this.option.instance.setCookie({
            name: key,
            value,
            domain,
            path,
        });
    }

    getCookie(key: string, domain?: string, path?: string): string {
        return this.option.instance.getCookie({
            name: key,
            domain: domain || "",
            path: path || "",
        })
    }

    getCookies(domain?: string, path?: string): string {
        if (arguments.length == 0) {
            return this.option.instance.getCookies();
        }
        return this.option.instance.getCookies({
            domain: domain || "",
            path: path || "",
        })
    }
    getCookiesMap(domain?: string, path?: string): LibCurlCookiesAttr {
        if (arguments.length == 0) {
            return this.option.instance.getCookiesMap();
        }
        return this.option.instance.getCookiesMap({
            domain: domain || "",
            path: path || "",
        })
    }

    deleteCookie(key: string, domain: string, path?: string) {
        this.option.instance.deleteCookie({
            name: key,
            domain: domain,
            path: path || "/",
        })
    }

    private async sendRequest(method: requestsMethodInfo, url: requestsURL, requestOpt?: requestsOption): Promise<requestsResponse> {
        const { instance: curl, redirect = false, proxy, httpVersion } = this.option;
        const { headers, body, params } = requestOpt || {};
        const url_ = new URL(url);
        if (params) {
            assignURLSearchParam(url_.searchParams, new URLSearchParams(params));
        }
        curl.open(method, url + '', true);
        if (Array.isArray(headers)) {
            headers.forEach(([key, value]) => {
                curl.setRequestHeader(key, value);
            });
        } else if (typeof headers == 'object') {
            Object.keys(headers).forEach((key: string) => {
                curl.setRequestHeader(key, headers[key]);
            })
        } else if (typeof headers == 'string') {
            curl.setRequestHeaders(headers);
        }
        if (redirect) {
            curl.setRedirect(true);
        }
        if (httpVersion) {
            curl.setHttpVersion(httpVersion);
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
        await promise;
        return new requestsResponse(curl);
    }
}