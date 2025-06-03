#include <napi.h>
#include <iostream>
#include "bao_curl.h"
#include "bao_curl_websocket.h"
#include "request_tls_utils.h"
#include "wtf/HashSet.h"
using namespace std;
using namespace bao;

class BaoLibCurlWarp : public Napi::ObjectWrap<BaoLibCurlWarp>
{
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    BaoLibCurlWarp(const Napi::CallbackInfo &info);
    ~BaoLibCurlWarp();
    // static Napi::Value CreateNewItem(const Napi::CallbackInfo& info);
    BaoCurl m_curl;

private:
    Napi::Value open(const Napi::CallbackInfo &info);
    Napi::Value setRequestHeader(const Napi::CallbackInfo &info);
    Napi::Value setRequestHeaders(const Napi::CallbackInfo &info);
    Napi::Value setProxy(const Napi::CallbackInfo &info);
    Napi::Value setTimeout(const Napi::CallbackInfo &info);
    Napi::Value setCookie(const Napi::CallbackInfo &info);
    Napi::Value deleteCookie(const Napi::CallbackInfo &info);
    Napi::Value getCookies(const Napi::CallbackInfo &info);
    Napi::Value getCookie(const Napi::CallbackInfo &info);
    Napi::Value getResponseStatus(const Napi::CallbackInfo &info);
    Napi::Value setSSLVerify(const Napi::CallbackInfo &info);
    Napi::Value setRedirect(const Napi::CallbackInfo &info);
    Napi::Value setVerbose(const Napi::CallbackInfo &info);
    Napi::Value setHttpVersion(const Napi::CallbackInfo &info);
    Napi::Value setInterface(const Napi::CallbackInfo &info);
    Napi::Value setJA3Fingerprint(const Napi::CallbackInfo &info);
    Napi::Value setAkamaiFingerprint(const Napi::CallbackInfo &info);
    Napi::Value setHttp2NextStreamId(const Napi::CallbackInfo &info);
    Napi::Value setHttp2StreamWeight(const Napi::CallbackInfo &info);
    Napi::Value setSSLCert(const Napi::CallbackInfo &info);
    Napi::Value sendAsync(const Napi::CallbackInfo &info);
    Napi::Value getResponseBody(const Napi::CallbackInfo &info);
    Napi::Value getResponseString(const Napi::CallbackInfo &info);
    Napi::Value getResponseHeaders(const Napi::CallbackInfo &info);
    Napi::Value getResponseContentLength(const Napi::CallbackInfo &info);
    Napi::Value getLastCode(const Napi::CallbackInfo &info);
    Napi::Value getLastCodeError(const Napi::CallbackInfo &info);

    static Napi::Value globalInit(const Napi::CallbackInfo &info);
    static Napi::Value globalCleanup(const Napi::CallbackInfo &info);
};

class BaoLibCurlWebSocketWarp : public Napi::ObjectWrap<BaoLibCurlWebSocketWarp>
{
public:
    static Napi::Function Init(Napi::Env env);
    BaoLibCurlWebSocketWarp(const Napi::CallbackInfo &info);
    ~BaoLibCurlWebSocketWarp();

private:
    BaoCurlWebSocket *m_ws = nullptr;
    Napi::Reference<Napi::Object>* m_ref = nullptr;
    // WebSocketWorker *m_worker = nullptr;
    Napi::Value open(const Napi::CallbackInfo &info);
    Napi::Value close(const Napi::CallbackInfo &info);
    Napi::Value send(const Napi::CallbackInfo &info);
    Napi::Value setOnOpen(const Napi::CallbackInfo &info);
    Napi::Value setOnClose(const Napi::CallbackInfo &info);
    Napi::Value setOnError(const Napi::CallbackInfo &info);
    Napi::Value setOnMessage(const Napi::CallbackInfo &info);

