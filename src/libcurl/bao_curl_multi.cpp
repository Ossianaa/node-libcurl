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
    CHECK_CURLMOK(curl_multi_setopt(this->m_pCURLM, CURLMOPT_PIPELINING, CURLPIPE_NOTHING));
}

BaoCurlMulti::~BaoCurlMulti()
{
    if (this->m_pCURLM != nullptr)
    {
        idle.stop();
        curl_multi_cleanup(this->m_pCURLM);
        this->m_pCURLM = nullptr;
    }
}

void BaoCurlMulti::pushQueue(BaoCurl &curl)
{
    CHECK_CURLMOK(curl_multi_add_handle(this->m_pCURLM, curl.m_pCURL));
    if (!this->idleActive) {
        this->idleActive = true;
        idle.start();
    }
}

void BaoCurlMulti::asyncTask(uv_idle_t* handle) {
    BaoCurlMulti* instance = static_cast<BaoCurlMulti*>(handle->data);
    int runningNum;
    CURLMcode mc = curl_multi_perform(instance->m_pCURLM, &runningNum);
    _CHECK_CURLMOK(instance, mc);
    if (!mc && runningNum)
    {
        mc = curl_multi_poll(instance->m_pCURLM, NULL, 0, 1000, NULL);
        if (mc)
        {
            _CHECK_CURLMOK(instance, mc);
            instance->idle.start();
            return;
        }
    }
    if (mc)
    {
        _CHECK_CURLMOK(instance, mc);
        instance->idle.start();
        return;
    }
    int ret = 0;
    while (true)
    {
        CURLMsg *msg = curl_multi_info_read(instance->m_pCURLM, &ret);
        if (!(msg && msg->msg == CURLMSG_DONE))
        {
            break;
        }
        CURL *handle = msg->easy_handle;
        CURLcode result = msg->data.result;
        _CHECK_CURLMOK(instance, curl_multi_remove_handle(instance->m_pCURLM, handle));
        BaoCurl *pCurl = nullptr;
        curl_easy_getinfo(handle, CURLINFO_PRIVATE, &pCurl);
        if (pCurl)
        {
            pCurl->m_postdata.reset(); // 释放内存
            pCurl->m_lastCode = result;
            if (pCurl->m_publishCallback)
            {
                bool success = pCurl->m_lastCode == CURLE_OK;
                std::string errMsg = success ? "" : pCurl->getLastCurlCodeError();
                auto callbackPtr = pCurl->m_publishCallback;
                callbackPtr(success, errMsg);
            }
        }
        else
        {
            std::cout << "ptr is null" << std::endl;
        }
         break;
    };

    if (runningNum == 0) {
        instance->idleActive = false;
        instance->idle.stop();
    } else {
        instance->idle.start();
    }
}

NAMESPACE_BAO_END