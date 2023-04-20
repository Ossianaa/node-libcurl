import { LibCurl, LibCurlBodyInfo, LibCurlCookiesAttr, LibCurlCookiesInfo, LibCurlHeadersAttr, LibCurlHeadersInfo, LibCurlMethodInfo, LibCurlProxyInfo, LibCurlHttpVersionInfo, LibCurlURLInfo, LibCurlError, LibCurlJA3FingerPrintInfo } from "./libcurl"
import { libcurlRandomJA3Fingerprint, libcurlSetCookies, md5 } from "./utils";

type requestsHttpVersionInfo = LibCurlHttpVersionInfo;
type requestsHeadersInfo = LibCurlHeadersInfo;
type requestsBodyInfo = LibCurlBodyInfo;
type requestsCookiesInfo = LibCurlCookiesInfo;
type requestsMethodInfo = LibCurlMethodInfo;

type requestsProxyInfo = LibCurlProxyInfo;
type requestsURLInfo = LibCurlURLInfo

interface requestsResponseImp {
    readonly text: string;
    readonly json: object;
    readonly buffer: Uint8Array;
    readonly headers: string;
    readonly headersMap: LibCurlHeadersAttr;
    readonly status: number;
    readonly contentLength: number;
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

    public get contentLength(): number {
        return this.curl.getResponseContentLength();
    }


}

interface requestsInitOption {
    redirect?: boolean;
    cookies?: requestsCookiesInfo;
    proxy?: requestsProxyInfo;
    body?: requestsBodyInfo;
    httpVersion?: requestsHttpVersionInfo;
    /**
     * 打印curl内部访问日志
     */
    verbose?: boolean;
    /**
     * 单位(秒)
     */
    timeout?: number;
    /**
     * 指定网卡访问 
     */
    interface?: string;
    /**
     * 传入LibCurl实例可以做持久化连接
     */
    instance?: LibCurl;

    ja3?: LibCurlJA3FingerPrintInfo;
}

type requestsParamsInfo = URLSearchParams | string | { [key: string]: string };


interface requestsOption {
    headers?: requestsHeadersInfo;
    params?: requestsParamsInfo;
    json?: object;
    data?: requestsBodyInfo;
    timeout?: number;
}


interface requestsStaticOption
    extends Omit<requestsInitOption, 'body' | 'instance'>, requestsOption {

}


const assignURLSearchParam = (target: URLSearchParams, source: URLSearchParams) => {
    source.forEach((value, key) => {
        target.append(key, value);
    })
}

export class requests {
    private option: requestsInitOption;
    private needSetCookies: boolean;
    private ja3: LibCurlJA3FingerPrintInfo;

    constructor(option: requestsInitOption = {}) {
        this.option = { ...option };
        const { cookies, timeout, verbose,redirect = false, proxy, httpVersion, interface: interface_, ja3 } = option;
        const curl = this.option.instance ||= new LibCurl();
        if (cookies) {
            this.needSetCookies = !!cookies;
        }
        if (timeout) {
            curl.setTimeout(timeout, timeout);
        }
        if (verbose) {
            curl.printInnerLogger();
        }
        if (interface_) {
            curl.setDnsInterface(interface_);
        }
        if (typeof httpVersion != 'undefined') {
            curl.setHttpVersion(httpVersion);
        }
        if (redirect) {
            curl.setRedirect(true);
        }

        if (proxy) {
            curl.setProxy(proxy);
        }
        this.ja3 = ja3 || libcurlRandomJA3Fingerprint();
        curl.setJA3Fingerprint(this.ja3);
    }

    static session(option: requestsInitOption = {}): requests {
        return new requests(option);
    }


