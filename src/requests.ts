import {
    LibCurl,
    LibCurlBodyInfo,
    LibCurlCookiesAttr,
    LibCurlCookiesInfo,
    LibCurlRequestHeadersAttr,
    LibCurlHeadersInfo,
    LibCurlMethodInfo,
    LibCurlProxyInfo,
    LibCurlHttpVersionInfo,
    LibCurlURLInfo,
    LibCurlError,
    LibCurlJA3FingerPrintInfo,
    LibCurlAkamaiFingerPrintInfo,
    LibCurlAutoSortRequestHeadersOption,
    LibCurlInterfaceInfo,
    LibCurlSSLCertType,
    LibCurlSSLBlob,
    LibCurlRequestHeadersOrder,
    LibCurlRequestType,
} from "./libcurl";
import {
    CaseInsensitiveMap,
    getUriTopLevelHost,
    libcurlSetCookies,
} from "./utils";

type requestsCookiesInfo = {
    value: LibCurlCookiesInfo;
    uri: string;
};

interface requestsResponseImp {
    readonly text: string;
    readonly json: object;
    readonly buffer: Uint8Array;
    readonly headers: string;
    readonly headersMap: Headers;
    readonly status: number;
    readonly contentLength: number;
}

class requestsResponse implements requestsResponseImp {
    private responseBody: Uint8Array;
    private responseHeaders: string;
    private responseHeadersMap: Headers;
    private responseStatus: number;
    private responseContentLength: number;
    private responseText: string;
    private responseJson: object;
    constructor(curl: LibCurl) {
        this.responseBody = curl.getResponseBody();
        this.responseHeaders = curl.getResponseHeaders();
        this.responseHeadersMap = curl.getResponseHeadersMap();
        this.responseStatus = curl.getResponseStatus();
        this.responseContentLength = curl.getResponseContentLength();
    }

    public get text(): string {
        return (this.responseText ||= new TextDecoder().decode(
            this.responseBody,
        ));
    }

    public get json(): object {
        return (this.responseJson ||= JSON.parse(this.text));
    }

    public get buffer(): Uint8Array {
        return this.responseBody;
    }

    public get headers(): string {
        return this.responseHeaders;
    }

    public get headersMap(): Headers {
        return this.responseHeadersMap;
    }

    public get status(): number {
        return this.responseStatus;
    }

    public get contentLength(): number {
        return this.responseContentLength;
    }
}

interface requestsInitOption {
    redirect?: boolean;
    cookies?: requestsCookiesInfo | requestsCookiesInfo[];
    proxy?: LibCurlProxyInfo;
    body?: LibCurlBodyInfo;

    defaultRequestHeaders?: LibCurlHeadersInfo;

    httpVersion?: LibCurlHttpVersionInfo;
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

    akamai?: LibCurlAkamaiFingerPrintInfo;

    /**
     * 自动重排请求头 对标chrome fetch方法
     */
    autoSortRequestHeaders?: LibCurlAutoSortRequestHeadersOption;

    requestType?: LibCurlRequestType;

    sslCert?: {
        certBlob: LibCurlSSLBlob;
        privateKeyBlob?: LibCurlSSLBlob;
        type: LibCurlSSLCertType;
        password?: string;
    };
}

type requestsParamsInfo = URLSearchParams | string | { [key: string]: string };

interface requestsOption {
    headers?: LibCurlHeadersInfo;
    params?: requestsParamsInfo;
    json?: object;
    data?: LibCurlBodyInfo;
    timeout?: number;
    redirect?: boolean;
    proxy?: LibCurlProxyInfo;
    interface?: string;
    httpVersion?: LibCurlHttpVersionInfo;
    h2config?: {
        weight: number;
        streamId?: number;
    };
    headersOrder?: LibCurlRequestHeadersOrder;
}

interface requestsStaticOption
    extends Omit<requestsInitOption, "body" | "instance">,
        requestsOption {}

type requestsRetryConditionCallback = (
    resp: requestsResponse | null,
    error?: Error,
) => Promise<boolean> | boolean;

interface requestsRetryOption {
    retryNum: number;
    conditionCallback: requestsRetryConditionCallback;
}

const assignURLSearchParam = (
    target: URLSearchParams,
    source: URLSearchParams,
) => {
    source.forEach((value, key) => {
        target.append(key, value);
    });
};

export class requests {
    private option: requestsInitOption;
    private defaultRequestsHeaders: LibCurlHeadersInfo | null = null;
    protected retryOption: requestsRetryOption = {
        retryNum: 0,
        conditionCallback(resp, error) {
            return !error;
        },
    };

