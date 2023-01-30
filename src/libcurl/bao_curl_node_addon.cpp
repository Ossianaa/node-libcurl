#include <napi.h>
#include <iostream>
#include "bao_curl.h"
#include "request_tls_utils.h"
#include "curlAysncWorker.h"

using namespace std;

void initLibCurl()
{
	curl_global_init(CURL_GLOBAL_ALL);
}

void uninitLibCurl()
{
	curl_global_cleanup();
}

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
	Napi::Value removeCookie(const Napi::CallbackInfo &info);
	Napi::Value getCookies(const Napi::CallbackInfo &info);
	Napi::Value getCookie(const Napi::CallbackInfo &info);
	Napi::Value getResponseStatus(const Napi::CallbackInfo &info);
	Napi::Value reset(const Napi::CallbackInfo &info);
	Napi::Value setRedirect(const Napi::CallbackInfo &info);
	Napi::Value printInnerLogger(const Napi::CallbackInfo &info);
	Napi::Value setHttpVersion(const Napi::CallbackInfo &info);
	Napi::Value send(const Napi::CallbackInfo &info);
	Napi::Value sendAsync(const Napi::CallbackInfo &info);
	Napi::Value getResponseBody(const Napi::CallbackInfo &info);
	Napi::Value getResponseString(const Napi::CallbackInfo &info);
	Napi::Value getResponseHeaders(const Napi::CallbackInfo &info);
};

