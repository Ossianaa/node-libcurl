#include "bao_curl_websocket.h"
#include <iostream>
#include <string.h>
#include <sstream>
// #include "sha1.h"

NAMESPACE_BAO_START

bool BaoCurlWebSocket::recv_wait()
{
    CURLcode curl_err;
    constexpr size_t bufsize = 1024;
    conn.resp.buf.clear();
    conn.resp.buf.reserve(bufsize);
    unsigned char buffer[bufsize];
    size_t received;
    bool recv_started = false;
    int recv_try_count = CURL_TIMEOUT * 2; // ms/500
    while (true)
    {
        if (!recv_started)
        {
            --recv_try_count;
            if (recv_try_count <= 0)
            {
                error_cb("error waiting for data");
                conn.resp.buf.clear();
                return false;
            }
        }
        received = 0;
        curl_err = curl_easy_recv(conn.curl, buffer, bufsize, &received);
        if (!recv_started)
        {
            recv_started = curl_err == CURLcode::CURLE_OK;
        }
        if (recv_started && curl_err)
        {
            break;
        }
        if (received > 0)
        {
            for (size_t bi = 0; bi < received; ++bi)
            {
                conn.resp.buf.push_back(buffer[bi]);
            }
        }
        if (!recv_started)
        {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }
    return true;
}

const std::string BaoCurlWebSocket::accept_header("Sec-WebSocket-Accept: ");
const std::string BaoCurlWebSocket::response_code_header("HTTP/1.1 ");

void BaoCurlWebSocket::default_open_cb()
{
}

void BaoCurlWebSocket::default_close_cb()
{
}
void BaoCurlWebSocket::default_error_cb(std::string message)
{
}

void BaoCurlWebSocket::default_message_cb(std::string received)
{
}

void BaoCurlWebSocket::close()
{
    if (conn.curl)
    {
        async = false;
        if (async_thread.joinable())
            async_thread.join();
        CURL *del = conn.curl;
        conn.curl = nullptr;
        curl_easy_cleanup(del);
        isClosed = true;
        close_cb();
    }
}

BaoCurlWebSocket::BaoCurlWebSocket(const std::string &uri,
                                   const std::string &protocol,
                                   std::function<void()> onopen,
                                   std::function<void()> onclose,
                                   std::function<void(std::string)> onerror,
                                   std::function<void(std::string)> onmessage)
    : conn(uri, protocol),
      open_cb(onopen ? onopen : default_open_cb),
      close_cb(onclose ? onclose : default_close_cb),
      error_cb(onerror ? onerror : default_error_cb),
      message_cb(onmessage ? onmessage : default_message_cb)
{
    async_thread = std::thread([this]()
                               {
        CURLcode curl_err;
        constexpr size_t bufsize = 1024;
        unsigned char buffer[bufsize];
        size_t received;
        static auto to_ms = std::chrono::milliseconds(CURL_ASYNC_TIMEOUT_MS);

        while (async) {
            received = 0;
            if (!conn.curl || !conn.resp.valid || conn.resp.connect_error) {
                std::this_thread::sleep_for(to_ms);
                continue;
            }
            
            curl_err = curl_easy_recv(conn.curl, buffer, bufsize, &received);
            if (curl_err == CURLE_AGAIN) {
                if (!async) break;
                std::this_thread::sleep_for(to_ms);
                continue;
            }
            if (curl_err) {
                error_cb(curl_easy_strerror(curl_err));
                break;
            }
            if (received > 0) {
                if ((conn.resp.buf.size() + received) < conn.resp.buf.capacity()) {
                    conn.resp.buf.reserve(conn.resp.buf.size() + bufsize);
                }
                for (size_t bi = 0; bi < received; ++bi) {
                    conn.resp.buf.push_back(buffer[bi]);
                }
            }
            if (conn.resp.buf.size() > 0) {
                size_t l;
                while ((l = WSocketFrame::frame_fullsize(conn.resp.buf.data(), conn.resp.buf.size())) > 0) {
                    if (l > conn.resp.buf.size()) {
                        break;
                    }
                    if (conn.resp.resframe.add_frame(conn.resp.buf.data(), l)) {
                        if (conn.resp.resframe.is_finished()) {
                            message_cb(conn.resp.resframe.to_string());
                            conn.resp.resframe.clear();
                        }
                    }
                    else {
                        error_cb(conn.resp.resframe.error());
                        conn.resp.resframe.clear();
                    }
                    conn.resp.buf.erase(conn.resp.buf.begin(), conn.resp.buf.begin() + static_cast<long>(l));
                }
            }
        } });
}

BaoCurlWebSocket::~BaoCurlWebSocket()
{

    close();
}

bool BaoCurlWebSocket::start()
{

    close();
    conn.curl = curl_easy_init();
    conn.resp.connect_error = true;
    conn.resp.valid = false;
    if (conn.curl)
    {
        conn.resp.connect_error = false;
        std::string uri = conn.get_uri();
        curl_easy_setopt(conn.curl, CURLOPT_URL, uri.c_str());
        curl_easy_setopt(conn.curl, CURLOPT_SSL_VERIFYPEER, 0L);
        curl_easy_setopt(conn.curl, CURLOPT_SSL_VERIFYHOST, 0L);
        curl_easy_setopt(conn.curl, CURLOPT_HTTPGET, 1);
        curl_easy_setopt(conn.curl, CURLOPT_CONNECT_ONLY, 1);
        curl_easy_setopt(conn.curl, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_easy_setopt(conn.curl, CURLOPT_VERBOSE, 1);
        curl_easy_setopt(conn.curl, CURLOPT_SSLVERSION, CURL_SSLVERSION_MAX_TLSv1_1 | CURL_SSLVERSION_MAX_TLSv1_2 | CURL_SSLVERSION_MAX_TLSv1_3);
        curl_easy_setopt(conn.curl, CURLOPT_SSL_CIPHER_LIST, "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA:AES256-SHA");
        curl_easy_setopt(conn.curl, CURLOPT_SSL_EC_CURVES, "X25519:P-256:P-384");
        curl_easy_setopt(conn.curl, CURLOPT_ACCEPT_ENCODING, "br, gzip, deflate");
        char tmp2[] = {
            25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0};

        curl_easy_setopt(conn.curl, CURLOPT_TLS_EXTENSION_PERMUTATION, tmp2);
        auto curl_err = curl_easy_perform(conn.curl);

        std::string conn_headers("GET ");
        conn_headers += conn.path + " HTTP/1.1\r\n";
        conn_headers += "Host: " + conn.host + "\r\n";
        conn_headers += "Connection: Upgrade\r\n";
        conn_headers += "Pragma: no-cache\r\n";
        conn_headers += "Cache-Control: no-cache\r\n";
        conn_headers += "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36\r\n";
        conn_headers += "Upgrade: websocket\r\n";
        conn_headers += std::string("Origin: ") + conn.get_origin() + "\r\n";
        conn_headers += "Sec-WebSocket-Version: 13\r\n";
        conn_headers += "Accept-Encoding: gzip, deflate\r\n";
        conn_headers += "Accept-Language: zh-CN,zh;q=0.9\r\n";
        conn_headers += "Cookie: no-alert3=true\r\n";
        conn_headers += "Sec-WebSocket-Key: ACU6xBVdSYwpx/tdyYT3IQ==\r\n";
        conn_headers += "Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits";
        conn_headers += "\r\n\r\n";

        size_t bytes_sent = 0;
        curl_err = curl_easy_send(conn.curl, conn_headers.c_str(), conn_headers.length(), &bytes_sent);
        if (curl_err != CURLE_OK)
        {
            this->error_cb(curl_easy_strerror(curl_err));
            conn.resp.connect_error = true;
        }
        else
        {
            if (recv_wait())
            {
                std::string headers = std::string(reinterpret_cast<char *>(conn.resp.buf.data()), conn.resp.buf.size());
                std::istringstream ifs(headers);
                conn.resp.valid = headers.substr(response_code_header.length(), 3) == "101";
                if (conn.resp.valid)
                {
                    this->isClosed=false;
                    open_cb();
                    std::string buf = headers.substr(headers.find("\r\n\r\n") + 4);
                    if (buf.size() > 0)
                    {
                        size_t l;
                        const unsigned char *data = reinterpret_cast<const unsigned char *>(buf.data());
                        while ((l = WSocketFrame::frame_fullsize(data, buf.size())) > 0)
                        {
                            if (l > buf.size())
                            {
                                break;
                            }
                            if (conn.resp.resframe.add_frame(data, l))
                            {
                                if (conn.resp.resframe.is_finished())
                                {
                                    message_cb(conn.resp.resframe.to_string());
                                    conn.resp.resframe.clear();
                                }
                            }
                            else
                            {
                                error_cb(conn.resp.resframe.error());
                                conn.resp.resframe.clear();
                            }
                            buf.erase(buf.begin(), buf.begin() + static_cast<long>(l));
                        }
                    }
                }
            }
        }
    }
    conn.resp.buf.clear();
    bool ret = conn.resp.valid && !conn.resp.connect_error;

    if (!ret)
    {
        close();
    }
    return ret;
}

bool BaoCurlWebSocket::send(const std::string &data)
{
    if (conn.curl == nullptr)
    {
        error_cb("No connection");
        return false;
    }
    size_t bytes_sent = 0;
    CURLcode curl_err;
    WSocketFrames frames(WSocketFrame::FRAME_TYPE::TEXT_FRAME, reinterpret_cast<const unsigned char *>(data.c_str()), data.length());
    for (auto &frame : frames.getdata())
    {
        bytes_sent = 0;
        curl_err = curl_easy_send(conn.curl, frame.first, frame.second, &bytes_sent);
        if (curl_err != CURLE_OK)
        {
            error_cb(curl_easy_strerror(curl_err));
        }
        if (bytes_sent != frame.second)
        {
            error_cb("Write to socket error (writed " + std::to_string(bytes_sent) + "/" + std::to_string(frame.second) + ")");
        }
    }
    return true;
}

ConnectionInfo::ConnectionInfo(const std::string &uri, const std::string &protocol)
    : curl(nullptr), protocol(protocol)
{
    valid = false;
    size_t pos = uri.find(':');
    if (pos == std::string::npos)
        return;
    std::string scheme = uri.substr(0, pos);
    if (scheme == "ws")
    {
        ssl = false;
    }
    else if (scheme == "wss")
    {
        ssl = true;
    }
    else
    {
        return;
    }
    pos += 3; // ://
    size_t nextpos = uri.find('/', pos);
    host = uri.substr(pos, nextpos - pos);
    if (nextpos == std::string::npos)
    {
        path = "/";
    }
    else
    {
        path = uri.substr(nextpos);
    }
    valid = true;
    /*std::srand(static_cast<unsigned>(std::time(nullptr)));
    std::stringstream stream;
    std::uppercase(stream);
    int sz2len = sizeof(int) * 2;
    for (int i = 0; i < 4; ++i) {
        stream << std::setfill('0') << std::setw(sz2len) << std::hex << std::rand();
    }
    guid = stream.str();
    pos = 8;
    guid.insert(pos, "-");
    pos += 5;
    guid.insert(pos, "-");
    pos += 5;
    guid.insert(pos, "-");
    pos += 5;
    guid.insert(pos, "-");
    guid = cppcodec::base64_rfc4648::encode(guid.c_str(), guid.length());*/
    guid = "jtxFTyci3o4lcxmZFbFR8g==";
    // std::string answ = guid + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    // sha1::calc(answ.c_str(), static_cast<int>(answ.length()), ws_accept);
}

std::string ConnectionInfo::get_key()
{
    return std::string("Sec-WebSocket-Key: ") + guid;
}

std::string ConnectionInfo::get_uri()
{
    std::string uri(ssl ? "https://" : "http://");
    return uri + host + path;
}

std::string ConnectionInfo::get_origin()
{
    std::string origin("Origin: ");
    return origin + get_uri();
}

std::string ConnectionInfo::get_protocol()
{
    std::string proto("Sec-WebSocket-Protocol: ");
    return proto + protocol;
}

NAMESPACE_BAO_END