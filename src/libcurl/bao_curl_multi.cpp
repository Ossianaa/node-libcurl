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

BaoCurlMulti::BaoCurlMulti(): idle(this, &BaoCurlMulti::asyncTask)
{
    this->m_pCURLM = curl_multi_init();
    uv_timer_init(uv_default_loop(), &m_timeoutTimer);
    m_timeoutTimer.data = this;
    curl_multi_setopt(m_pCURLM, CURLMOPT_TIMERFUNCTION, &BaoCurlMulti::timerCallback);
    curl_multi_setopt(m_pCURLM, CURLMOPT_TIMERDATA, this);
}

BaoCurlMulti::~BaoCurlMulti()
{
    if (this->m_pCURLM != nullptr)
    {
        m_timeoutTimer.data = nullptr;
        uv_timer_stop(&m_timeoutTimer);
        idle.stop();
        curl_multi_cleanup(this->m_pCURLM);
        uv_close(reinterpret_cast<uv_handle_t*>(&m_timeoutTimer), nullptr);
        this->m_pCURLM = nullptr;
    }
}

int BaoCurlMulti::timerCallback(CURLM* multi, long timeout_ms, void* userp) {
    BaoCurlMulti* self = static_cast<BaoCurlMulti*>(userp);

    if (timeout_ms < 0) {
        uv_timer_stop(&self->m_timeoutTimer);
    } else {
        uv_timer_start(&self->m_timeoutTimer, onTimeout,
                       (timeout_ms == 0 ? 1 : timeout_ms), 0);
    }
    return 0;
}

void BaoCurlMulti::onTimeout(uv_timer_t* handle) {
    BaoCurlMulti* self = static_cast<BaoCurlMulti*>(handle->data);
    int running_handles = 0;

    curl_multi_socket_action(self->m_pCURLM,
                             CURL_SOCKET_TIMEOUT,
                             0,
                             &running_handles);

    self->processFinishedHandles();

    if (running_handles == 0) {
        self->idle.stop();
    }
}

void BaoCurlMulti::pushQueue(BaoCurl &curl)
{
    CHECK_CURLMOK(curl_multi_add_handle(this->m_pCURLM, curl.m_pCURL));
    if (!idle.isActive()) {
        idle.start();
    }
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

void BaoCurlMulti::asyncTask(uv_idle_t* handle) {
    BaoCurlMulti* self = static_cast<BaoCurlMulti*>(handle->data);
    int runningNum = 0;

    CURLMcode mc = curl_multi_perform(self->m_pCURLM, &runningNum);
    _CHECK_CURLMOK(self, mc);

    self->processFinishedHandles();

    if (runningNum > 0) {
        mc = curl_multi_poll(self->m_pCURLM, nullptr, 0, 0, nullptr);
        if (mc) {
            _CHECK_CURLMOK(self, mc);
        }
        self->idle.start();
    } else {
        self->idle.stop();
    }
}

NAMESPACE_BAO_END