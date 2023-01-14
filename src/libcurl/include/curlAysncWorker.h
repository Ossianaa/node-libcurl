#include <napi.h>
#include "bao_curl.h"

class curlAsyncWorker : public Napi::AsyncWorker
{
public:
     curlAsyncWorker(Napi::Function &callback, BaoCurl& baoCurlInstance, Napi::Uint8Array m_sendBody);
    ~curlAsyncWorker();
    void Execute();
    void OnOK();
private:
    BaoCurl& m_baoCurlInstance;
    Napi::Uint8Array m_sendBody;
};