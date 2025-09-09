#include "bao_curl.h"

#define _CHECK_CURLMOK(instance, e)                                           \
    {                                                              \
        CURLMcode code = (e);                                      \
        instance->m_lastCode = code;                                   \
        if (code != CURLM_OK)                                      \
        {                                                          \
            printf("CURLM Error(%d): %s\n", __LINE__, curl_multi_strerror(code)); \
        }                                                          \
    }

#define CHECK_CURLMOK(e) _CHECK_CURLMOK(this, e)
NAMESPACE_BAO_START

BaoCurlMulti::BaoCurlMulti()
{
    this->m_pCURLM = curl_multi_init();
    uv_timer_init(uv_default_loop(), &m_timeoutTimer);
    m_timeoutTimer.data = this;
    curl_multi_setopt(m_pCURLM, CURLMOPT_TIMERFUNCTION, &BaoCurlMulti::timerCallback);
    curl_multi_setopt(m_pCURLM, CURLMOPT_TIMERDATA, this);
    curl_multi_setopt(m_pCURLM, CURLMOPT_SOCKETFUNCTION, &BaoCurlMulti::socketFunction);
    curl_multi_setopt(m_pCURLM, CURLMOPT_SOCKETDATA, this);
}

BaoCurlMulti::~BaoCurlMulti()
{
    if (this->m_pCURLM != nullptr)
    {
        m_timeoutTimer.data = nullptr;
        uv_timer_stop(&m_timeoutTimer);
        curl_multi_cleanup(this->m_pCURLM);
        uv_handle_t* timeoutHandle = reinterpret_cast<uv_handle_t*>(&m_timeoutTimer);
        if (uv_is_active(timeoutHandle))
            uv_close(timeoutHandle, nullptr);
        this->m_pCURLM = nullptr;
    }
    for (auto& it : m_socketMap) {
        curl_socket_t sock = it.first;
        uv_poll_t* poller = it.second;
        PollContext* ctx = static_cast<PollContext*>(poller->data);
        delete ctx;
        uv_poll_stop(poller);
        uv_close((uv_handle_t*)poller, [](uv_handle_t* h) {
            delete (uv_poll_t*)h;
        });
    }
}

void BaoCurlMulti::socketCallback(uv_poll_t* handle, int status, int events) {
    PollContext* ctx = static_cast<PollContext*>(handle->data);
    BaoCurlMulti* self = ctx->multi;
    curl_socket_t sockfd = ctx->sockfd;
    int action = 0;
    if (events & UV_READABLE) action |= CURL_CSELECT_IN;
    if (events & UV_WRITABLE) action |= CURL_CSELECT_OUT;

    int running;
    curl_multi_socket_action(self->m_pCURLM, sockfd, action, &running);
    self->processFinishedHandles();
}

int BaoCurlMulti::socketFunction(CURL* easy, curl_socket_t s, int action, void* userp, void* socketp) {
    if (s == CURL_SOCKET_BAD || s == 0) return 0;
    BaoCurlMulti* self = static_cast<BaoCurlMulti*>(userp);
    if (action == CURL_POLL_REMOVE) {
        if (auto it = self->m_socketMap.find(s); it != self->m_socketMap.end()) {
            uv_poll_t* poller = it->second;
            PollContext* ctx = static_cast<PollContext*>(poller->data);
            delete ctx;

            uv_poll_stop(poller);
            uv_close((uv_handle_t*)poller, [](uv_handle_t* h) {
                delete reinterpret_cast<uv_poll_t*>(h);
            });
            self->m_socketMap.erase(it);
        }
    }

    if (action == CURL_POLL_IN || action == CURL_POLL_OUT || action == CURL_POLL_INOUT) {
        if (!self->m_socketMap.count(s)) {
            uv_poll_t* poller = new uv_poll_t();
            PollContext* ctx = new PollContext{self, s};
            poller->data = ctx;
            uv_poll_init_socket(uv_default_loop(), poller, s);
            self->m_socketMap[s] = poller;
        }

        int events = 0;
        if (action & CURL_POLL_IN) events |= UV_READABLE;
        if (action & CURL_POLL_OUT) events |= UV_WRITABLE;

        uv_poll_start(self->m_socketMap[s], events, &BaoCurlMulti::socketCallback);
    }
    return 0;
}

int BaoCurlMulti::timerCallback(CURLM* multi, long timeout_ms, void* userp) {
    BaoCurlMulti* self = static_cast<BaoCurlMulti*>(userp);

    if (timeout_ms < 0) {
        uv_timer_stop(&self->m_timeoutTimer);
    } else {
        uv_timer_start(&self->m_timeoutTimer, [](uv_timer_t* handle) {
            auto self = static_cast<BaoCurlMulti*>(handle->data);
            int running_handles = 0;
            curl_multi_socket_action(self->m_pCURLM,CURL_SOCKET_TIMEOUT,0,&running_handles);
            self->processFinishedHandles();
        },
        (timeout_ms == 0 ? 1 : timeout_ms), 0);
    }
    return 0;
}

void BaoCurlMulti::pushQueue(BaoCurl &curl)
{
    CHECK_CURLMOK(curl_multi_add_handle(this->m_pCURLM, curl.m_pCURL));
}

void BaoCurlMulti::processFinishedHandles() {
    if (!m_pCURLM) return;
    int msgq = 0;
    CURLMsg* msg = nullptr;

    while ((msg = curl_multi_info_read(m_pCURLM, &msgq))) {
        if (msg->msg == CURLMSG_DONE) {
            CURL* easy_handle = msg->easy_handle;
            CURLcode result = msg->data.result;

            CHECK_CURLMOK(curl_multi_remove_handle(m_pCURLM, easy_handle));

            BaoCurl* curl = nullptr;
            curl_easy_getinfo(easy_handle, CURLINFO_PRIVATE, &curl);

            if (curl) {
                curl->m_postdata.reset();
                curl->m_lastCode = result;

                if (curl->m_publishCallback) {
                    bool success = (result == CURLE_OK);
                    std::string err = success ? "" : curl_easy_strerror(result);
                    curl->m_publishCallback(success, err);
                }
            }
        }
    }
}

NAMESPACE_BAO_END