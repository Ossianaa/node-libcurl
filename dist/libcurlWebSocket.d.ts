import { LibCurlURLInfo } from './libcurl';
interface LibCurlWebSocketOption {
    protocol?: string;
}
interface LibCurlWebSocketEvent {
    (): void;
}
interface LibCurlWebSocketOnOpenEvent extends LibCurlWebSocketEvent {
}
interface LibCurlWebSocketOnCloseEvent extends LibCurlWebSocketEvent {
}
interface LibCurlWebSocketOnErrorEvent extends LibCurlWebSocketEvent {
    (message: string): void;
}
interface LibCurlWebSocketOnMessageEvent extends LibCurlWebSocketEvent {
    (message: string): void;
}
export declare class LibCurlWebSocket {
    private m_libcurlWebSocket_impl_;
    private m_eventMap;
    constructor(url: LibCurlURLInfo, option?: LibCurlWebSocketOption);
    private start;
    set onopen(event: LibCurlWebSocketOnOpenEvent);
    set onclose(event: LibCurlWebSocketOnCloseEvent);
    set onerror(event: LibCurlWebSocketOnErrorEvent);
    set onmessage(event: LibCurlWebSocketOnMessageEvent);
    send(message: string): void;
    close(): void;
}
export {};