    constructor(option: requestsInitOption = {}) {
        this.option = { ...option };
        const {
            cookies,
            timeout,
            verbose,
            redirect = false,
            proxy,
            httpVersion,
            interface: interface_,
            autoSortRequestHeaders,
            defaultRequestHeaders,
            sslCert,
            requestType,
        } = option;
        const curl = (this.option.instance ||= new LibCurl());
        if (cookies) {
            if (Array.isArray(cookies)) {
                cookies.forEach((cookies) => {
                    libcurlSetCookies(
                        curl,
                        cookies.value,
                        getUriTopLevelHost(cookies.uri),
                    );
                });
            } else {
                libcurlSetCookies(
                    curl,
                    cookies.value,
                    getUriTopLevelHost(cookies.uri),
                );
            }
        }
        if (timeout) {
            curl.setTimeout(timeout, timeout);
        }
        if (verbose) {
            curl.setVerbose(verbose);
        }
        if (interface_) {
            curl.setInterface(interface_);
        }
        if (typeof httpVersion != "undefined") {
            curl.setHttpVersion(httpVersion);
        }
        if (redirect) {
            curl.setRedirect(true);
        }

        if (proxy) {
            curl.setProxy(proxy);
        }
        if (typeof defaultRequestHeaders != "undefined") {
            this.setDefaultRequestHeaders(defaultRequestHeaders);
        }
        if (typeof autoSortRequestHeaders != "undefined") {
            curl.setAutoSortRequestHeaders(autoSortRequestHeaders);
        }
        if (typeof requestType == "string") {
            curl.setRequestType(requestType);
        }
        if (typeof sslCert != "undefined") {
            curl.setSSLCert(
                sslCert.certBlob,
                sslCert.privateKeyBlob,
                sslCert.type,
                sslCert.password,
            );
        }
    }

    public setDefaultRequestHeaders(headers: LibCurlHeadersInfo) {
        this.defaultRequestsHeaders = headers;
    }

    public static session(option: requestsInitOption = {}): requests {
        return new requests(option);
    }

    private async sendRequest(
        method: LibCurlMethodInfo,
        url: LibCurlURLInfo,
        requestOpt?: requestsOption,
    ): Promise<requestsResponse> {
        const {
            instance: curl,
            timeout: timeoutOpt,
            ja3,
            akamai,
        } = this.option;
        const {
            headers,
            data,
            json,
            params,
            timeout,
            interface: interface_,
            redirect,
            proxy,
            httpVersion,
            h2config,
            headersOrder,
        } = requestOpt || {};

        if (data && json) {
            throw new LibCurlError("both data and json exist");
        }
        const url_ = new URL(url);
        if (params) {
            assignURLSearchParam(
                url_.searchParams,
                new URLSearchParams(params),
            );
        }
        curl.open(method, url_);
        if (this.defaultRequestsHeaders) {
            curl.setRequestHeaders(this.defaultRequestsHeaders);
        }
        if (headers) {
            curl.setRequestHeaders(headers);
        }
        if (typeof timeout == "number") {
            curl.setTimeout(timeout, timeout);
        } else if (timeoutOpt) {
            curl.setTimeout(timeoutOpt, timeoutOpt);
        }
        if (typeof interface_ == "string") {
            curl.setInterface(interface_);
        }
        if (typeof redirect == "boolean") {
            curl.setRedirect(redirect);
        } else {
            if (this.option.redirect) {
                curl.setRedirect(this.option.redirect);
            }
        }
        if (proxy) {
            curl.setProxy(proxy);
        }
        if (typeof httpVersion == "number") {
            curl.setHttpVersion(httpVersion);
        }
        curl.setJA3Fingerprint(ja3);
        if (akamai) {
            curl.setAkamaiFingerprint(akamai);
        }

        if (h2config) {
            if (typeof h2config.streamId == "number") {
                curl.setHttp2NextStreamId(h2config.streamId);
            }
            curl.setHttp2StreamWeight(h2config.weight);
        }

        if (typeof headersOrder != "undefined" && Array.isArray(headersOrder)) {
            curl.setNextRequestHeadersOrder(headersOrder);
        }

        let hasContentType = false;
        if (headers && (data || json)) {
            //如果有传入data或json 才用的上
            const contentTypeFilter = (e: string[]) =>
                e.some((e) => e.toLocaleLowerCase() == "content-type");
            if (typeof headers == "string") {
                hasContentType = /content-type/i.test(headers);
            } else if (headers instanceof Headers) {
                hasContentType = headers.has("content-type");
            } else {
                hasContentType = contentTypeFilter(Object.keys(headers));
            }
        }
        if (json) {
            if (!hasContentType) {
                curl.setRequestHeader("Content-Type", "application/json");
            }
            await curl.send(json); //不用序列化 cpp代码已经处理
        } else if (data) {
            let sendData = data;
            if (!hasContentType) {
                if (
                    typeof data == "string" ||
                    data instanceof URLSearchParams
                ) {
                    curl.setRequestHeader(
                        "Content-Type",
                        "application/x-www-form-urlencoded",
                    );
                } else if (data instanceof Uint8Array) {
                    curl.setRequestHeader(
                        "Content-Type",
                        "application/octet-stream",
                    );
                } else {
                    curl.setRequestHeader(
                        "Content-Type",
                        "application/x-www-form-urlencoded",
                    );
                }
            }

            if (
                !(data instanceof URLSearchParams) &&
                typeof data == "object" &&
                data != null &&
                !(data instanceof Uint8Array)
            ) {
                sendData = Object.keys(data)
                    .map((e) => {
                        const value = data[e];
                        const type = typeof value;
                        if (
                            /* value !== null && */ [
                                "object",
                                "boolean",
                            ].includes(type)
                        ) {
                            //照样处理null
                            return [e, JSON.stringify(value)];
                        } else if (type == "undefined") {
                            return [e, ""];
                        } else if (["string", "number"].includes(type)) {
                            return [e, value + ""];
                        } else {
                            throw new LibCurlError(`data unkown type ${type}`);
                        }
                    })
                    .map(
                        ([key, value]: [string, string]) =>
                            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
                    )
                    .join("&");
            }
            await curl.send(sendData);
        } else {
            await curl.send();
        }
        return new requestsResponse(curl);
    }

