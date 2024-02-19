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
    m_thread = std::thread([this]() {
        while (1) {
            m_lock.lock();
            bool isOpen = m_isOpen;
            m_lock.unlock();
            if (!isOpen)
            {
                break;
            }
            char buffer[0xffff];
            size_t rlen;
            const struct curl_ws_frame* meta;
            CURLcode res;
            m_lock.lock();
            res = curl_ws_recv(m_curl, buffer, sizeof(buffer), &rlen, &meta);
            m_lock.unlock();
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
    });
    return ;
}

void BaoCurlWebSocket::send(uint8_t* data, size_t size) {
    size_t sent;
    m_lock.lock();
    CURLcode res = curl_ws_send(m_curl, data, size, &sent, 0, CURLWS_BINARY);
    m_lock.unlock();
}

void BaoCurlWebSocket::send(std::string& text) {
    size_t sent;
    m_lock.lock();
    CURLcode res = curl_ws_send(m_curl, text.c_str(), text.size(), &sent, 0, CURLWS_TEXT);
    m_lock.unlock();
}

void BaoCurlWebSocket::close(bool forward) {
    if (forward && !m_isOpen) return;
    m_lock.lock();
    m_isOpen = false;
    m_lock.unlock();
    if (forward)
    {
        size_t sent;
        m_lock.lock();
        curl_ws_send(m_curl, "", 0, &sent, 0, CURLWS_CLOSE);
        m_lock.unlock();
        if (m_thread.joinable())
        {
            m_thread.join();
        }
        
    }
    m_onclose();
}

NAMESPACE_BAO_END