"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibCurlWebSocket = void 0;
const bindings_1 = __importDefault(require("bindings"));
const { BaoLibCurl } = (0, bindings_1.default)('bao_curl_node_addon');
;
;
;
;
class LibCurlWebSocket {
    m_libcurlWebSocket_impl_;
    m_eventMap;
    constructor(url, option) {
        this.m_libcurlWebSocket_impl_ = new BaoLibCurl.WebSocket(url.toString(), option || {
            protocol: ""
        });
        this.m_eventMap = new Map();
        this.m_libcurlWebSocket_impl_.setOnOpen(() => {
            try {
                if (this.m_eventMap.has('onopen')) {
                    this.m_eventMap.get('onopen')?.();
                }
            }
            catch { }
        });
        this.m_libcurlWebSocket_impl_.setOnClose(() => {
            try {
                if (this.m_eventMap.has('onclose')) {
                    this.m_eventMap.get('onclose')?.();
                }
            }
            catch { }
        });
        this.m_libcurlWebSocket_impl_.setOnError((message) => {
            try {
                if (this.m_eventMap.has('onerror')) {
                    this.m_eventMap.get('onerror')?.(message);
                }
            }
            catch { }
        });
        this.m_libcurlWebSocket_impl_.setOnMessage(global.aaa = (message) => {
            try {
                if (this.m_eventMap.has('onmessage')) {
                    this.m_eventMap.get('onmessage')?.(message);
                }
            }
            catch { }
        });
        this.start();
    }
    start() {
        process.nextTick(() => {
            const isSuccess = this.m_libcurlWebSocket_impl_.start();
            if (!isSuccess) {
                if (this.m_eventMap.has('onerror')) {
                    this.m_eventMap.get('onerror')?.("HTTP/1.1 HandShake Error");
                }
            }
        });
    }
    set onopen(event) {
        this.m_eventMap.set('onopen', event);
    }
    set onclose(event) {
        this.m_eventMap.set('onclose', event);
    }
    set onerror(event) {
        this.m_eventMap.set('onerror', event);
    }
    set onmessage(event) {
        this.m_eventMap.set('onmessage', event);
    }
    send(message) {
        process.nextTick(() => {
            this.m_libcurlWebSocket_impl_.send(message);
        });
    }
    close() {
        this.m_libcurlWebSocket_impl_.close();
    }
}
exports.LibCurlWebSocket = LibCurlWebSocket;
//# sourceMappingURL=libcurlWebSocket.js.map