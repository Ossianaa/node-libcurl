import bindings from 'bindings'
import { LibCurlURLInfo } from './libcurl';

const { BaoLibCurl } = bindings('bao_curl_node_addon');

interface LibCurlWebSocketOption {
    protocol?: string;
}

interface LibCurlWebSocketEvent {
    (): void;
}
interface LibCurlWebSocketOnOpenEvent extends LibCurlWebSocketEvent { };
interface LibCurlWebSocketOnCloseEvent extends LibCurlWebSocketEvent { };
interface LibCurlWebSocketOnErrorEvent extends LibCurlWebSocketEvent {
    (message: string): void
};
interface LibCurlWebSocketOnMessageEvent extends LibCurlWebSocketEvent {
    (message: string): void
};
type LibCurlWebSocketEventName = 'onopen' | 'onclose' | 'onerror' | 'onmessage'

export class LibCurlWebSocket {
    private m_libcurlWebSocket_impl_: any;
    private m_eventMap: Map<LibCurlWebSocketEventName, LibCurlWebSocketEvent>
    constructor(url: LibCurlURLInfo, option?: LibCurlWebSocketOption) {
        this.m_libcurlWebSocket_impl_ = new BaoLibCurl.WebSocket(url.toString(), option || {
            protocol: ""
        });
        this.m_eventMap = new Map();
        this.m_libcurlWebSocket_impl_.setOnOpen(() => {
            try {
                if (this.m_eventMap.has('onopen')) {
                    this.m_eventMap.get('onopen')?.();
                }
            } catch { }
        });

        this.m_libcurlWebSocket_impl_.setOnClose(() => {
            try {
                if (this.m_eventMap.has('onclose')) {
                    this.m_eventMap.get('onclose')?.();
                }
            } catch { }
        });

        this.m_libcurlWebSocket_impl_.setOnError((message: string) => {
            try {
                if (this.m_eventMap.has('onerror')) {
                    (this.m_eventMap.get('onerror') as LibCurlWebSocketOnErrorEvent)?.(message);
                }
            } catch { }
        });

        this.m_libcurlWebSocket_impl_.setOnMessage(global.aaa=(message: string) => {
            try {
                if (this.m_eventMap.has('onmessage')) {
                    (this.m_eventMap.get('onmessage') as LibCurlWebSocketOnMessageEvent)?.(message);
                }
            } catch { }
        });
        this.start();
    }

    private start() {
        process.nextTick(() => {
            const isSuccess = this.m_libcurlWebSocket_impl_.start();
            if (!isSuccess) {
                if (this.m_eventMap.has('onerror')) {
                    (this.m_eventMap.get('onerror') as LibCurlWebSocketOnErrorEvent)?.("HTTP/1.1 HandShake Error");
                }
            }
        })
    }

    set onopen(event: LibCurlWebSocketOnOpenEvent) {
        this.m_eventMap.set('onopen', event);
    }
    set onclose(event: LibCurlWebSocketOnCloseEvent) {
        this.m_eventMap.set('onclose', event);
    }
    set onerror(event: LibCurlWebSocketOnErrorEvent) {
        this.m_eventMap.set('onerror', event);
    }
    set onmessage(event: LibCurlWebSocketOnMessageEvent) {
        this.m_eventMap.set('onmessage', event);
    }

    send(message: string) {
        process.nextTick(() => {
            this.m_libcurlWebSocket_impl_.send(message);
        })
    }

    close(){
        this.m_libcurlWebSocket_impl_.close();
    }
}
