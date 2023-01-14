#include "curlAysncWorker.h"

curlAsyncWorker::curlAsyncWorker(Napi::Function &callback, BaoCurl &baoCurlInstance, Napi::Uint8Array body)
    : Napi::AsyncWorker(callback), m_baoCurlInstance(baoCurlInstance), m_sendBody(body) {}

curlAsyncWorker::~curlAsyncWorker() {}

// Executed inside the worker-thread.
// It is not safe to access JS engine data structure
// here, so everything we need for input and output
// should go on `this`.
void curlAsyncWorker::Execute()
{
    this->m_baoCurlInstance.sendByte((const char *)this->m_sendBody.Data(), this->m_sendBody.ByteLength());
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

