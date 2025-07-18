#pragma once
#ifndef _CURL_H
#define _CURL_H

#include "curl/curl.h"
#include "utils.h"
#include "uv.h"

NAMESPACE_BAO_START

typedef std::function<void (bool, std::string)> BaoCurlOnPublishCallback;

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
    void open(std::string&, std::string&);
    void setRequestHeader(std::string&, std::string&);
    void setRequestHeader(std::string&);
    void setRequestHeaders(std::string&);

    void setProxy(std::string&);
    void setProxy(std::string&, std::string&,
                  std::string&);

    void setTimeout(
        int connectTime,
        int sendTime);

    void setCookie(std::string& key, std::string& value, std::string& domain, std::string& path);
    void deleteCookie(std::string& key, std::string& domain, std::string& path);
    void sendByte(const char*, const int);

    std::string getCookies();
    std::string getCookie(std::string& key, std::string& domain, std::string& path);
    std::string getResponseHeaders() {
        return this->m_stream.header;
    };
    std::string getResponseBody() {
        return this->m_stream.responseText;
    };
    long getResponseStatus();
    std::string getLastEffectiveUrl();

    void setSSLVerify(std::string &caPath);
    void setRedirect(bool enable);
    void setVerbose(bool enable);
    void setInterface(std::string& network);
    void setJA3Fingerprint(int tls_version, std::string& cipher, std::string& tls13_cipher, std::string& extensions, std::string& support_groups, int ec_point_formats);
    void setAkamaiFingerprint(std::string& settings, int window_update, std::string &streams, std::string &pseudo_headers_order);
    void setOnPublishCallback(BaoCurlOnPublishCallback callback);
    void setHttp2NextStreamId(int stream_id);
    void setHttp2StreamWeight(int weight);
    void setSSLCert(void* sslCertBuffer, size_t sslCertBufferSize, void* sslPrivateKeyBuffer, size_t sslPrivateKeyBufferSize, std::string& type, std::string& password);

    enum HttpVersion
    {
        http1_1,
        http2,
        http3,
        http3_only,
    };
    void setHttpVersion(HttpVersion);
    unsigned int getLastCurlCode();
    const char* getLastCurlCodeError();
    curl_off_t getResponseContentLength();
    friend class BaoCurlMulti;

    CURL* m_pCURL = NULL;
    CURL* m_pSHARE = NULL;
private:
    struct curl_slist* m_pHeaders = NULL;
    std::string m_method = "GET";
    struct Stream_st m_stream;
    // struct curl_slist* m_cookies = NULL;
    bool m_bProxy = false;
    bool m_bIsHttps = false;
    bool m_verbose = false;
    CURLcode m_lastCode;
    BaoCurlOnPublishCallback m_publishCallback = nullptr;
    void init();

    std::unique_ptr<const char[]> m_postdata;
};

class BaoCurlMulti {
public:
    BaoCurlMulti();
    ~BaoCurlMulti();
    void pushQueue(BaoCurl& curl);
    void start();

private:
    CURLM* m_pCURLM = nullptr;
    CURLMcode m_lastCode;
    uv_timer_t m_timeoutTimer;
    std::unordered_map<curl_socket_t, uv_poll_t*> m_socketMap;

    static int timerCallback(CURLM* multi, long timeout_ms, void* userp);
    static void socketCallback(uv_poll_t* handle, int status, int events);
    static int socketFunction(CURL* easy, curl_socket_t s, int action, void* userp, void* socketp);

    void processFinishedHandles();
};

struct PollContext {
    BaoCurlMulti* multi;
    curl_socket_t sockfd;
};

NAMESPACE_BAO_END

#endif // !_CURL_H
