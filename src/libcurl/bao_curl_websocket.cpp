#include "bao_curl_websocket.h"

NAMESPACE_BAO_START

BaoCurlWebSocket::BaoCurlWebSocket(CURL* curl) {
    m_curl = curl;
    m_onopen = m_onopen_default;
    m_onclose = m_onclose_default;
    m_onerror = m_onerror_default;
    m_onmessage = m_onmessage_default;
}

BaoCurlWebSocket::~BaoCurlWebSocket() {
    close(true);
}

void BaoCurlWebSocket::open(std::string url) {
    curl_easy_setopt(m_curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(m_curl, CURLOPT_CONNECT_ONLY, 2L);
    CURLcode res = curl_easy_perform(m_curl);
    if (res) {
        m_onerror(curl_easy_strerror(res));
        close(false);
        return ;
    }
    m_onopen();
    m_isOpen = true;

    while (1) {
        if (!m_isOpen)
        {
            break;
        }
        char buffer[0xffff];
        size_t rlen;
        const struct curl_ws_frame* meta;
        res = curl_ws_recv(m_curl, buffer, sizeof(buffer), &rlen, &meta);
        if (res == CURLE_AGAIN) {
            std::this_thread::sleep_for(std::chrono::milliseconds(5));
        }
        else if (res == CURLE_OK) {
            if (meta->flags == CURLWS_CLOSE)
            {
                close(false);
                break;
            } else if (meta->flags == CURLWS_BINARY || meta->flags == CURLWS_TEXT)
            {
                auto _buffer = std::make_unique<uint8_t[]>(rlen);
                memcpy(_buffer.get(), buffer, rlen);
                m_onmessage(_buffer.get(), rlen);
            }
        }
        else {
            m_onerror(curl_easy_strerror(res));
            close(false);
            break;
        }
    }
    return ;
}

void BaoCurlWebSocket::send(uint8_t* data, size_t size) {
    size_t sent;
    curl_ws_send(m_curl, data, size, &sent, 0, CURLWS_BINARY);
}

void BaoCurlWebSocket::send(std::string& text) {
    size_t sent;
    curl_ws_send(m_curl, text.c_str(), text.size(), &sent, 0, CURLWS_TEXT);
}

void BaoCurlWebSocket::close(bool forward) {
    if (!m_isOpen) return;
    m_isOpen = false;
    if (forward)
    {
        size_t sent;
        curl_ws_send(m_curl, "", 0, &sent, 0, CURLWS_CLOSE);
    }
    m_onclose();
}

NAMESPACE_BAO_END