#include "bao_curl_websocket_frames.h"
#include <cstring>
#include <cstdlib>
#include <ctime>

#define SPACESYMBOLS " \t\n\r\x0B"

NAMESPACE_BAO_START

template <typename T>
T swaporder(T in) {
    T out;
    uint8_t* inbuf = reinterpret_cast<uint8_t*>(&in);
    uint8_t* oubuf = reinterpret_cast<uint8_t*>(&out);
    size_t ousize = sizeof(T);
    size_t oui = ousize - 1;
    for (size_t ini = 0; ini < ousize; ++ini) {
        oubuf[oui--] = inbuf[ini];
    }
    return out;
}

std::string& trimmed(std::string& str) {
    auto pos1 = str.find_first_not_of(SPACESYMBOLS);
    if (pos1 == std::string::npos) pos1 = 0;
    auto pos2 = str.find_last_not_of(SPACESYMBOLS);
    str = str.substr(pos1, pos2 - pos1 + 1);
    return str;
}

WSocketFrames::WSocketFrames(WSocketFrame::FRAME_TYPE type, const unsigned char* data, size_t len)
{
    this->type = type;
    bool need_mask = true;
    fin = true;
    if (len > 0x400000) {
        size_t cur_pos = 0;
        size_t cur_len = 0x400000;
        while (true) {
            fin = (cur_pos + cur_len) == len;
            this->data.push_back(WSocketFrame::getframe(cur_pos == 0 ? type : WSocketFrame::FRAME_TYPE::CONTTINUATION_FRAME, fin, need_mask, data + cur_pos, cur_len));
            cur_pos += cur_len;
            if (cur_pos >= len) break;
            if ((len - cur_pos) > cur_len) {
                cur_len = len - cur_pos;
            }
        }
        return;
    }
    this->data.push_back(WSocketFrame::getframe(type, fin, need_mask, data, len));
}

WSocketFrames::WSocketFrames()
    : fin(false), type(WSocketFrame::FRAME_TYPE::CONNECTION_CLOSE_FRAME)
{

}

std::vector<std::pair<unsigned char*, size_t> > WSocketFrames::getdata()
{
    std::vector<std::pair<unsigned char*, size_t>> ret;
    for (auto& v : data) {
        ret.push_back({ v.first.get(), v.second });
    }
    return ret;
}

std::string WSocketFrames::to_string()
{
    std::string ret;
    for (auto& v : data) {
        ret += std::string(reinterpret_cast<char*>(v.first.get()), v.second);
    }
    return ret;
}

FrameData WSocketFrames::to_binary()
{
    FrameData rdata;
    rdata.second = 0;
    for (auto& v : data) {
        rdata.second += v.second;
    }
    if (rdata.second > 0) {
        rdata.first = std::unique_ptr<unsigned char[]>(new unsigned char[rdata.second]);
        size_t curdif = 0;
        for (auto& v : data) {
            memcpy(rdata.first.get() + curdif, v.first.get(), v.second);
            curdif += v.second;
        }
    }
    return rdata;
}

bool WSocketFrames::add_frame(const unsigned char* data, size_t len)
{
    bool ok = false;
    WSocketFrame frame(data, len, ok, err);
    if (this->data.empty() ||
        (!fin && (type == frame.get_type() || frame.get_type() == WSocketFrame::FRAME_TYPE::CONTTINUATION_FRAME))) {

        type = frame.get_type();
        fin = frame.is_final();
        this->data.push_back(frame.frame());
        return ok;
    }
    return false;
}

void WSocketFrames::clear()
{
    data.clear();
    fin = false;
}

std::string WSocketFrames::error()
{
    return err;
}

bool WSocketFrame::is_type(WSocketFrame::FRAME_TYPE type, unsigned char t)
{
    unsigned char tt = 0xff;
    switch (type) {
    case WSocketFrame::FRAME_TYPE::CONTTINUATION_FRAME:
        tt = static_cast<unsigned char>(HDR_VALUES::HDR_CONTTINUATION_FRAME);
        break;
    case WSocketFrame::FRAME_TYPE::CONNECTION_CLOSE_FRAME:
        tt = static_cast<unsigned char>(HDR_VALUES::HDR_CONNECTION_CLOSE_FRAME);
        break;
    case WSocketFrame::FRAME_TYPE::PING_FRAME:
        tt = static_cast<unsigned char>(HDR_VALUES::HDR_PING_FRAME);
        break;
    case WSocketFrame::FRAME_TYPE::PONG_FRAME:
        tt = static_cast<unsigned char>(HDR_VALUES::HDR_PONG_FRAME);
        break;
    case WSocketFrame::FRAME_TYPE::TEXT_FRAME:
        tt = static_cast<unsigned char>(HDR_VALUES::HDR_TEXT_FRAME);
        break;
    case WSocketFrame::FRAME_TYPE::BINARY_FRAME:
        tt = static_cast<unsigned char>(HDR_VALUES::HDR_BINARY_FRAME);
        break;
    }
    return (t & tt) == tt;
}

