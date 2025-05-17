#include "bao_curl.h"

#define CHECK_CURLOK(e)                                          \
	{                                                            \
		CURLcode code = (e);                                     \
		this->m_lastCode = code;                                 \
		if (this->m_verbose && code != CURLcode::CURLE_OK)       \
		{                                                        \
			printf("CURL Error(%d):%s\n", __LINE__, curl_easy_strerror(code)); \
		}                                                        \
	}

#define CHECK_CURLSHOK(e)                                         \
	{                                                             \
		CURLSHcode code = (e);                                    \
		if (this->m_verbose && code != CURLSHE_OK)                \
		{                                                         \
			printf("CURL Error:%s\n", curl_share_strerror(code)); \
		}                                                         \
	}

NAMESPACE_BAO_START

size_t write_func(void *ptr, size_t size, size_t nmemb, std::string &stream)
{
	const size_t resize = size * nmemb;
	std::string html_data(reinterpret_cast<const char *>(ptr), size * nmemb);
	stream += html_data;
	return resize;
}

BaoCurl::BaoCurl()
{
	this->init();
}

BaoCurl::~BaoCurl()
{
	assert(this->m_pCURL);
	if (this->m_pHeaders)
	{
		curl_slist_free_all(this->m_pHeaders);
		this->m_pHeaders = NULL;
	}
	curl_easy_cleanup(this->m_pCURL);
}

void BaoCurl::init()
{
	this->m_pCURL = curl_easy_init();
	assert(this->m_pCURL);
	CHECK_CURLSHOK(curl_share_setopt(this->m_pCURL, CURLSHOPT_SHARE, CURL_LOCK_DATA_DNS));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_SSL_VERIFYPEER, 0L));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_SSL_VERIFYHOST, 0L));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_SSL_CIPHER_LIST, "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:DH-RSA-AES128-GCM-SHA256:AES128-SHA:AES256-SHA"));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_SSL_EC_CURVES, "X25519:P-256:P-384"));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_ACCEPT_ENCODING, ""));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_COOKIEFILE, NULL));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_PRIVATE, this));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_FORBID_REUSE, 1L));
	setHttp2NextStreamId(1);
	this->setTimeout(15, 15);
}

void BaoCurl::open(std::string &method, std::string &url)
{
	std::transform(method.begin(), method.end(), method.begin(),
				   [](unsigned char c)
				   { return std::toupper(c); });
	this->m_method = method;
	this->m_stream.header = "";
	this->m_stream.responseText = "";
	this->m_bProxy = false;
	this->m_bIsHttps = url.substr(0, 5) == "https";
	if (this->m_pHeaders)
	{
		curl_slist_free_all(this->m_pHeaders);
		this->m_pHeaders = NULL;
	}

	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_COOKIELIST, ""));

	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_URL, url.c_str()));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_WRITEFUNCTION, &write_func));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_WRITEDATA, &this->m_stream.responseText));

	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HEADERFUNCTION, &write_func));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HEADERDATA, &this->m_stream.header));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_POST, method == "POST"));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_CUSTOMREQUEST, method.c_str()));
}

void BaoCurl::setRequestHeader(std::string &key, std::string &value)
{
	std::string _key = key;
	transform(_key.begin(), _key.end(), _key.begin(), ::tolower);
	if (_key == "user-agent")
	{
		CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_USERAGENT, value.c_str()));
	}
	this->m_pHeaders = curl_slist_append(this->m_pHeaders, (key + ": " + value).c_str());
}

void BaoCurl::setRequestHeader(std::string &keyValue)
{
	this->m_pHeaders = curl_slist_append(this->m_pHeaders, keyValue.c_str());
}

void BaoCurl::setRequestHeaders(std::string &header)
{
	auto arr = StringSplit(header, "\n");
	for (auto arr_b = arr.begin(); arr_b != arr.end(); ++arr_b)
	{
		std::string arr_mem = *arr_b;
		if (arr_mem.size() == 0)
		{
			continue;
		}
		if (arr_mem.find(": ") != -1)
		{
			auto arr = StringSplit(arr_mem, ": ");
			auto key = arr.at(0);
			auto value = arr.at(1);
			setRequestHeader(key, value);
		}
		else
		{

			setRequestHeader(arr_mem);
		}
	}
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HTTPHEADER, this->m_pHeaders));
}

