#include "curlAysncWorker.h"

curlAsyncWorker::curlAsyncWorker(Napi::Function &callback, BaoCurl &baoCurlInstance, const char *body, size_t bodySize)
    : Napi::AsyncWorker(callback), m_baoCurlInstance(baoCurlInstance)
{
    this->m_sendBody = (char *)malloc(bodySize);
    this->m_bodySize = bodySize;
    memcpy_s(this->m_sendBody, bodySize, body, bodySize);
}

curlAsyncWorker::~curlAsyncWorker()
{
    free(m_sendBody);
}

// Executed inside the worker-thread.
// It is not safe to access JS engine data structure
// here, so everything we need for input and output
// should go on `this`.
void curlAsyncWorker::Execute()
{
    this->m_baoCurlInstance.sendByte(this->m_sendBody, this->m_bodySize);
}

// Executed when the async work is complete
// this function will be run inside the main event loop
// so it is safe to use JS engine data again
void curlAsyncWorker::OnOK()
{
    Napi::HandleScope scope(Env());
    /* std::string str = this->m_baoCurlInstance.getResponseBody();
    size_t strLen = str.size();
    Napi::Uint8Array u8buffer = Napi::Uint8Array::New(Env(), strLen);
    memcpy_s(u8buffer.Data(), strLen, str.c_str(), strLen); */
    Callback().Call({
        /* u8buffer */
    });
}