    private static async sendRequestStaic(
        method: LibCurlMethodInfo,
        url: LibCurlURLInfo,
        requestStaticOpt?: requestsStaticOption,
    ) {
        return requests
            .session(requestStaticOpt as requestsInitOption)
            .sendRequestRetry(method, url, requestStaticOpt);
    }

    private async sendRequestRetry(
        method: LibCurlMethodInfo,
        url: LibCurlURLInfo,
        requestOpt?: requestsOption,
    ): Promise<requestsResponse> {
        let isSuccess = false,
            resp: requestsResponse;
        const { retryNum, conditionCallback } = this.retryOption;
        if (retryNum == 0) {
            return this.sendRequest(method, url, requestOpt);
        }
        for (let i = 0; i <= retryNum; i++) {
            try {
                resp = await this.sendRequest(method, url, requestOpt);
                isSuccess = await conditionCallback(resp);
                if (isSuccess) {
                    break;
                }
            } catch (error) {
                isSuccess = await conditionCallback(null, error);
                if (isSuccess) {
                    break;
                }
            }
        }
        if (!isSuccess) {
            throw new LibCurlError(`failed after ${retryNum} retries`);
        }
        return resp;
    }

    public static async get(
        url: LibCurlURLInfo,
        requestOpt?: requestsStaticOption,
    ): Promise<requestsResponse> {
        return requests.sendRequestStaic("GET", url, requestOpt);
    }
    public static async post(
        url: LibCurlURLInfo,
        requestOpt?: requestsStaticOption,
    ): Promise<requestsResponse> {
        return requests.sendRequestStaic("POST", url, requestOpt);
    }
    public static async put(
        url: LibCurlURLInfo,
        requestOpt?: requestsStaticOption,
    ): Promise<requestsResponse> {
        return requests.sendRequestStaic("PUT", url, requestOpt);
    }
    public static async patch(
        url: LibCurlURLInfo,
        requestOpt?: requestsStaticOption,
    ): Promise<requestsResponse> {
        return requests.sendRequestStaic("PATCH", url, requestOpt);
    }
    public static async trace(
        url: LibCurlURLInfo,
        requestOpt?: requestsStaticOption,
    ): Promise<requestsResponse> {
        return requests.sendRequestStaic("TRACE", url, requestOpt);
    }
    public static async head(
        url: LibCurlURLInfo,
        requestOpt?: requestsStaticOption,
    ): Promise<requestsResponse> {
        return requests.sendRequestStaic("HEAD", url, requestOpt);
    }
    public static async delete(
        url: LibCurlURLInfo,
        requestOpt?: requestsStaticOption,
    ): Promise<requestsResponse> {
        return requests.sendRequestStaic("DELETE", url, requestOpt);
    }
    public static async options(
        url: LibCurlURLInfo,
        requestOpt?: requestsStaticOption,
    ): Promise<requestsResponse> {
        return requests.sendRequestStaic("OPTIONS", url, requestOpt);
    }
    public async get(
        url: LibCurlURLInfo,
        requestOpt?: requestsOption,
    ): Promise<requestsResponse> {
        return this.sendRequestRetry("GET", url, requestOpt);
    }
    public async post(
        url: LibCurlURLInfo,
        requestOpt?: requestsOption,
    ): Promise<requestsResponse> {
        return this.sendRequestRetry("POST", url, requestOpt);
    }
    public async put(
        url: LibCurlURLInfo,
        requestOpt?: requestsOption,
    ): Promise<requestsResponse> {
        return this.sendRequestRetry("PUT", url, requestOpt);
    }
    public async patch(
        url: LibCurlURLInfo,
        requestOpt?: requestsOption,
    ): Promise<requestsResponse> {
        return this.sendRequestRetry("PATCH", url, requestOpt);
    }
    public async trace(
        url: LibCurlURLInfo,
        requestOpt?: requestsOption,
    ): Promise<requestsResponse> {
        return this.sendRequestRetry("TRACE", url, requestOpt);
    }
    public async head(
        url: LibCurlURLInfo,
        requestOpt?: requestsOption,
    ): Promise<requestsResponse> {
        return this.sendRequestRetry("HEAD", url, requestOpt);
    }
    public async delete(
        url: LibCurlURLInfo,
        requestOpt?: requestsOption,
    ): Promise<requestsResponse> {
        return this.sendRequestRetry("DELETE", url, requestOpt);
    }
    public async options(
        url: LibCurlURLInfo,
        requestOpt?: requestsOption,
    ): Promise<requestsResponse> {
        return this.sendRequestRetry("OPTIONS", url, requestOpt);
    }

