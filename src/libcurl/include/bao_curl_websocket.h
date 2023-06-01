#pragma once
#include <functional>
#include <iomanip>
#include <thread>
#include "curl/curl.h"
#define USER_AGENT "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
#define CURL_TIMEOUT 5//000
#define CURL_ASYNC_TIMEOUT_MS 100
#define WS_VERSION 13
#define VERIFYSSL 0

#include "bao_curl_websocket_frames.h"
#include "utils.h"

NAMESPACE_BAO_START

struct ResponseInfo {
    bool valid = false;
    bool connect_error = false;
    std::string accept_header;
    WSocketFrames resframe;
    std::vector<unsigned char> buf;
};

struct ConnectionInfo {
    CURL* curl;
    ResponseInfo resp;
    bool valid;
    bool ssl;
    std::string host;
    std::string path;
    std::string protocol;
    std::string origin;
    std::string guid;
    unsigned char ws_accept[20];
    ConnectionInfo(const std::string& uri, const std::string& protocol);
    std::string get_key();
    std::string get_uri();
    std::string get_origin();
    std::string get_protocol();
};

class BaoCurlWebSocket
{
    ConnectionInfo conn;

    bool async = true;
    std::thread async_thread;

    std::function<void()> open_cb;
    std::function<void()> close_cb;
    std::function<void(std::string)> error_cb;
    std::function<void(std::string)> message_cb;

    bool recv_wait();

    const static std::string accept_header;
    const static std::string response_code_header;

    static void default_open_cb();
    static void default_close_cb();
    static void default_error_cb(std::string);
    static void default_message_cb(std::string);

public:
    BaoCurlWebSocket(const std::string& uri, const std::string& protocol,
        std::function<void()> onopen = nullptr,
        std::function<void()> onclose = nullptr,
        std::function<void(std::string)> onerror = nullptr,
        std::function<void(std::string)> onmessage = nullptr);
    ~BaoCurlWebSocket();
    bool start();
    void close();
    bool send(const std::string& data);
    bool isClosed = true;

};

NAMESPACE_BAO_END