size_t WSocketFrame::frame_fullsize(const unsigned char* indata, size_t indata_len)
{
    auto fssp = frame_startposition_size(indata, indata_len);
    return fssp.first + fssp.second;
}

std::pair<size_t, size_t> WSocketFrame::frame_startposition_size(const unsigned char* indata, size_t indata_len)
{
    if (indata_len < 2) {
        return { 0,0 };
    }
    std::pair<size_t, size_t> ret{ 0,0 };
    unsigned char standart_len = indata[1];
    size_t startpos = 2;
    standart_len = standart_len & static_cast<unsigned char>(HDR_VALUES::HDR_RMASK_LEN);
    if (standart_len <= 125) {
        ret.first = startpos;
        ret.second = standart_len;
    }
    else if (standart_len == 126) {
        const uint16_t* data16 = reinterpret_cast<const uint16_t*>(indata + startpos);
        startpos += 2;
        ret.first = startpos;
        ret.second = swaporder<uint16_t>(data16[0]);
    }
    else {
        const uint64_t* data64 = reinterpret_cast<const uint64_t*>(indata + startpos);
        startpos += 8;
        ret.first = startpos;
        ret.second = swaporder<uint64_t>(data64[0]);
    }
    if (ret.second > indata_len)
        return { 0,0 };
    return ret;
}

WSocketFrame::WSocketFrame(WSocketFrame::FRAME_TYPE type, bool final, bool ismask, const unsigned char* indata, size_t indata_len)
{
    this->type = type;
    this->isfinal = final;
    this->ismask = ismask;
    std::srand(static_cast<unsigned>(std::time(nullptr)));
    data_len = 2;
    size_t ext_len = 0;
    size_t masklen = ismask ? 4 : 0;
    if ((indata_len + masklen) > 125) {
        if ((indata_len + masklen + 2/*extlen*/) > 0x7fffff) ext_len = 8;
        else ext_len = 2;
    }
    switch (type) {
    case WSocketFrame::FRAME_TYPE::CONTTINUATION_FRAME:
    case WSocketFrame::FRAME_TYPE::CONNECTION_CLOSE_FRAME:
    case WSocketFrame::FRAME_TYPE::PING_FRAME:
    case WSocketFrame::FRAME_TYPE::PONG_FRAME:
        break;
    case WSocketFrame::FRAME_TYPE::TEXT_FRAME:
    case WSocketFrame::FRAME_TYPE::BINARY_FRAME:
        data_len += ext_len + masklen + indata_len;
        break;
    }
    data = std::unique_ptr<unsigned char[]>(new unsigned char[data_len]);
    unsigned char frrr_opcode = 0;
    if (final) frrr_opcode |= static_cast<unsigned char>(HDR_VALUES::HDR_FIN);
    switch (type) {
    case WSocketFrame::FRAME_TYPE::CONTTINUATION_FRAME:
        frrr_opcode |= static_cast<unsigned char>(HDR_VALUES::HDR_CONTTINUATION_FRAME);
        break;
    case WSocketFrame::FRAME_TYPE::CONNECTION_CLOSE_FRAME:
        frrr_opcode |= static_cast<unsigned char>(HDR_VALUES::HDR_CONNECTION_CLOSE_FRAME);
        break;
    case WSocketFrame::FRAME_TYPE::PING_FRAME:
        frrr_opcode |= static_cast<unsigned char>(HDR_VALUES::HDR_PING_FRAME);
        break;
    case WSocketFrame::FRAME_TYPE::PONG_FRAME:
        frrr_opcode |= static_cast<unsigned char>(HDR_VALUES::HDR_PONG_FRAME);
        break;
    case WSocketFrame::FRAME_TYPE::TEXT_FRAME:
        frrr_opcode |= static_cast<unsigned char>(HDR_VALUES::HDR_TEXT_FRAME);
        break;
    case WSocketFrame::FRAME_TYPE::BINARY_FRAME:
        frrr_opcode |= static_cast<unsigned char>(HDR_VALUES::HDR_BINARY_FRAME);
        break;
    }
    data.get()[0] = frrr_opcode;
    if (type == WSocketFrame::FRAME_TYPE::CONNECTION_CLOSE_FRAME ||
        type == WSocketFrame::FRAME_TYPE::PING_FRAME ||
        type == WSocketFrame::FRAME_TYPE::PONG_FRAME ||
        indata_len == 0)
    {
        data.get()[1] = 0;
        return; // no data
    }
    size_t difpos = 2;
    if (ext_len == 0) {
        data.get()[1] = static_cast<unsigned char>(indata_len);
    }
    if (ext_len == 2) {
        data.get()[1] = 0x7e;
        uint16_t* data16 = reinterpret_cast<uint16_t*>(data.get() + difpos);
        data16[0] = swaporder<uint16_t>(static_cast<uint16_t>(indata_len));
    }
    else if (ext_len == 8) {
        data.get()[1] = 0x7f;
        uint64_t* data64 = reinterpret_cast<uint64_t*>(data.get() + difpos);
        data64[0] = swaporder<uint64_t>(static_cast<uint64_t>(indata_len));
    }
    if (ismask) {
        data.get()[1] |= static_cast<unsigned char>(HDR_VALUES::HDR_MASK_FRAME); // masked data
    }
    difpos += ext_len;

    if (ismask) {
        uint32_t mask = static_cast<unsigned int>(std::rand());
        uint32_t* data32 = reinterpret_cast<uint32_t*>(data.get() + difpos);
        data32[0] = mask;
        difpos += masklen;
    }
    unsigned char* data8 = data.get() + difpos;
    memcpy(data8, indata, indata_len);
    if (ismask) {
        unsigned char* mask8 = data.get() + difpos - masklen;
        for (size_t i = 0; i < indata_len; ++i) {
            size_t j = i % 4;
            data8[i] = data8[i] ^ mask8[j]; // mask data
        }
    }
}

