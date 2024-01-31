#include <napi.h>
#include <iostream>
#include "bao_curl.h"
#include "bao_curl_websocket.h"
#include "request_tls_utils.h"

using namespace std;
using namespace bao;

BaoCurlMulti *g_curlMulti = nullptr;

void initLibCurl()
{
	curl_global_init(CURL_GLOBAL_ALL);
	g_curlMulti = new BaoCurlMulti();
	g_curlMulti->startThread();
}

void uninitLibCurl()
{
	delete g_curlMulti;
	curl_global_cleanup();
}

class BaoLibCurlWebSocketWarp : public Napi::ObjectWrap<BaoLibCurlWebSocketWarp>
{
public:
	static Napi::Function Init(Napi::Env env);
	BaoLibCurlWebSocketWarp(const Napi::CallbackInfo &info);
	~BaoLibCurlWebSocketWarp();

private:
	std::unique_ptr<BaoCurlWebSocket> m_ws = nullptr;
	Napi::Value start(const Napi::CallbackInfo &info);
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

Napi::Function BaoLibCurlWebSocketWarp::Init(Napi::Env env)
{
	std::vector<Napi::ClassPropertyDescriptor<BaoLibCurlWebSocketWarp>> wsMethodList = {
		InstanceMethod<&BaoLibCurlWebSocketWarp::start>("start", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
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
	REQUEST_TLS_METHOD_ARGS_CHECK_NO_RETURN(env, "BaoCurl.WebSocket", "constructor", 2, argsLen)
	REQUEST_TLS_METHOD_CHECK_NO_RETURN(env, info[0].IsString(), "argument 0 is not a string")
	REQUEST_TLS_METHOD_CHECK_NO_RETURN(env, info[1].IsObject(), "argument 1 is not a object")

	string uri = info[0].As<Napi::String>().Utf8Value();
	Napi::Object option = info[1].As<Napi::Object>();
	string protocol = option.Get("protocol").IsString() ? option.Get("protocol").As<Napi::String>().Utf8Value() : "";
	this->m_ws = std::make_unique<BaoCurlWebSocket>(uri, protocol, [this]()
		{ _onopen.NonBlockingCall([](Napi::Env env, Napi::Function jsCallback)
								  { jsCallback.Call({}); }); },
		[this]()
		{
			_onclose.NonBlockingCall([](Napi::Env env, Napi::Function jsCallback)
									 { jsCallback.Call({}); });
		},
		[this](const std::string &err)
		{
			_onerror.NonBlockingCall([err](Napi::Env env, Napi::Function jsCallback)
									 { jsCallback.Call({Napi::String::New(env, err.c_str())}); });
		},
		[this](const std::string &data)
		{
			_onmessage.NonBlockingCall([data](Napi::Env env, Napi::Function jsCallback)
									   { jsCallback.Call({Napi::String::New(env, data.c_str())}); });
		});
}

BaoLibCurlWebSocketWarp::~BaoLibCurlWebSocketWarp()
{
	this->m_ws->close();
	this->m_ws = nullptr;
}

Napi::Value BaoLibCurlWebSocketWarp::start(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();
	bool isSuccess = this->m_ws->start();
	if (isSuccess)
	{
		// env.AddCleanupHook([this](BaoCurlWebSocket *ws)
		// 				   {
		// 	while(!ws->isClosed){
		// 		std::cout << "wait close" << std::endl;
		// 		std::this_thread::sleep_for(std::chrono::milliseconds(100));
		// 	} },
		// 				   this->m_ws);
	};
	return Napi::Boolean::New(env, isSuccess);
}

Napi::Value BaoLibCurlWebSocketWarp::close(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();
	this->m_ws->close();
	// this->_onopen.Abort();
	// this->_onclose.Abort();
	// this->_onerror.Abort();
	// this->_onmessage.Abort();
	this->_onopen.Release();
	this->_onclose.Release();
	this->_onerror.Release();
	this->_onmessage.Release();
	return env.Undefined();
}

Napi::Value BaoLibCurlWebSocketWarp::send(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();
	REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl.WebSocket", "send", 1, argsLen)
	REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
	std::string data = info[0].As<Napi::String>().Utf8Value();
	this->m_ws->send(data);
	return env.Undefined();
};
Napi::Value BaoLibCurlWebSocketWarp::setOnOpen(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();
	REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl.WebSocket", "setOnOpen", 1, argsLen)
	REQUEST_TLS_METHOD_CHECK(env, info[0].IsFunction(), "argument 0 is not a function")
	_onopen = Napi::ThreadSafeFunction::New(
		env,
		info[0].As<Napi::Function>(),
		"Test", 0, 1);
	return env.Undefined();
};
Napi::Value BaoLibCurlWebSocketWarp::setOnClose(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();
	REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl.WebSocket", "setOnClose", 1, argsLen)
	REQUEST_TLS_METHOD_CHECK(env, info[0].IsFunction(), "argument 0 is not a function")
	_onclose = Napi::ThreadSafeFunction::New(
		env,
		info[0].As<Napi::Function>(),
		"Test", 0, 1);
	return env.Undefined();
};
Napi::Value BaoLibCurlWebSocketWarp::setOnError(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();
	REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl.WebSocket", "setOnError", 1, argsLen)
	REQUEST_TLS_METHOD_CHECK(env, info[0].IsFunction(), "argument 0 is not a function")
	_onerror = Napi::ThreadSafeFunction::New(
		env,
		info[0].As<Napi::Function>(),
		"Test", 0, 1);
	return env.Undefined();
};
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
	return env.Undefined();
};
class BaoLibCurlWarp : public Napi::ObjectWrap<BaoLibCurlWarp>
{
public:
	static Napi::Object Init(Napi::Env env, Napi::Object exports);
	BaoLibCurlWarp(const Napi::CallbackInfo &info);
	~BaoLibCurlWarp();
	// static Napi::Value CreateNewItem(const Napi::CallbackInfo& info);

private:
	BaoCurl m_curl;
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
	Napi::Value reset(const Napi::CallbackInfo &info);
	Napi::Value setRedirect(const Napi::CallbackInfo &info);
	Napi::Value printInnerLogger(const Napi::CallbackInfo &info);
	Napi::Value setHttpVersion(const Napi::CallbackInfo &info);
	Napi::Value setInterface(const Napi::CallbackInfo &info);
	Napi::Value setJA3Fingerprint(const Napi::CallbackInfo &info);
	Napi::Value sendAsync(const Napi::CallbackInfo &info);
	Napi::Value getResponseBody(const Napi::CallbackInfo &info);
	Napi::Value getResponseString(const Napi::CallbackInfo &info);
	Napi::Value getResponseHeaders(const Napi::CallbackInfo &info);
	Napi::Value getResponseContentLength(const Napi::CallbackInfo &info);
	Napi::Value getLastCode(const Napi::CallbackInfo &info);
	Napi::Value getLastCodeError(const Napi::CallbackInfo &info);

	// static Napi::Value multiExecute(const Napi::CallbackInfo &info);
	static Napi::Value globalInit(const Napi::CallbackInfo &info);
	static Napi::Value globalCleanup(const Napi::CallbackInfo &info);
};

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
		InstanceMethod<&BaoLibCurlWarp::reset>("reset", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
		InstanceMethod<&BaoLibCurlWarp::setRedirect>("setRedirect", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
		InstanceMethod<&BaoLibCurlWarp::printInnerLogger>("printInnerLogger", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
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
	reset()
*/
Napi::Value BaoLibCurlWarp::reset(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	// size_t argsLen = info.Length();

	this->m_curl.reset();
	return env.Undefined();
}

/*
	setRedirect(isAllow)
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
	printInnerLogger()
*/
Napi::Value BaoLibCurlWarp::printInnerLogger(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	// size_t argsLen = info.Length();
	this->m_curl.printInnerLogger();
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
											} }),
		"Test", 0, 1, [tsfn](Napi::Env env)
		{  });
	;
	auto callback = [tsfn](bool success, std::string errMsg)
	{ tsfn.NonBlockingCall(
		  [tsfn, success, errMsg](Napi::Env env, Napi::Function jsCallback)
		  {
			  tsfn.Unref(env);
			  jsCallback.Call({Napi::Boolean::New(env, success), Napi::String::New(env, errMsg.c_str())});
		  }); };
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

// Initialize native add-on
Napi::Object Init(Napi::Env env, Napi::Object exports)
{
	env.AddCleanupHook([]
					   { uninitLibCurl(); });
	BaoLibCurlWarp::Init(env, exports);
	return exports;
}
NODE_API_MODULE(bao_curl_node_addon, Init)