    public setCookie(
        key: string,
        value: string,
        domain: string,
        path: string = "",
    ) {
        this.option.instance.setCookie({
            name: key,
            value,
            domain,
            path,
        });
    }

    public getCookie(key: string, domain?: string, path?: string): string {
        return this.option.instance.getCookie({
            name: key,
            domain: domain || "",
            path: path || "",
        });
    }

    public getCookies(domain?: string, path?: string): string {
        if (arguments.length == 0) {
            return this.option.instance.getCookies();
        }
        return this.option.instance.getCookies({
            domain: domain || "",
            path: path || "",
        });
    }
    public getCookiesMap(domain?: string, path?: string): LibCurlCookiesAttr {
        if (arguments.length == 0) {
            return this.option.instance.getCookiesMap();
        }
        return this.option.instance.getCookiesMap({
            domain: domain || "",
            path: path || "",
        });
    }

    public deleteCookie(key: string, domain: string, path?: string) {
        this.option.instance.deleteCookie({
            name: key,
            domain: domain,
            path: path || "/",
        });
    }

    /**
     *
     * @param retryNum
     * @param conditionCallback defaults timeout return false
     * @returns
     */
    public retry(
        retryNum: number,
        conditionCallback?: requestsRetryConditionCallback,
    ) {
        if (retryNum < 0) {
            throw new LibCurlError("retryNum must be great than 0");
        }
        const rq = requests.session({
            ...this.option,
        });
        rq.retryOption.retryNum = retryNum;
        rq.defaultRequestsHeaders = this.defaultRequestsHeaders;
        if (typeof conditionCallback == "function") {
            rq.retryOption.conditionCallback = conditionCallback;
        }
        return rq;
    }

    public setProxy(proxyOpt: LibCurlProxyInfo): void {
        this.option.instance.setProxy(proxyOpt);
    }

    public setTimeout(connectTime: number, sendTime: number): void {
        this.option.instance.setTimeout(connectTime, sendTime);
    }

    public setRedirect(enable: boolean): void {
        this.option.instance.setRedirect(enable);
    }

    public setHttpVersion(version: LibCurlHttpVersionInfo): void {
        this.option.httpVersion = version;
        this.option.instance.setHttpVersion(version);
    }

    public setInterface(network: LibCurlInterfaceInfo): void {
        this.option.instance.setInterface(network);
    }

    public setJA3Fingerprint(
        ja3: LibCurlJA3FingerPrintInfo = "chrome133",
    ): void {
        this.option.ja3 = ja3;
    }

    public setAkamaiFingerprint(akamai: LibCurlAkamaiFingerPrintInfo): void {
        this.option.akamai = akamai;
    }
}
