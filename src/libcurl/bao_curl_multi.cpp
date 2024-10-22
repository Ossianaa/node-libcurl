#include "bao_curl.h"

#define CHECK_CURLMOK(e)                                           \
    {                                                              \
        CURLMcode code = (e);                                      \
        this->m_lastCode = code;                                   \
        if (code != CURLM_OK)                                      \
        {                                                          \
            printf("CURLM Error:%s\n", curl_multi_strerror(code)); \
        }                                                          \
    }
NAMESPACE_BAO_START

BaoCurlMulti::BaoCurlMulti()
{
    this->m_pCURLM = curl_multi_init();
    CHECK_CURLMOK(curl_multi_setopt(this->m_pCURLM, CURLMOPT_PIPELINING, CURLPIPE_NOTHING));
    this->m_bRunning = true;
}

BaoCurlMulti::~BaoCurlMulti()
{
    this->m_lock.lock();
    this->m_bRunning = false;
    this->m_lock.unlock();
    if (this->m_pCURLM != nullptr)
    {
        this->m_thread.join(); // 等待执行完在销毁
        curl_multi_cleanup(this->m_pCURLM);
        this->m_pCURLM = nullptr;
    }
}

void BaoCurlMulti::pushQueue(BaoCurl &curl)
{
    this->m_lock.lock();
    CHECK_CURLMOK(curl_multi_add_handle(this->m_pCURLM, curl.m_pCURL));
    this->m_lock.unlock();
}

void BaoCurlMulti::startThread()
{
    auto callback = [&]()
    {
        while (true)
        {
            this->m_lock.lock();
            bool isRunning = this->m_bRunning;
            this->m_lock.unlock();
            if (!isRunning)
            {
                break;
            }

            int running;
            do
            {
                this->m_lock.lock();
                CURLMcode mc = curl_multi_perform(this->m_pCURLM, &running);
                this->m_lock.unlock();
                CHECK_CURLMOK(mc);
                if (running)
                {
                    mc = curl_multi_poll(this->m_pCURLM, NULL, 0, 1000, NULL);
                    if (mc)
                    {

                        CHECK_CURLMOK(mc);
                        break;
                    }
                }
                int ret = 0;
                while (true)
                {
                    this->m_lock.lock();
                    CURLMsg *msg = curl_multi_info_read(this->m_pCURLM, &ret);
                    this->m_lock.unlock();

                    if (!(msg && msg->msg == CURLMSG_DONE))
                    {
                        break;
                    }
                    CURL *handle = msg->easy_handle;
                    CURLcode result = msg->data.result;
                    this->m_lock.lock();
                    CHECK_CURLMOK(curl_multi_remove_handle(this->m_pCURLM, handle));
                    BaoCurl *pCurl = nullptr;
                    curl_easy_getinfo(handle, CURLINFO_PRIVATE, &pCurl);
                    this->m_lock.unlock();

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
                        std::cout << "ptr is nullptr" << std::endl;
                    }
                };
            } while (running);
            std::this_thread::sleep_for(std::chrono::milliseconds(1));
        }
    };
    this->m_thread = std::thread(callback);
}

NAMESPACE_BAO_END