import { BaoLibCurl } from "../scripts/bindings";
import {
    LibCurl,
    LibCurlError,
    LibCurlHeadersInfo,
    LibCurlJA3FingerPrintInfo,
    LibCurlURLInfo,
} from "./libcurl";

const { WebSocket } = BaoLibCurl;

interface LibCurlWebSocketOption {
    instance?: LibCurl;
    userAgent?: string;
    origin?: string;
    cookie?: string;
    timeout?: number;
    ja3?: LibCurlJA3FingerPrintInfo;
}

interface LibCurlWebSocketEvent {
    (): void;
}
interface LibCurlWebSocketOnOpenEvent extends LibCurlWebSocketEvent {}
interface LibCurlWebSocketOnCloseEvent extends LibCurlWebSocketEvent {}
interface LibCurlWebSocketOnErrorEvent extends LibCurlWebSocketEvent {
    (message: string): void;
}
interface LibCurlWebSocketOnMessageEvent extends LibCurlWebSocketEvent {
    (message: Uint8Array): void;
}

type LibCurlWebSocketSendType = Uint8Array | string;

export class LibCurlWebSocket {
    private m_libcurlWebSocket_impl_: any;
    private m_isOpen: boolean = false;

    private m_onOpen: LibCurlWebSocketOnOpenEvent;
    private m_onClose: LibCurlWebSocketOnCloseEvent;
    private m_onMessage: LibCurlWebSocketOnMessageEvent;
    private m_onError: LibCurlWebSocketOnErrorEvent;

    constructor(url: LibCurlURLInfo, option: LibCurlWebSocketOption = {}) {
        const curl = option.instance || new LibCurl();
        const headers = ["Accept:", "Accept-Encoding:"];
        if (option.cookie) {
            headers.push("Cookie: " + option.cookie);
        }
        if (option.origin) {
            headers.push("Origin: " + option.origin);
        }
        if (option.userAgent) {
            headers.push("User-Agent: " + option.userAgent);
        }
        curl.setRequestHeaders(headers.join("\n"));
        if (option.timeout) {
            curl.setTimeout(option.timeout, option.timeout);
        }
        if (option.ja3) {
            curl.setJA3Fingerprint(option.ja3);
        }
        const ws = (this.m_libcurlWebSocket_impl_ = new WebSocket(
            //@ts-ignore
            curl.m_libCurl_impl_,
        ));
        ws.setOnOpen(() => {
            this.m_isOpen = true;
            try {
                this.m_onOpen?.();
            } catch (error) {
                console.error('LibCurlWebSocket onOpen catch a error', error);
            }
        });
        ws.setOnClose(() => {
            this.m_isOpen = false;
            try {
                this.m_onClose?.();
            } catch (error) {
                console.error('LibCurlWebSocket onClose catch a error', error);
            }
        });
        ws.setOnMessage((e) => {
            try {
                this.m_onMessage?.(e);
            } catch (error) {
                console.error('LibCurlWebSocket onMessage catch a error', error);
            }
        });
        ws.setOnError((e) => {
            try {
                this.m_onError?.(e);
            } catch (error) {
                console.error('LibCurlWebSocket onError catch a error', error);
            }
        });
        this.open(url);
    }
    private open(url: LibCurlURLInfo) {
        this.m_libcurlWebSocket_impl_.open(url + "");
    }

    set onopen(event: LibCurlWebSocketOnOpenEvent) {
        this.m_onOpen = event;
    }
    set onclose(event: LibCurlWebSocketOnCloseEvent) {
        this.m_onClose = event;
    }
    set onerror(event: LibCurlWebSocketOnErrorEvent) {
        this.m_onError = event;
    }
    set onmessage(event: LibCurlWebSocketOnMessageEvent) {
        this.m_onMessage = event;
    }

    send(message: LibCurlWebSocketSendType) {
        if (!this.m_isOpen) {
            throw new LibCurlError(
                "LibCurlWebSocket is already in CLOSING or CLOSED state",
            );
        }
        this.m_libcurlWebSocket_impl_.send(message);
    }

    close() {
        if (!this.m_isOpen) {
            throw new LibCurlError(
                "LibCurlWebSocket is already in CLOSING or CLOSED state",
            );
        }
        this.m_libcurlWebSocket_impl_.close();
    }
}
