#include "async_worker_websocket.h"

void WebSocketWorker::setUrl(std::string url) {
    m_url = url;
}

void WebSocketWorker::pushRef(Reference<Object>* ref) {
    m_ref.push_back(ref);
    ref->Ref();
}

void WebSocketWorker::Execute() {
    m_ws->open(m_url);
}

void WebSocketWorker::OnOK() {
    m_ws->close(true);
    for (Reference<Object>* ref: m_ref) {
        ref->Unref();
    }
    Callback().Call({});
}