WSocketFrame::WSocketFrame(const unsigned char* indata, size_t indata_len, bool& ok, std::string& err)
{
    auto fssp = frame_startposition_size(indata, indata_len);
    data_len = 0;
    if (fssp.second < 2) {
        ok = false;
        err = "Length data error (" + std::to_string(fssp.second) + ")";
        return;
    }
    ismask = (indata[1] & static_cast<unsigned char>(HDR_VALUES::HDR_MASK_FRAME)) != 0;
    isfinal = (indata[0] & static_cast<unsigned char>(HDR_VALUES::HDR_FIN)) != 0;
    if (is_type(FRAME_TYPE::PING_FRAME, indata[0])) {
        type = FRAME_TYPE::PING_FRAME;
        return;
    }
    else if (is_type(FRAME_TYPE::PONG_FRAME, indata[0])) {
        type = FRAME_TYPE::PONG_FRAME;
        return;
    }
    else if (is_type(FRAME_TYPE::CONNECTION_CLOSE_FRAME, indata[0])) {
        type = FRAME_TYPE::CONNECTION_CLOSE_FRAME;
        return;
    }
    else if (is_type(FRAME_TYPE::TEXT_FRAME, indata[0])) {
        type = FRAME_TYPE::TEXT_FRAME;
    }
    else if (is_type(FRAME_TYPE::BINARY_FRAME, indata[0])) {
        type = FRAME_TYPE::BINARY_FRAME;
    }
    else if (is_type(FRAME_TYPE::CONTTINUATION_FRAME, indata[0])) {
        type = FRAME_TYPE::CONTTINUATION_FRAME;
    }
    if (ismask && fssp.second < 4) {
        ok = false;
        err = "Length data+mask error (" + std::to_string(fssp.second) + ")";
        return;
    }
    size_t datalen = fssp.second;
    if (datalen == 0) return;
    data = std::unique_ptr<unsigned char[]>(new unsigned char[datalen]);
    data_len = datalen;
    memcpy(data.get(), indata + fssp.first + (ismask ? 4 : 0), datalen);
    if (ismask) {
        const unsigned char* mask8 = indata + fssp.first;
        for (size_t i = 0; i < datalen; ++i) {
            size_t j = i % 4;
            data.get()[i] = data.get()[i] ^ mask8[j]; // mask data
        }
    }
    ok = true;
}

FrameData WSocketFrame::frame()
{
    return { std::move(data), data_len };
}

FrameData WSocketFrame::getframe(WSocketFrame::FRAME_TYPE type, bool final, bool ismask, const unsigned char* indata, size_t indata_len)
{
    WSocketFrame wsf(type, final, ismask, indata, indata_len);
    return wsf.frame();
}

NAMESPACE_BAO_END