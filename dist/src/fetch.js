"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetch = void 0;
const libcurl_1 = require("./libcurl");
function fetch(url, request) {
    return __awaiter(this, void 0, void 0, function* () {
        request.instance || (request.instance = new libcurl_1.LibCurl());
        const curl = request.instance;
        return new Promise((resolve, reject) => {
            const { method = "GET", headers = [], redirect = false, httpVersion = 0, openInnerLog = false, proxy, body } = request;
            curl.open(method, url + '', true);
            if (Array.isArray(headers)) {
                headers.forEach(([key, value]) => {
                    curl.setRequestHeader(key, value);
                });
            }
            else if (typeof headers == 'object') {
                Object.keys(headers).forEach((key) => {
                    curl.setRequestHeader(key, headers[key]);
                });
            }
            else {
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
            if (proxy) {
                if (typeof proxy == "string") {
                    curl.setProxy(proxy);
                }
                else {
                    const { proxy: proxy_, username, password, } = proxy;
                    curl.setProxy(proxy_, username, password);
                }
            }
            let promise;
            if (body) {
                promise = curl.send(body);
            }
            else {
                promise = curl.send();
            }
            promise.then(() => {
                resolve({
                    status: curl.getResponseStatus(),
                    arraybuffer: () => curl.getResponseBody().buffer,
                    text: () => curl.getResponseString(),
                    json: () => curl.getResponseJson(),
                    jsonp: (callbackName) => curl.getResponseJsonp(callbackName),
                });
            });
        });
    });
}
exports.fetch = fetch;
//# sourceMappingURL=fetch.js.map