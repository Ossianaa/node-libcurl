#pragma once
#include <napi.h>
#include "bao_curl_websocket.h"

using namespace Napi;
using namespace bao;

class WebSocketWorker : public AsyncWorker  {
public:
    WebSocketWorker(Function& okCallback, BaoCurlWebSocket* ws)
        : AsyncWorker(okCallback), m_ws(ws) {
    }

    ~WebSocketWorker() {}
    void pushRef(Reference<Object>* ref);
    void setUrl(std::string url);

    void Execute() override;
    void OnOK() override;

private:
    std::vector<Reference<Object>*> m_ref;
    BaoCurlWebSocket* m_ws = nullptr;
    std::string m_url;
};