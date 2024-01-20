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
    headers?: LibCurlHeadersInfo;
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

export class LibCurlWebSocket {
    private m_libcurlWebSocket_impl_: any;
    private m_instance: LibCurl;
    private m_isOpen: boolean = false;
    constructor(url: LibCurlURLInfo, option: LibCurlWebSocketOption = {}) {
        this.m_instance = option.instance || new LibCurl();
        if (option.headers) {
            this.m_instance.setRequestHeaders(option.headers);
        }
        if (option.ja3) {
            this.m_instance.setJA3Fingerprint(option.ja3);
        }
        this.m_libcurlWebSocket_impl_ = new WebSocket(
            //@ts-ignore
            this.m_instance.m_libCurl_impl_,
            () => {
                this.close();
                this.m_isOpen = false;
            },
        );
        this.open(url);
        this.m_isOpen = true;
    }

    private open(url: LibCurlURLInfo) {
        this.m_libcurlWebSocket_impl_.open(url + "");
    }

    set onopen(event: LibCurlWebSocketOnOpenEvent) {
        this.m_libcurlWebSocket_impl_.setOnOpen(event);
    }
    set onclose(event: LibCurlWebSocketOnCloseEvent) {
        this.m_libcurlWebSocket_impl_.setOnClose(event);
    }
    set onerror(event: LibCurlWebSocketOnErrorEvent) {
        this.m_libcurlWebSocket_impl_.setOnError(event);
    }
    set onmessage(event: LibCurlWebSocketOnMessageEvent) {
        this.m_libcurlWebSocket_impl_.setOnMessage(event);
    }

    send(message: Uint8Array) {
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
