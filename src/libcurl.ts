import bindings from 'bindings'

const { BaoLibCurl } = bindings('bao_curl_node_addon');

export enum LibCurl_HTTP_VERSION {
    http1_1,
    http2,
}

export class LibCurl {
    private m_libCurl_impl_: any;
    private m_isAsync_: boolean;
    private m_isSending_: boolean;
    constructor() {
        this.m_libCurl_impl_ = new BaoLibCurl();
    }
    private checkSending(): void {
        if (this.m_isSending_) {
            throw new Error('the last request is sending, don\'t send one more request on one instance!')
        }
    }
    public open(method: string, url: string, async: boolean = true): void {
        this.checkSending();
        this.m_libCurl_impl_.open(method, url);
        this.m_isAsync_ = async;
    }

    public setRequestHeader(key: string, value: string): void {
        this.checkSending();
        this.m_libCurl_impl_.setRequestHeader(key, value);
    }

    /**
     * 
     * @param headers 多个header 以\n换行链接的文本
     */
    public setRequestHeaders(headers: string): void {
        this.checkSending();
        this.m_libCurl_impl_.setRequestHeaders(headers);
    }

    /**
     * 
     * @param proxy host:port sample:127.0.0.1:8888
     * @param username 
     * @param password 
     */
    public setProxy(proxy: string, username?: string, password?: string): void {
        this.checkSending();
        if (username && password) {
            this.m_libCurl_impl_.setProxy(proxy, username, password);
        } else {
            this.m_libCurl_impl_.setProxy(proxy);
        }
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
            throw new Error('连接时间大于发送等待时间.');
        }
        this.m_libCurl_impl_.setTimeout(connectTime, sendTime);
    }

    /**
     * 
     * @param key 
     * @param value 
     * @param domain cookie作用域 sample: .baidu.com  baike.baidu.com
     */
    public setCookie(key: string, value: string, domain: string): void {
        this.checkSending();
        this.m_libCurl_impl_.setCookie(key, value, domain);
    }

    /**
     * 
     * @param key 
     * @param domain cookie作用域 sample: .baidu.com  baike.baidu.com
     */
    public removeCookie(key: string, domain: string): void {
        this.checkSending();
        this.m_libCurl_impl_.removeCookie(key, domain);
    }

    /**
     * 
     * @returns 返回所有Cookies 以\n连接
     * sample: .127.0.0.1      TRUE    /       FALSE   3000000000      a       b
     *         .127.0.0.1      TRUE    /api    FALSE   3000000000      c       d
     */
    public getCookies(): string {
        this.checkSending();
        return this.m_libCurl_impl_.getCookies();
    }

    /**
     * 
     * @param key
     * @returns 返回该key对应的cookie
     * sample: 
     */
    public getCookie(key: string): string {
        this.checkSending();
        return this.m_libCurl_impl_.getCookie(key);
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
     * 重置curl 包括之前的所有设定
     */
    public reset(): void {
        this.checkSending();
        this.m_libCurl_impl_.reset();
    }

    /**
     * 
     * @param isAllow 是否允许重定向
     */
    public setRedirect(isAllow: boolean): void {
        this.checkSending();
        this.m_libCurl_impl_.setRedirect(isAllow);
    }

    /**
     * 打印libcurl内部的 解析信息、连接信息、tls信息等等
     */
    public printInnerLogger(): void {
        this.checkSending();
        this.m_libCurl_impl_.printInnerLogger();
    }

    /**
     * 
     * @param version 
     * 设置http版本号
     */
    public setHttpVersion(version: LibCurl_HTTP_VERSION): void {
        this.checkSending();
        this.m_libCurl_impl_.setHttpVersion(version);
    }

    /**
     * 
     * @param body POST PUT PATCH时 发送的body
     * 当body不为string或uint8array时 此函数将用JSON.stringify转换对象
     */
    public send(body?: string | Uint8Array | any): Promise<undefined> | undefined {
        this.checkSending();
        this.m_isSending_ = true;
        if (this.m_isAsync_) {
            return new Promise((resolve, reject) => {
                const callback = () => {
                    this.m_isSending_ = false;
                    resolve(void 0);
                };
                if (body) {
                    this.m_libCurl_impl_.sendAsync(body, callback);
                } else {
                    this.m_libCurl_impl_.sendAsync(callback);
                }
            })
        }
        if (body) {
            this.m_libCurl_impl_.send(body);
        } else {
            this.m_libCurl_impl_.send();
        }
    }

    public getResponseBody(): Uint8Array {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseBody();
    }

    public getResponseString(): string {
        this.checkSending();
        return this.m_libCurl_impl_.getResponseString();
    }

    public getResponseJson(): Object {
        this.checkSending();
        return JSON.parse(this.getResponseString());
    }

    /**
     * 
     * @param callbackName 
     * @returns JSON
     * unsafe
     * sample __WX__({a:1})
     */
    public getResponseJsonp(callbackName?: string): Object {
        this.checkSending();
        const str: string = this.getResponseString();
        let jsonstr: string = str;
        if (callbackName) {
            [, jsonstr] = new RegExp(`\s*${callbackName}[\s\S]*(.*)[\s\S]*`, 'g').exec(str)
        } else {
            try {
                eval(str)
                throw new Error('it seem not a jsonp');
            } catch (error) {
                [, callbackName] = /(.*) is not defined/g.exec(error.message)
                return this.getResponseJsonp(callbackName);
            }
        }
        return eval(jsonstr);
    }
}