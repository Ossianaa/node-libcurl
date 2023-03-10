#include <napi.h>
#include "bao_curl.h"

class curlAsyncWorker : public Napi::AsyncWorker
{
public:
    curlAsyncWorker(const Napi::Function &callback, BaoCurl &baoCurlInstance, const char *sendBody, size_t bodySize);
    ~curlAsyncWorker();
    void Execute();
    void OnOK();

private:
    BaoCurl &m_baoCurlInstance;
    char* m_sendBody = nullptr;
    size_t m_bodySize;
    unsigned int m_lastCurlCode = 0;
    const char* m_lastCurlCodeError = "";
};