void BaoCurl::setProxy(std::string &proxy)
{
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_PROXY, proxy.c_str()));
	this->m_bProxy = true;
}

void BaoCurl::setProxy(std::string &proxy, std::string &username,
					   std::string &password)
{
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_PROXY, proxy.c_str()));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_PROXYUSERPWD, (username + ":" + password).c_str()));
	this->m_bProxy = true;
}

void BaoCurl::setTimeout(
	int connectTime,
	int sendTime)
{
	/*
		CURLOPT_CONNECTTIMEOUT：连接对方主机时的最长等待时间，此设置限制的是建立连接过程的时间，其它过程的时间不在控制范围
		CURLOPT_TIMEOUT：整个cURL函数执行过程的最长等待时间，也就是说，这个时间是包含连接等待时间的
		CURLOPT_TIMEOUT的值应比CURLOPT_CONNECTTIMEOUT大
	*/
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_CONNECTTIMEOUT, connectTime));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_TIMEOUT, sendTime));
}

void BaoCurl::sendByte(const char *data, const int len)
{
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HTTPHEADER, this->m_pHeaders));
	if (this->m_bProxy)
	{
		if (this->m_bIsHttps)
		{
			CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HTTPPROXYTUNNEL, 1L));
		}
		else
		{
			CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_PROXYTYPE, CURLPROXY_HTTP));
		}
	}

	if (this->m_method == "POST" || this->m_method == "PUT" || this->m_method == "PATCH" || this->m_method == "DELETE")
	{

		m_postdata = std::unique_ptr<const char[]>(new char[len]);
		if (len != 0)
		{
			memcpy((void *)m_postdata.get(), data, len);
		};
		CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_POSTFIELDS, m_postdata.get()));
		CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_POSTFIELDSIZE, len));
	}
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_NOBODY, this->m_method == "HEAD" ? 1L : 0L));
	/*CHECK_CURLOK(curl_easy_perform(this->m_pCURL));
	curl_slist_free_all(this->m_pHeaders);
	this->m_pHeaders = NULL;*/
}

/* Hostname */
/* Include subdomains */
/* Path */
/* Secure */
/* Expiry in epoch time format. 0 == Session */
/* Name */
/* Value */
void BaoCurl::setCookie(std::string &key, std::string &value, std::string &domain, std::string &path)
{
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_COOKIELIST, StringFormat("%s\tTRUE\t%s\tFALSE\t0\t%s\t%s", domain.c_str(), path.c_str(), key.c_str(), value.c_str()).c_str()));
	// CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_COOKIELIST, StringFormat("Set-Cookie: %s=%s; domain=%s; path=%s;", key.c_str(), value.c_str(), domain.c_str(), path.c_str()).c_str()));
}

void BaoCurl::deleteCookie(std::string &key, std::string &domain, std::string &path)
{
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_COOKIELIST, StringFormat("%s\tTURE\t%s\tFALSE\t1600000000\t%s\t%s", domain.c_str(), path.c_str(), key.c_str(), "").c_str()));
}

std::string BaoCurl::getCookies()
{
	struct curl_slist *cookies = NULL;
	std::string str;
	CHECK_CURLOK(curl_easy_getinfo(this->m_pCURL, CURLINFO_COOKIELIST, &cookies));
	struct curl_slist *cookiesOrign = cookies;

	if (!cookies)
	{
		return "";
	}
	do
	{
		str += cookies->data;
		str += "\n";
		cookies = cookies->next;
	} while (cookies);
	curl_slist_free_all(cookiesOrign);
	return str;
}

