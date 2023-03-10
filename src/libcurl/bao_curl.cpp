#include "bao_curl.h"

#define CHECK_CURLOK(e)                                          \
	{                                                            \
		CURLcode code = (e);                                     \
		this->m_lastCode = code;                                 \
		if (this->m_verbose && code != CURLcode::CURLE_OK)       \
		{                                                        \
			printf("CURL Error:%s\n", curl_easy_strerror(code)); \
		}                                                        \
	}

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
	curl_easy_cleanup(this->m_pCURL);
}

void BaoCurl::init()
{
	this->m_pCURL = curl_easy_init();
	assert(this->m_pCURL);
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_SSL_VERIFYPEER, 0L));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_SSL_VERIFYHOST, 0L));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_SSL_CIPHER_LIST, "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:DH-RSA-AES128-GCM-SHA256:AES128-SHA:AES256-SHA"));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_SSL_EC_CURVES, "X25519:P-256:P-384"));
	// CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_SSL_, "X25519:P-256:P-384"));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_ACCEPT_ENCODING, ""));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_COOKIEFILE, NULL));
	this->setTimeout(15, 15);
}

void BaoCurl::open(std::string &method, std::string &url)
{
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
		setRequestHeader(arr_mem);
	}
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
		CURLOPT_CONNECTTIMEOUT??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
		CURLOPT_TIMEOUT?????????cURL???????????????????????????????????????????????????????????????????????????????????????????????????
		CURLOPT_TIMEOUT????????????CURLOPT_CONNECTTIMEOUT???
	*/
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_CONNECTTIMEOUT, connectTime));
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_TIMEOUT, sendTime));
}

void BaoCurl::send()
{
	std::string empty = "";
	BaoCurl::send(empty);
}

void BaoCurl::send(std::string &data)
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
	if (this->m_method == "POST" || this->m_method == "PUT" || this->m_method == "PATCH")
	{
		CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_POSTFIELDS, data.c_str()));
		CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_POSTFIELDSIZE, data.size()));
	}
	else
	{
		CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_NOBODY, data.size()));
	}
	CHECK_CURLOK(curl_easy_perform(this->m_pCURL));
	curl_slist_free_all(this->m_pHeaders);
	this->m_pHeaders = NULL;
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

	if (this->m_method == "POST" || this->m_method == "PUT" || this->m_method == "PATCH")
	{
		CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_POSTFIELDS, data));
		CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_POSTFIELDSIZE, len));
	}
	CHECK_CURLOK(curl_easy_perform(this->m_pCURL));
	curl_slist_free_all(this->m_pHeaders);
	this->m_pHeaders = NULL;
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
			if (domain != vt.at(0))
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

void BaoCurl::setRedirect(bool isAllow)
{
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_FOLLOWLOCATION, isAllow));
}
void BaoCurl::printInnerLogger()
{
	CHECK_CURLOK(curl_easy_setopt(this->m_pCURL, CURLOPT_VERBOSE, 1L));
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