#pragma once
#ifndef _CURL_H
#define _CURL_H

#include "curl/curl.h"
#include "utils.h"

struct Stream_st
{
	std::string header;
	std::string responseText;
};

class BaoCurl
{
public:
	BaoCurl();
	~BaoCurl();
	void open(std::string &, std::string &);
	void setRequestHeader(std::string &, std::string &);
	void setRequestHeader(std::string &);
	void setRequestHeaders(std::string &);
	/*
	 * setProxy必须在open后 send前设置
	 * 在send后失效 需重新设置
	 */
	void setProxy(std::string &);
	void setProxy(std::string &, std::string &,
				  std::string &);
	/*
	 * setTimeout必须在open后 send前设置
	 * 在send后失效 需重新设置
	 * 单位:秒   例子:setTimeout(10,10);
	 */
	void setTimeout(
		int connectTime,
		int sendTime);
	/*
	 * 设置单条Cookie
	 */
	void setCookie(std::string &key, std::string &value, std::string &domain, std::string &path);
	/*
	 * 移除单条Cookie
	 */
	void deleteCookie(std::string &key, std::string &domain, std::string &path);
	void send();
	void send(std::string &);
	void sendByte(const char *, const int);
	/*
	 * 重置Curl 此前的操作全部失效
	 */
	void reset();

	std::string getCookies();
	std::string getCookie(std::string &key, std::string &domain, std::string &path);
	std::string getResponseHeaders() { return this->m_stream.header; };
	std::string getResponseBody() { return this->m_stream.responseText; };
	long getResponseStatus();
	void setRedirect(bool isAllow); // 重定向
	void printInnerLogger();		// 打印内部日志
	void setInterface(std::string& network);//指定网卡访问

	enum HttpVersion
	{
		http1_1,
		http2,
	};
	void setHttpVersion(HttpVersion);
	unsigned int getLastCurlCode();
	const char *getLastCurlCodeError();

private:
	CURL *m_pCURL = NULL;
	struct curl_slist *m_pHeaders = NULL;
	std::string m_method = "GET";
	struct Stream_st m_stream;
	// struct curl_slist* m_cookies = NULL;
	bool m_bProxy = false;
	bool m_bIsHttps = false;
	bool m_verbose = false;
	CURLcode m_lastCode;

	void init();
};

#endif // !_CURL_H