    Napi::ThreadSafeFunction _onopen;
    Napi::ThreadSafeFunction _onclose;
    Napi::ThreadSafeFunction _onerror;
    Napi::ThreadSafeFunction _onmessage;
};

BaoCurlMulti *g_curlMulti = nullptr;

void initLibCurl()
{
    curl_global_init(CURL_GLOBAL_ALL);
    g_curlMulti = new BaoCurlMulti();
}

void uninitLibCurl()
{
    delete g_curlMulti;
    curl_global_cleanup();
}

Napi::Function BaoLibCurlWebSocketWarp::Init(Napi::Env env)
{
    std::vector<Napi::ClassPropertyDescriptor<BaoLibCurlWebSocketWarp>> wsMethodList = {
        InstanceMethod<&BaoLibCurlWebSocketWarp::open>("open", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWebSocketWarp::close>("close", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWebSocketWarp::send>("send", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWebSocketWarp::setOnOpen>("setOnOpen", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWebSocketWarp::setOnClose>("setOnClose", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWebSocketWarp::setOnError>("setOnError", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWebSocketWarp::setOnMessage>("setOnMessage", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    };
    Napi::Function ws = DefineClass(env, "WebSocket", wsMethodList);
    auto constructor = Napi::Persistent(ws);
    constructor.SuppressDestruct();
    return ws;
}

BaoLibCurlWebSocketWarp::BaoLibCurlWebSocketWarp(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<BaoLibCurlWebSocketWarp>(info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK_NO_RETURN(env, "BaoCurl.WebSocket", "constructor", 1, argsLen)
    REQUEST_TLS_METHOD_CHECK_NO_RETURN(env, info[0].IsObject(), "argument 0 is not a object")
    auto arg0 = info[0].As<Napi::Object>();
    BaoLibCurlWarp *BaoLibCurl = BaoLibCurlWarp::Unwrap(arg0);
    this->m_ref = BaoLibCurl;
    this->m_ws = new BaoCurlWebSocket(BaoLibCurl->m_curl.m_pCURL);
    this->Ref();
    this->m_ref->Ref();
}

BaoLibCurlWebSocketWarp::~BaoLibCurlWebSocketWarp()
{
    delete this->m_ws;
}

Napi::Value BaoLibCurlWebSocketWarp::open(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl.WebSocket", "open", 1, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
    std::string url = info[0].As<Napi::String>().Utf8Value();
    this->m_ws->open(url);
    return env.Undefined();
}

Napi::Value BaoLibCurlWebSocketWarp::close(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    this->m_ws->close(true);
    return env.Undefined();
}

Napi::Value BaoLibCurlWebSocketWarp::send(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl.WebSocket", "send", 1, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsTypedArray() || info[0].IsString(), "argument 0 is not a typedArray or String")
    if (info[0].Type() == napi_string)
    {
        std::string str = info[0].As<Napi::String>().Utf8Value();
        this->m_ws->send(str);
    } else {
        Napi::Uint8Array u8Arr = info[0].As<Napi::Uint8Array>();
        this->m_ws->send(u8Arr.Data(), u8Arr.ByteLength());
    }
    return env.Undefined();
}

Napi::Value BaoLibCurlWebSocketWarp::setOnOpen(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl.WebSocket", "setOnOpen", 1, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsFunction(), "argument 0 is not a function")
    _onopen = Napi::ThreadSafeFunction::New(
                  env,
                  info[0].As<Napi::Function>(),
    "Test", 0, 1, [](Napi::Env env) {});
    this->m_ws->setOnOpen([this]()
    {   _onopen.NonBlockingCall(
                   [](Napi::Env env, Napi::Function jsCallback)
        {
            jsCallback.Call({});
        });
    });
    return env.Undefined();
}
Napi::Value BaoLibCurlWebSocketWarp::setOnClose(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl.WebSocket", "setOnClose", 1, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsFunction(), "argument 0 is not a function")
    _onclose = Napi::ThreadSafeFunction::New(
                   env,
                   info[0].As<Napi::Function>(),
    "Test", 0, 1, [](Napi::Env env) {});
    this->m_ws->setOnClose([this]()
    {
        _onclose.BlockingCall(
                    [this](Napi::Env env, Napi::Function jsCallback)
        {
            jsCallback.Call({});
            this->_onopen.Unref(env);
            this->_onclose.Unref(env);
            this->_onerror.Unref(env);
            this->_onmessage.Unref(env);
        });
        this->_onopen.Release();
        this->_onclose.Release();
        this->_onerror.Release();
        this->_onmessage.Release();
        this->m_ref->Unref();
        this->Unref();
    });
    return env.Undefined();
}
Napi::Value BaoLibCurlWebSocketWarp::setOnError(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl.WebSocket", "setOnError", 1, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsFunction(), "argument 0 is not a function")
    _onerror = Napi::ThreadSafeFunction::New(
                   env,
                   info[0].As<Napi::Function>(),
    "Test", 0, 1, [](Napi::Env env) {});
    this->m_ws->setOnError([this](const std::string &err)
    {   _onerror.NonBlockingCall([err](Napi::Env env, Napi::Function jsCallback)
        {
            jsCallback.Call({Napi::String::New(env, err.c_str())});
        });
    });
    return env.Undefined();
}
Napi::Value BaoLibCurlWebSocketWarp::setOnMessage(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl.WebSocket", "setOnMessage", 1, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsFunction(), "argument 0 is not a function")

    _onmessage = Napi::ThreadSafeFunction::New(
                     env,
                     info[0].As<Napi::Function>(),
                     "Test", 0, 1);
    this->m_ws->setOnMessage([this](uint8_t *data, size_t size)
    {
        std::vector<uint8_t>* _data = new std::vector<uint8_t>(data, data + size);
        _onmessage.NonBlockingCall(
                      _data,
                      [size](Napi::Env env, Napi::Function jsCallback, std::vector<uint8_t>* _data)
        {
            auto buf = Napi::Uint8Array::New(env, _data->size());
            if (size) {
                memcpy((void *)buf.Data(), _data->data(), _data->size());
            }
            jsCallback.Call({buf});
            delete _data;
        });
    });
    return env.Undefined();
}

Napi::Object BaoLibCurlWarp::Init(Napi::Env env, Napi::Object exports)
{

    std::vector<Napi::ClassPropertyDescriptor<BaoLibCurlWarp>> methodList = {
        InstanceMethod<&BaoLibCurlWarp::open>("open", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setRequestHeader>("setRequestHeader", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setRequestHeaders>("setRequestHeaders", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setProxy>("setProxy", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setTimeout>("setTimeout", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setCookie>("setCookie", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::deleteCookie>("deleteCookie", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::getCookies>("getCookies", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::getCookie>("getCookie", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::getResponseStatus>("getResponseStatus", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setRedirect>("setRedirect", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setSSLVerify>("setSSLVerify", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setVerbose>("setVerbose", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setHttpVersion>("setHttpVersion", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::getResponseBody>("getResponseBody", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::getResponseString>("getResponseString", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::sendAsync>("sendAsync", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::getResponseHeaders>("getResponseHeaders", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::getResponseContentLength>("getResponseContentLength", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::getLastCode>("getLastCode", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::getLastCodeError>("getLastCodeError", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setInterface>("setInterface", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setJA3Fingerprint>("setJA3Fingerprint", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setAkamaiFingerprint>("setAkamaiFingerprint", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setHttp2NextStreamId>("setHttp2NextStreamId", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setHttp2StreamWeight>("setHttp2StreamWeight", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&BaoLibCurlWarp::setSSLCert>("setSSLCert", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        StaticMethod<&BaoLibCurlWarp::globalInit>("globalInit", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        StaticMethod<&BaoLibCurlWarp::globalCleanup>("globalCleanup", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        StaticValue("WebSocket", BaoLibCurlWebSocketWarp::Init(env)),
    };
    Napi::Function func = DefineClass(env, "BaoLibCurl", methodList);
    auto constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    exports.Set("BaoLibCurl", func);
    return exports;
}

BaoLibCurlWarp::BaoLibCurlWarp(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<BaoLibCurlWarp>(info)
{
}

BaoLibCurlWarp::~BaoLibCurlWarp()
{
}

/*
    open(method, url)
*/
Napi::Value BaoLibCurlWarp::open(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "open", 2, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
    REQUEST_TLS_METHOD_CHECK(env, info[1].IsString(), "argument 1 is not a string")
    string method = info[0].As<Napi::String>().Utf8Value();
    string url = info[1].As<Napi::String>().Utf8Value();
    this->m_curl.open(method, url);
    return env.Undefined();
}

/*
    setRequestHeader(key,value)
*/
Napi::Value BaoLibCurlWarp::setRequestHeader(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setRequestHeader", 2, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
    REQUEST_TLS_METHOD_CHECK(env, info[1].IsString(), "argument 1 is not a string")

    string key = info[0].As<Napi::String>().Utf8Value();
    string value = info[1].As<Napi::String>().Utf8Value();
    if (value == "")
    {
        REQUEST_TLS_METHOD_CHECK(env, key != "", "key and value are empty")
        // if the value is empty then only set key;
        key += ";";
        this->m_curl.setRequestHeaders(key);
        return env.Undefined();
    }
    this->m_curl.setRequestHeader(key, value);
    return env.Undefined();
}

/*
    setRequestHeaders(headers)
*/
Napi::Value BaoLibCurlWarp::setRequestHeaders(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setRequestHeaders", 1, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
    string headers = info[0].As<Napi::String>().Utf8Value();
    this->m_curl.setRequestHeaders(headers);
    return env.Undefined();
}

/*
    setProxy(proxy)
    setProxy(proxy,username,password)
*/
Napi::Value BaoLibCurlWarp::setProxy(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_TOO_MUCH_CHECK(env, "BaoCurl", "setProxy", 3, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
    string proxy = info[0].As<Napi::String>().Utf8Value();
    if (argsLen == 1)
    {
        this->m_curl.setProxy(proxy);
        return env.Undefined();
    }
    else if (argsLen == 3)
    {
        REQUEST_TLS_METHOD_CHECK(env, info[1].IsString(), "argument 1 is not a string")
        REQUEST_TLS_METHOD_CHECK(env, info[2].IsString(), "argument 2 is not a string")
        // if take the username and password
        string username = info[1].As<Napi::String>().Utf8Value();
        string password = info[2].As<Napi::String>().Utf8Value();
        this->m_curl.setProxy(proxy, username, password);
        return env.Undefined();
    }
    REQUEST_TLS_METHOD_ARGS_NO_CONFIG(env, "BaoCurl", "setProxy", "1 or 2", argsLen)
}

/*
    setTimeout(connectTime, sendTime)
*/
Napi::Value BaoLibCurlWarp::setTimeout(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setTimeout", 2, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsNumber(), "argument 0 is not a number")
    REQUEST_TLS_METHOD_CHECK(env, info[1].IsNumber(), "argument 1 is not a number")
    int32_t connectTime = info[0].As<Napi::Number>().Int32Value();
    int32_t sendTime = info[1].As<Napi::Number>().Int32Value();
    this->m_curl.setTimeout(connectTime, sendTime);
    return env.Undefined();
}

/*
    setCookie(key, value, domain)
*/
Napi::Value BaoLibCurlWarp::setCookie(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setCookie", 4, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
    REQUEST_TLS_METHOD_CHECK(env, info[1].IsString(), "argument 1 is not a string")
    REQUEST_TLS_METHOD_CHECK(env, info[2].IsString(), "argument 2 is not a string")
    REQUEST_TLS_METHOD_CHECK(env, info[3].IsString(), "argument 3 is not a string")
    string key = info[0].As<Napi::String>().Utf8Value();
    string value = info[1].As<Napi::String>().Utf8Value();
    string domain = info[2].As<Napi::String>().Utf8Value();
    string path = info[3].As<Napi::String>().Utf8Value();
    this->m_curl.setCookie(key, value, domain, path);
    return env.Undefined();
}

/*
    deleteCookie(key, domain)
*/
Napi::Value BaoLibCurlWarp::deleteCookie(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "deleteCookie", 3, argsLen)
    string key = info[0].As<Napi::String>().Utf8Value();
    string domain = info[1].As<Napi::String>().Utf8Value();
    string path = info[2].As<Napi::String>().Utf8Value();
    this->m_curl.deleteCookie(key, domain, path);
    return env.Undefined();
}

/*
    getCookies()
*/
Napi::Value BaoLibCurlWarp::getCookies(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    // size_t argsLen = info.Length();

    return Napi::String::New(env, this->m_curl.getCookies());
}

/*
    getCookie(key)
*/
Napi::Value BaoLibCurlWarp::getCookie(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "getCookie", 3, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
    REQUEST_TLS_METHOD_CHECK(env, info[1].IsString(), "argument 1 is not a string")
    REQUEST_TLS_METHOD_CHECK(env, info[2].IsString(), "argument 2 is not a string")
    std::string key = info[0].As<Napi::String>().Utf8Value();
    std::string domain = info[1].As<Napi::String>().Utf8Value();
    std::string path = info[2].As<Napi::String>().Utf8Value();
    return Napi::String::New(env, this->m_curl.getCookie(key, domain, path));
}

/*
    getResponseStatus()
*/
Napi::Value BaoLibCurlWarp::getResponseStatus(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    // size_t argsLen = info.Length();

    return Napi::Number::New(env, this->m_curl.getResponseStatus());
}

/*
    getResponseContentLength()
*/
Napi::Value BaoLibCurlWarp::getResponseContentLength(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    return Napi::Number::New(env, this->m_curl.getResponseContentLength());
}
/*
    getLastCode()
*/
Napi::Value BaoLibCurlWarp::getLastCode(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    return Napi::Number::New(env, this->m_curl.getLastCurlCode());
}
/*
    getLastCodeError()
*/
Napi::Value BaoLibCurlWarp::getLastCodeError(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    return Napi::String::New(env, this->m_curl.getLastCurlCodeError());
}

/*
    setSSLVerify(string)
*/
Napi::Value BaoLibCurlWarp::setSSLVerify(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setSSLVerify", 1, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
    std::string caPath = info[0].As<Napi::String>().Utf8Value();
    this->m_curl.setSSLVerify(caPath);
    return env.Undefined();
}

/*
    setRedirect(bool)
*/
Napi::Value BaoLibCurlWarp::setRedirect(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setRedirect", 1, argsLen)
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsBoolean(), "argument 0 is not a boolean")
    this->m_curl.setRedirect(
                    info[0].As<Napi::Boolean>().Value());
    return env.Undefined();
}

/*
    setVerbose()
*/
Napi::Value BaoLibCurlWarp::setVerbose(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setVerbose", 1, argsLen)
    this->m_curl.setVerbose(info[0].As<Napi::Boolean>().Value());
    return env.Undefined();
}

/*
    setHttpVersion(double)
*/
Napi::Value BaoLibCurlWarp::setHttpVersion(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setHttpVersion", 1, argsLen);
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsNumber(), "argument 0 is not a number")
    int32_t ver = info[0].As<Napi::Number>().Int32Value();
    if (ver == 0)
    {
        this->m_curl.setHttpVersion(BaoCurl::HttpVersion::http1_1);
    }
    else if (ver == 1)
    {
        this->m_curl.setHttpVersion(BaoCurl::HttpVersion::http2);
    }
    else if (ver == 2)
    {
        this->m_curl.setHttpVersion(BaoCurl::HttpVersion::http3);
    }
    else if (ver == 3)
    {
        this->m_curl.setHttpVersion(BaoCurl::HttpVersion::http3_only);
    }
    else
    {
        REQUEST_TLS_METHOD_THROW(env, "BaoCurl", "setHttpVersion", "Version Not Support.")
    }

    return env.Undefined();
}

/*
    setInterface(string)
*/
Napi::Value BaoLibCurlWarp::setInterface(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setInterface", 1, argsLen);
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
    std::string network = info[0].As<Napi::String>().Utf8Value();
    this->m_curl.setInterface(network);

    return env.Undefined();
}

/*
    setJA3Fingerprint(number,string,string,string,number)
*/
Napi::Value BaoLibCurlWarp::setJA3Fingerprint(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setJA3Fingerprint", 6, argsLen);
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsNumber(), "argument 0 is not a number")
    int tlsVersion = info[0].As<Napi::Number>().Int32Value();
    REQUEST_TLS_METHOD_CHECK(env, info[1].IsString(), "argument 1 is not a string")
    std::string ciphers = info[1].As<Napi::String>().Utf8Value();
    REQUEST_TLS_METHOD_CHECK(env, info[2].IsString(), "argument 2 is not a string")
    std::string tls13_ciphers = info[2].As<Napi::String>().Utf8Value();
    REQUEST_TLS_METHOD_CHECK(env, info[3].IsString(), "argument 3 is not a string")
    std::string extensions = info[3].As<Napi::String>().Utf8Value();
    REQUEST_TLS_METHOD_CHECK(env, info[4].IsString(), "argument 4 is not a string")
    std::string supportGroups = info[4].As<Napi::String>().Utf8Value();
    REQUEST_TLS_METHOD_CHECK(env, info[5].IsNumber(), "argument 5 is not a number")
    int ecPointFormat = info[5].As<Napi::Number>().Int32Value();
    this->m_curl.setJA3Fingerprint(
                    tlsVersion,
                    ciphers,
                    tls13_ciphers,
                    extensions,
                    supportGroups,
                    ecPointFormat);

    return env.Undefined();
}

/*
    setAkamaiFingerprint(string,number,string,string)
*/
Napi::Value BaoLibCurlWarp::setAkamaiFingerprint(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setAkamaiFingerprint", 4, argsLen);
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
    std::string settings = info[0].As<Napi::String>().Utf8Value();
    REQUEST_TLS_METHOD_CHECK(env, info[1].IsNumber(), "argument 1 is not a number")
    int window_update = info[1].As<Napi::Number>().Int32Value();
    REQUEST_TLS_METHOD_CHECK(env, info[2].IsString(), "argument 2 is not a string")
    std::string streams = info[2].As<Napi::String>().Utf8Value();
    REQUEST_TLS_METHOD_CHECK(env, info[3].IsString(), "argument 3 is not a string")
    std::string pseudo_headers_order = info[3].As<Napi::String>().Utf8Value();
    this->m_curl.setAkamaiFingerprint(
                    settings,
                    window_update,
                    streams,
                    pseudo_headers_order);

    return env.Undefined();
}

/*
    sendAsync()
*/
Napi::Value BaoLibCurlWarp::sendAsync(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);

    Napi::ThreadSafeFunction tsfn = Napi::ThreadSafeFunction::New(
                                        env,
                                        Napi::Function::New(env, [env, deferred](const Napi::CallbackInfo &info)
    {
        bool success = info[0].As<Napi::Boolean>().Value();
        if (success)
        {
            deferred.Resolve(env.Undefined());
        } else {
            Napi::String errMsg = info[1].As<Napi::String>();
            deferred.Reject(errMsg);
        }
    }),
    "sendAsync", 0, 1, [tsfn](Napi::Env env)
    {  });
    ;
    auto callback = [tsfn](bool success, std::string errMsg)
    {   tsfn.NonBlockingCall(
                [tsfn, success, errMsg](Napi::Env env, Napi::Function jsCallback)
        {
            tsfn.Unref(env);
            jsCallback.Call({Napi::Boolean::New(env, success), Napi::String::New(env, errMsg.c_str())});
        });

        tsfn.Release();
    };
    this->m_curl.setOnPublishCallback(std::function<void(bool, std::string)>(std::move(callback)));

    if (argsLen > 0)
    {
        if (info[0].IsTypedArray())
        {
            Napi::Uint8Array u8Arr = info[0].As<Napi::Uint8Array>();
            this->m_curl.sendByte(reinterpret_cast<const char *>(u8Arr.Data()), u8Arr.ByteLength());
        }
        else if (info[0].IsString())
        {
            string str = info[0].As<Napi::String>().Utf8Value();
            size_t strLen = str.size();
            this->m_curl.sendByte(str.c_str(), strLen);
        }
        else
        {
            vector<Napi::Value> argsList{info[0].As<Napi::Value>()};
            string jsonStr = env.Global().Get("JSON").As<Napi::Object>().Get("stringify").As<Napi::Function>().Call(argsList).As<Napi::String>().Utf8Value();
            size_t strLen = jsonStr.size();
            this->m_curl.sendByte(jsonStr.c_str(), strLen);
        }
    }
    else
    {
        this->m_curl.sendByte(nullptr, 0);
    }

    g_curlMulti->pushQueue(this->m_curl);
    return deferred.Promise();
}

/*
    getResponseHeaders()
*/
Napi::Value BaoLibCurlWarp::getResponseHeaders(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    // size_t argsLen = info.Length();
    return Napi::String::New(env, this->m_curl.getResponseHeaders());
}
/*
    getResponseBody()
*/
Napi::Value BaoLibCurlWarp::getResponseBody(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    // size_t argsLen = info.Length();
    string utf8Str = this->m_curl.getResponseBody();
    size_t utf8Size = utf8Str.size();
    Napi::Uint8Array uint8buffer = Napi::Uint8Array::New(env, utf8Size);
    memcpy((void *)uint8buffer.Data(), utf8Str.c_str(), utf8Size);
    return uint8buffer;
}

/*
    getResponseString()
*/
Napi::Value BaoLibCurlWarp::getResponseString(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    // size_t argsLen = info.Length();
    return Napi::String::New(env, this->m_curl.getResponseBody());
}

/*
    setHttp2NextStreamId(number)
*/
Napi::Value BaoLibCurlWarp::setHttp2NextStreamId(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setHttp2NextStreamId", 1, argsLen);
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsNumber(), "argument 0 is not a number")
    int stream_id = info[0].As<Napi::Number>().Int32Value();
    this->m_curl.setHttp2NextStreamId(stream_id);
    return env.Undefined();
}

/*
    setHttp2StreamWeight(number)
*/
Napi::Value BaoLibCurlWarp::setHttp2StreamWeight(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setHttp2StreamWeight", 1, argsLen);
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsNumber(), "argument 0 is not a number")
    int weight = info[0].As<Napi::Number>().Int32Value();
    this->m_curl.setHttp2StreamWeight(weight);
    return env.Undefined();
}

/*
    setSSLCert()
*/
Napi::Value BaoLibCurlWarp::setSSLCert(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    size_t argsLen = info.Length();
    REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setSSLCert", 3, argsLen);
    REQUEST_TLS_METHOD_CHECK(env, info[0].IsTypedArray(), "argument 0 is not a typedArray")
    REQUEST_TLS_METHOD_CHECK(env, info[1].IsTypedArray() || info[1].IsNull(), "argument 1 is not a typedArray or null")
    REQUEST_TLS_METHOD_CHECK(env, info[2].IsString(), "argument 2 is not a string")
    REQUEST_TLS_METHOD_CHECK(env, info[3].IsString(), "argument 3 is not a string")
    Napi::Uint8Array sslCertBuffer = info[0].As<Napi::Uint8Array>();
    std::string type = info[2].As<Napi::String>().Utf8Value();
    std::string password = info[3].As<Napi::String>().Utf8Value();
    if (info[1].IsNull()) {
        this->m_curl.setSSLCert((void *)sslCertBuffer.Data(), sslCertBuffer.ByteLength(), NULL, 0, type, password);
    } else {
        Napi::Uint8Array sslPrivateKeyBuffer = info[1].As<Napi::Uint8Array>();
        this->m_curl.setSSLCert((void *)sslCertBuffer.Data(), sslCertBuffer.ByteLength(), (void *)sslPrivateKeyBuffer.Data(), sslPrivateKeyBuffer.ByteLength(), type, password);
    }
    return env.Undefined();
}

Napi::Value BaoLibCurlWarp::globalInit(const Napi::CallbackInfo &info)
{
    initLibCurl();
    return info.Env().Undefined();
}

Napi::Value BaoLibCurlWarp::globalCleanup(const Napi::CallbackInfo &info)
{
    uninitLibCurl();
    return info.Env().Undefined();
}

Napi::Value processRequestHeaders(const Napi::CallbackInfo &info)
{
    Napi::Array extraHeaders = info[0].As<Napi::Array>();
    Napi::Array customHeaders = info[1].As<Napi::Array>();
    std::vector<std::string> _extraHeaders;
    std::vector<std::string> _customHeaders;
    for (size_t i = 0; i < extraHeaders.Length(); i++)
    {
        _extraHeaders.push_back(extraHeaders.Get(i).As<Napi::String>().Utf8Value());
    }
    for (size_t i = 0; i < customHeaders.Length(); i++)
    {
        _customHeaders.push_back(customHeaders.Get(i).As<Napi::String>().Utf8Value());
    }
    std::vector<std::string> result = process_requestHeaders(_extraHeaders, _customHeaders);
    Napi::Array newArray = Napi::Array::New(info.Env(), extraHeaders.Length() + customHeaders.Length());
    for (size_t i = 0; i < result.size(); i++)
    {
        newArray.Set(i, Napi::String::From(info.Env(), result[i]));
    }
    return newArray;
}

Napi::Value processRequestHeadersV2(const Napi::CallbackInfo &info)
{
    Napi::Array extraHeaders = info[0].As<Napi::Array>();
    Napi::Array customHeaders = info[1].As<Napi::Array>();
    std::vector<std::string> _extraHeaders;
    std::vector<std::string> _customHeaders;
    for (size_t i = 0; i < extraHeaders.Length(); i++)
    {
        _extraHeaders.push_back(extraHeaders.Get(i).As<Napi::String>().Utf8Value());
    }
    for (size_t i = 0; i < customHeaders.Length(); i++)
    {
        _customHeaders.push_back(customHeaders.Get(i).As<Napi::String>().Utf8Value());
    }
    std::vector<std::string> result = process_requestHeadersV2(_extraHeaders, _customHeaders);
    Napi::Array newArray = Napi::Array::New(info.Env(), extraHeaders.Length() + customHeaders.Length());
    for (size_t i = 0; i < result.size(); i++)
    {
        newArray.Set(i, Napi::String::From(info.Env(), result[i]));
    }
    return newArray;
}

// Initialize native add-on
Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    env.AddCleanupHook([]
    {
        uninitLibCurl();
    });
    BaoLibCurlWarp::Init(env, exports);
    exports.Set("processRequestHeaders", Napi::Function::New(env, processRequestHeaders));
    exports.Set("processRequestHeadersV2", Napi::Function::New(env, processRequestHeadersV2));
    return exports;
}
NODE_API_MODULE(bao_curl_node_addon, Init)