    //暂定6种常用方法
    static async get(url: requestsURLInfo, requestOpt?: requestsStaticOption): Promise<requestsResponse> {
        return requests.sendRequestStaic('GET', url, requestOpt);
    }
    static async post(url: requestsURLInfo, requestOpt?: requestsStaticOption): Promise<requestsResponse> {
        return requests.sendRequestStaic('POST', url, requestOpt);
    }
    static async put(url: requestsURLInfo, requestOpt?: requestsStaticOption): Promise<requestsResponse> {
        return requests.sendRequestStaic('PUT', url, requestOpt);
    }
    static async patch(url: requestsURLInfo, requestOpt?: requestsStaticOption): Promise<requestsResponse> {
        return requests.sendRequestStaic('PATCH', url, requestOpt);
    }
    static async trace(url: requestsURLInfo, requestOpt?: requestsStaticOption): Promise<requestsResponse> {
        return requests.sendRequestStaic('TRACE', url, requestOpt);
    }
    static async head(url: requestsURLInfo, requestOpt?: requestsStaticOption): Promise<requestsResponse> {
        return requests.sendRequestStaic('HEAD', url, requestOpt);
    }
    async get(url: requestsURLInfo, requestOpt?: requestsOption): Promise<requestsResponse> {
        return this.sendRequest('GET', url, requestOpt);
    }
    async post(url: requestsURLInfo, requestOpt?: requestsOption): Promise<requestsResponse> {
        return this.sendRequest('POST', url, requestOpt);
    }
    async put(url: requestsURLInfo, requestOpt?: requestsOption): Promise<requestsResponse> {
        return this.sendRequest('PUT', url, requestOpt);
    }
    async patch(url: requestsURLInfo, requestOpt?: requestsOption): Promise<requestsResponse> {
        return this.sendRequest('PATCH', url, requestOpt);
    }
    async trace(url: requestsURLInfo, requestOpt?: requestsOption): Promise<requestsResponse> {
        return this.sendRequest('TRACE', url, requestOpt);
    }
    async head(url: requestsURLInfo, requestOpt?: requestsOption): Promise<requestsResponse> {
        return this.sendRequest('HEAD', url, requestOpt);
    }

    setCookie(key: string, value: string, domain: string, path: string = '') {
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

    getJA3Fingerprint() {
        return {
            ja3: this.ja3,
            ja3_hash: md5(this.ja3),
        };
    }

    private async sendRequest(method: requestsMethodInfo, url: requestsURLInfo, requestOpt?: requestsOption): Promise<requestsResponse> {
        const { instance: curl,  cookies, timeout: timeoutOpt } = this.option;
        const { headers, data, json, params, timeout } = requestOpt || {};

        if (data && json) {
            throw new LibCurlError('both data and json exist');
        }
        const url_ = new URL(url);
        if (this.needSetCookies) {
            this.needSetCookies = false;
            libcurlSetCookies(curl, cookies, url_.hostname.split('.').slice(-2).join('.'));//放到top域名里去
        }
        if (params) {
            assignURLSearchParam(url_.searchParams, new URLSearchParams(params));
        }
        curl.open(method, url_, true);
        if (headers) {
            curl.setRequestHeaders(headers);
        }
        
        if (timeout) {
            curl.setTimeout(timeout, timeout);
        } else if (timeoutOpt) {
            curl.setTimeout(timeoutOpt, timeoutOpt);
        }
        let hasContentType = false;
        if (headers && (data || json)) {
            //如果有传入data或json 才用的上
            const contentTypeFilter = (e: string[]) => e.some(e => e.toLocaleLowerCase() == 'content-type');
            if (typeof headers == 'string') {
                hasContentType = /content-type/i.test(headers);
            } else if (headers instanceof Map) {
                hasContentType = contentTypeFilter([...headers.keys()]);
            } else {
                hasContentType = contentTypeFilter(Object.keys(headers));
            }
        }
        if (json) {
            if (!hasContentType) {
                curl.setRequestHeader('Content-Type', 'application/json');
            }
            await curl.send(json);//不用序列化 cpp代码已经处理
        } else if (data) {
            let sendData = data;
            if (!hasContentType) {
                if (typeof data == 'string') {
                    curl.setRequestHeader('Content-Type', 'text/plain');
                } else if (data instanceof URLSearchParams) {
                    curl.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                } else if (data instanceof Uint8Array) {
                    curl.setRequestHeader('Content-Type', 'application/octet-stream');
                } else {
                    curl.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                }
            }

            if (data instanceof Uint8Array) {
                //直接发送
            }
            else if (
                !(data instanceof URLSearchParams) &&
                typeof data == 'object' && data != null
            ) {
                sendData = Object.keys(data).map((e) => {
                    const value = data[e];
                    const type = typeof value;
                    if (/* value !== null && */['object', 'boolean'].includes(type)) {
                        //照样处理null
                        return [e, JSON.stringify(value)];
                    } else if (type == 'undefined') {
                        return [e, ''];
                    } else if (['string', 'number'].includes(type)) {
                        return [e, value + ''];
                    } else {
                        throw new LibCurlError(`data unkown type ${type}`)
                    }

                })
                    .map(([key, value]: [string, string]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                    .join('&');
            }
            await curl.send(sendData);
        } else {
            await curl.send();
        }
        return new requestsResponse(curl);
    }

    private static async sendRequestStaic(method: requestsMethodInfo, url: requestsURLInfo, requestStaticOpt?: requestsStaticOption) {
        return requests.session(requestStaticOpt as requestsInitOption).sendRequest(method, url, requestStaticOpt);
    }
}