Napi::Object BaoLibCurlWarp::Init(Napi::Env env, Napi::Object exports)
{
	// This method is used to hook the accessor and method callbacks
	std::vector<Napi::ClassPropertyDescriptor<BaoLibCurlWarp>> methodList = {
		InstanceMethod<&BaoLibCurlWarp::open>("open", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::setRequestHeader>("setRequestHeader", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::setRequestHeaders>("setRequestHeaders", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::setProxy>("setProxy", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::setTimeout>("setTimeout", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::setCookie>("setCookie", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::removeCookie>("removeCookie", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::getCookies>("getCookies", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::getCookie>("getCookie", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::getResponseStatus>("getResponseStatus", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::reset>("reset", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::setRedirect>("setRedirect", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::printInnerLogger>("printInnerLogger", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::setHttpVersion>("setHttpVersion", static_cast<napi_property_attributes>(napi_writable | napi_configurable)), InstanceMethod<&BaoLibCurlWarp::send>("send", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
		InstanceMethod<&BaoLibCurlWarp::getResponseBody>("getResponseBody", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
		InstanceMethod<&BaoLibCurlWarp::getResponseString>("getResponseString", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
		InstanceMethod<&BaoLibCurlWarp::sendAsync>("sendAsync", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
		InstanceMethod<&BaoLibCurlWarp::getResponseHeaders>("getResponseHeaders", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
		// StaticMethod<&BaoLibCurlWarp::CreateNewItem>("CreateNewItem", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
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
	// cout << "BaoLibCurlWarp Initilaze" << endl;
	// this->m_curl.printInnerLogger();
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
		this->m_curl.setRequestHeaders(key + ";");
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
	REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "setCookie", 3, argsLen)
	REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
	REQUEST_TLS_METHOD_CHECK(env, info[1].IsString(), "argument 1 is not a string")
	REQUEST_TLS_METHOD_CHECK(env, info[2].IsString(), "argument 2 is not a string")
	string key = info[0].As<Napi::String>().Utf8Value();
	string value = info[1].As<Napi::String>().Utf8Value();
	string domain = info[2].As<Napi::String>().Utf8Value();
	this->m_curl.setCookie(key, value, domain);
	return env.Undefined();
}

/*
	removeCookie(key, domain)
*/
Napi::Value BaoLibCurlWarp::removeCookie(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();
	REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "removeCookie", 2, argsLen)
	string key = info[0].As<Napi::String>().Utf8Value();
	string domain = info[1].As<Napi::String>().Utf8Value();
	this->m_curl.removeCookie(key, domain);
	return env.Undefined();
}

/*
	getCookies()
*/
Napi::Value BaoLibCurlWarp::getCookies(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();

	return Napi::String::New(env, this->m_curl.getCookies());
}

/*
	getCookie(key)
*/
Napi::Value BaoLibCurlWarp::getCookie(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();
	REQUEST_TLS_METHOD_ARGS_CHECK(env, "BaoCurl", "getCookie", 1, argsLen);
	REQUEST_TLS_METHOD_CHECK(env, info[0].IsString(), "argument 0 is not a string")
	return Napi::String::New(env, this->m_curl.getCookie(
									  info[0].As<Napi::String>().Utf8Value()));
}

/*
	getResponseStatus()
*/
Napi::Value BaoLibCurlWarp::getResponseStatus(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();

	return Napi::Number::New(env, this->m_curl.getResponseStatus());
}

/*
	reset()
*/
Napi::Value BaoLibCurlWarp::reset(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();

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
	size_t argsLen = info.Length();
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
	send()
*/
Napi::Value BaoLibCurlWarp::send(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();
	if (argsLen == 0 || info[0].IsNull())
	{
		this->m_curl.send();
		return env.Undefined();
	}
	REQUEST_TLS_METHOD_ARGS_TOO_MUCH_CHECK(env, "BaoCurl", "send", 1, argsLen)
	if (info[0].IsTypedArray())
	{
		Napi::Uint8Array u8Arr = info[0].As<Napi::Uint8Array>();
		uint8_t *utf8Buffer = u8Arr.Data();
		this->m_curl.sendByte(reinterpret_cast<const char *>(utf8Buffer), u8Arr.ByteLength());
		return env.Undefined();
	}
	if (info[0].IsString())
	{
		string str = info[0].As<Napi::String>().Utf8Value();
		this->m_curl.send(str);
		return env.Undefined();
	}
	vector<Napi::Value> argsList{info[0].As<Napi::Value>()};
	string jsonStr = env.Global().Get("JSON").As<Napi::Object>().Get("stringify").As<Napi::Function>().Call(argsList).As<Napi::String>().Utf8Value();
	this->m_curl.send(jsonStr);
	return env.Undefined();
}

/*
	sendAsync()
*/
Napi::Value BaoLibCurlWarp::sendAsync(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();
	curlAsyncWorker *workerPtr;
	if (argsLen == 1 || info[0].IsFunction())
	{
		workerPtr = new curlAsyncWorker(info[0].As<Napi::Function>(), this->m_curl, nullptr, 0);
		workerPtr->Queue();
		return env.Undefined();
	}
	if (argsLen > 2)
	{
		REQUEST_TLS_METHOD_ARGS_TOO_MUCH_CHECK(env, "BaoCurl", "send", 2, argsLen)
	}

	if (info[0].IsTypedArray())
	{
		Napi::Uint8Array u8Arr = info[0].As<Napi::Uint8Array>();
		workerPtr = new curlAsyncWorker(info[1].As<Napi::Function>(), this->m_curl, (const char *)u8Arr.Data(), u8Arr.ElementLength());
		workerPtr->Queue();
		// this->m_curl.sendByte(reinterpret_cast<const char *>(utf8Buffer), u8Arr.ByteLength());
		return env.Undefined();
	}
	if (info[0].IsString())
	{
		string str = info[0].As<Napi::String>().Utf8Value();
		size_t strLen = str.size();
		Napi::Uint8Array u8buffer = Napi::Uint8Array::New(env, strLen);
		memcpy(u8buffer.Data(), str.c_str(), strLen);
		workerPtr = new curlAsyncWorker(info[1].As<Napi::Function>(), this->m_curl, (const char *)u8buffer.Data(),u8buffer.ElementLength());
		workerPtr->Queue();
		return env.Undefined();
	}
	vector<Napi::Value> argsList{info[0].As<Napi::Value>()};
	string jsonStr = env.Global().Get("JSON").As<Napi::Object>().Get("stringify").As<Napi::Function>().Call(argsList).As<Napi::String>().Utf8Value();
	size_t strLen = jsonStr.size();
	Napi::Uint8Array u8buffer = Napi::Uint8Array::New(env, strLen);
	memcpy(u8buffer.Data(), jsonStr.c_str(), strLen);
	workerPtr = new curlAsyncWorker(info[1].As<Napi::Function>(), this->m_curl, (const char *)u8buffer.Data(),u8buffer.ElementLength());
	workerPtr->Queue();
	return env.Undefined();
}

/*
	getResponseHeaders()
*/
Napi::Value BaoLibCurlWarp::getResponseHeaders(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();
	return Napi::String::New(env, this->m_curl.getResponseHeaders());
}
/*
	getResponseBody()
*/
Napi::Value BaoLibCurlWarp::getResponseBody(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();
	size_t argsLen = info.Length();
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
	size_t argsLen = info.Length();
	return Napi::String::New(env, this->m_curl.getResponseBody());
}

// Initialize native add-on
Napi::Object Init(Napi::Env env, Napi::Object exports)
{
	initLibCurl();
	BaoLibCurlWarp::Init(env, exports);
	return exports;
}
NODE_API_MODULE(requests_tls, Init)