std::string BaoCurl::getCookie(std::string &key, std::string &domain, std::string &path)
{
	struct curl_slist *cookies = NULL;
	std::string str = "";
	CHECK_CURLOK(curl_easy_getinfo(this->m_pCURL, CURLINFO_COOKIELIST, &cookies));
	struct curl_slist *cookiesOrign = cookies;
	if (!cookies)
	{
		return "";
	}
	do
	{
		std::vector<std::string> vt = StringSplit(std::string(cookies->data), "\t");
		if (domain.size() != 0)
		{
			if (domain != vt.at(0) && ("#HttpOnly_" + domain) != vt.at(0))
			{
				cookies = cookies->next;
				continue;
			}
		}
		if (path.size() != 0)
		{
			if (path != vt.at(2))
			{
				cookies = cookies->next;
				continue;
			}
		}
		if (vt.at(5) == key)
		{
			str = vt.at(6);
			break;
		}
		cookies = cookies->next;
	} while (cookies);
	curl_slist_free_all(cookiesOrign);
	return str;
}

long BaoCurl::getResponseStatus()
{
	long http_code;
	CHECK_CURLOK(curl_easy_getinfo(this->m_pCURL, CURLINFO_RESPONSE_CODE, &http_code));
	return http_code;
}
void BaoCurl::reset()
{
	curl_easy_cleanup(this->m_pCURL);
	this->init();
}

void BaoCurl::setRedirect(bool enable)
{
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_FOLLOWLOCATION, enable));
}
void BaoCurl::setVerbose(bool enable)
{
	this->m_verbose = enable;
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_VERBOSE, this->m_verbose ? 1L: 0L));
}

void BaoCurl::setHttpVersion(BaoCurl::HttpVersion version)
{
	int temp = CURL_HTTP_VERSION_1_1;
	switch (version)
	{
	case BaoCurl::HttpVersion::http1_1:
		temp = CURL_HTTP_VERSION_1_1;
		break;
	case BaoCurl::HttpVersion::http2:
		temp = CURL_HTTP_VERSION_2;
		break;
	case BaoCurl::HttpVersion::http3:
		temp = CURL_HTTP_VERSION_3;
	case BaoCurl::HttpVersion::http3_only:
		temp = CURL_HTTP_VERSION_3ONLY;
		break;
	default:
		printf("error httpVersion!\n");
		return;
	}
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HTTP_VERSION, temp));
}

unsigned int BaoCurl::getLastCurlCode()
{
	return this->m_lastCode;
}

const char *BaoCurl::getLastCurlCodeError()
{
	return curl_easy_strerror(this->m_lastCode);
}

curl_off_t BaoCurl::getResponseContentLength()
{
	curl_off_t size;
	CHECK_CURLOK(curl_easy_getinfo(this->m_pCURL, CURLINFO_SIZE_DOWNLOAD_T, &size));
	return size;
}

void BaoCurl::setInterface(std::string &network)
{
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_INTERFACE, network.c_str()));
}

void BaoCurl::setJA3Fingerprint(
	int tls_version, std::string &cipher, std::string &tls13_cipher, std::string &extensions, std::string &support_groups, int ec_point_formats)
{

	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2 | CURL_SSLVERSION_MAX_TLSv1_3));

	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_SSL_CIPHER_LIST, cipher.c_str()));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_TLS13_CIPHERS, tls13_cipher.c_str()));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_SSL_EC_CURVES, support_groups.c_str()));
	// extensions unsupport
	// ec_point_formats unsupport
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_TLS_EXTENSION_PERMUTATION, extensions.c_str()));
}

void BaoCurl::setAkamaiFingerprint(
	std::string& settings, int window_update, std::string &streams, std::string &pseudo_headers_order)
{
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HTTP2_SETTINGS, settings.c_str()));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HTTP2_WINDOW_UPDATE, window_update));
	if (streams != "0")
	{
		CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HTTP2_STREAMS, streams.c_str()));
	}
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HTTP2_PSEUDO_HEADERS_ORDER, pseudo_headers_order.c_str()));
}

void BaoCurl::setOnPublishCallback(BaoCurlOnPublishCallback callback)
{
	this->m_publishCallback = callback;
}

// void BaoCurl::setHttp2NextStreamId(int stream_id)
// {
// 	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HTTP2_STREAM_ID, stream_id));
// }

void BaoCurl::setHttp2NextStreamId(int stream_id)
{
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HTTP2_STREAM_ID, stream_id));
}

void BaoCurl::setHttp2StreamWeight(int weight)
{
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_STREAM_WEIGHT, weight));
}

NAMESPACE_BAO_END
