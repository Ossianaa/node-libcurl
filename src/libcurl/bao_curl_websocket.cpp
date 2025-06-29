#include "bao_curl_websocket.h"

NAMESPACE_BAO_START

BaoCurlWebSocket::BaoCurlWebSocket(CURL* curl) {
    m_curl = curl;
    m_onopen = m_onopen_default;
    m_onclose = m_onclose_default;
    m_onerror = m_onerror_default;
    m_onmessage = m_onmessage_default;

    uv_poll_init(uv_default_loop(), &m_poll, 0);
    m_poll.data = this;
}

BaoCurlWebSocket::~BaoCurlWebSocket() {
    close(true);
}

void BaoCurlWebSocket::pollCallback(uv_poll_t* handle, int status, int events) {
    BaoCurlWebSocket* instance = static_cast<BaoCurlWebSocket*>(handle->data);
    if (!instance || !instance->m_isOpen) return;

    long sockfd;
    curl_easy_getinfo(instance->m_curl, CURLINFO_ACTIVESOCKET, &sockfd);
    if (sockfd == -1) {
        instance->close(false);
        return;
    }

    char buffer[0xffff];
    size_t rlen;
    const struct curl_ws_frame* meta;
    CURLcode res = curl_ws_recv(instance->m_curl, buffer, sizeof(buffer), &rlen, &meta);

    if (res == CURLE_AGAIN) {
        return;
    }
    else if (res != CURLE_OK) {
        instance->m_onerror(curl_easy_strerror(res));
        instance->close(false);
        return;
    }


    if (meta->flags & CURLWS_CLOSE) {
        instance->close(false);
        return;
    }
    else if (meta->flags & CURLWS_PING) {

        curl_ws_send(instance->m_curl, buffer, rlen, nullptr, 0, CURLWS_PONG);
        return;
    }
    const uint8_t* dataPtr = reinterpret_cast<const uint8_t*>(buffer);
    instance->m_payload.insert(
                           instance->m_payload.end(),
                           dataPtr,
                           dataPtr + rlen
                       );
    if (meta->bytesleft == 0) {
        if (instance->m_onmessage) {
            instance->m_onmessage(
                instance->m_payload.data(),
                instance->m_payload.size()
            );
        }
        instance->m_payload.clear();
    }
}

void BaoCurlWebSocket::open(std::string url) {
    curl_easy_setopt(m_curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(m_curl, CURLOPT_CONNECT_ONLY, 2L);
    curl_easy_setopt(m_curl, CURLOPT_FORBID_REUSE, 0L);

    CURLcode res = curl_easy_perform(m_curl);
    if (res) {
        m_onerror(curl_easy_strerror(res));
        close(false);
        return;
    }

    curl_socket_t sockfd;
    curl_easy_getinfo(m_curl, CURLINFO_ACTIVESOCKET, &sockfd);

    if (sockfd == -1) {
        m_onerror("Failed to get active socket");
        close(false);
        return;
    }

    uv_poll_init_socket(uv_default_loop(), &m_poll, sockfd);
    m_poll.data = this;

    uv_poll_start(&m_poll, UV_READABLE, &BaoCurlWebSocket::pollCallback);
    uv_timer_init(uv_default_loop(), &m_pingTimer);
    m_pingTimer.data = this;
    uv_timer_start(&m_pingTimer, [](uv_timer_t* handle) {
        auto self = static_cast<BaoCurlWebSocket*>(handle->data);
        if (self->m_isOpen) {
            size_t sent;
            curl_ws_send(self->m_curl, "", 0, &sent, 0, CURLWS_PING);
        }
    }, 30000, 30000);
    m_isOpen = true;
    m_onopen();
}

void BaoCurlWebSocket::send(uint8_t* data, size_t size) {
    if (!m_isOpen) return;

    size_t sent;
    CURLcode res = curl_ws_send(m_curl, data, size, &sent, 0, CURLWS_BINARY);

    if (res != CURLE_OK) {
        m_onerror(curl_easy_strerror(res));
        close(false);
    }
}

void BaoCurlWebSocket::send(std::string& text) {
    if (!m_isOpen) return;

    size_t sent;
    CURLcode res = curl_ws_send(m_curl, text.c_str(), text.size(), &sent, 0, CURLWS_TEXT);

    if (res != CURLE_OK) {
        m_onerror(curl_easy_strerror(res));
        close(false);
    }
}

void BaoCurlWebSocket::close(bool forward) {
    if (!m_isOpen) return;

    m_isOpen = false;

    uv_poll_stop(&m_poll);
    uv_close(reinterpret_cast<uv_handle_t*>(&m_poll), nullptr);

    if (forward) {
        size_t sent;
        curl_ws_send(m_curl, "", 0, &sent, 0, CURLWS_CLOSE);
    }

    m_onclose();
}

NAMESPACE_BAO_END