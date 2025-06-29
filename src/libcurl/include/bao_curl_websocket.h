#pragma once
#include <iostream>
#include <curl/curl.h>
#include <string.h>
#include <thread>
#include <functional>
#include <mutex>
#include "utils.h"
#include "safe_uv_idle.h"

NAMESPACE_BAO_START

class BaoCurlWebSocket {
public:
    BaoCurlWebSocket() = delete;
    BaoCurlWebSocket(CURL* curl);
    ~BaoCurlWebSocket();

    void open(std::string url);
    void setOnOpen(std::function<void()> onopen) {
        m_onopen = onopen;
    };
    void setOnClose(std::function<void()> onclose) {
        m_onclose = onclose;
    };
    void setOnError(std::function<void(std::string)> onerror) {
        m_onerror = onerror;
    };
    void setOnMessage(std::function<void(uint8_t* data, size_t size)> onmessage) {
        m_onmessage = onmessage;
    };
    void send(uint8_t* data, size_t size);
    void send(std::string& text);
    void close(bool forward);
private:
    CURL* m_curl;
    uv_timer_t m_pingTimer;
    uv_poll_t m_poll;

    bool m_isOpen = false;
    std::function<void()> m_onopen;
    std::function<void()> m_onclose;
    std::function<void(std::string)> m_onerror;
    std::function<void(uint8_t* data, size_t size)> m_onmessage;
    static void pollCallback(uv_poll_t* handle, int status, int events);
    std::vector<uint8_t> m_payload;
protected:
    std::function<void()> m_onopen_default = []() {
    };
    std::function<void()> m_onclose_default = []() {
    };
    std::function<void(std::string)> m_onerror_default = [](std::string err) {
    };
    std::function<void(uint8_t* data, size_t size)> m_onmessage_default = [](uint8_t* data, size_t size) {
    };
};

NAMESPACE_BAO_END