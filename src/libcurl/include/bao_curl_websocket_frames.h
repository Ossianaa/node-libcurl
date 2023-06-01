#pragma once
#include <string>
#include <vector>
#include <memory>
#include "utils.h"

NAMESPACE_BAO_START

std::string& trimmed(std::string& str);

using FrameData = std::pair<std::unique_ptr<unsigned char[]>, size_t>;

class WSocketFrame {
public:
    enum class HDR_VALUES : unsigned char {
        HDR_FIN = 0x1,
        HDR_RSV1 = 0x2,
        HDR_RSV2 = 0x4,
        HDR_RSV3 = 0x8,
        HDR_CONTTINUATION_FRAME = 0x0,  // %x0 denotes a continuation frame
        HDR_TEXT_FRAME = 0x80, // %x1 denotes a text frame
        HDR_BINARY_FRAME = 0x40, // %x2 denotes a binary frame
        // 0x30 - 0x70 are reserved for further non-control frames
        HDR_CONNECTION_CLOSE_FRAME = 0x10, // %x8 denotes a connection close
        HDR_PING_FRAME = 0x90, // %x9 denotes a ping
        HDR_PONG_FRAME = 0x50, // %xA denotes a pong
        // 0xB0 - 0xF0 are reserved for further control frames
        HDR_MASK_FRAME = 0x80,
        HDR_RMASK_LEN = 0x7f
    };
    enum class FRAME_TYPE {
        CONTTINUATION_FRAME,
        TEXT_FRAME,
        BINARY_FRAME,
        CONNECTION_CLOSE_FRAME,
        PING_FRAME,
        PONG_FRAME,
    };
private:
    std::unique_ptr<unsigned char[]> data;
    size_t data_len;
    FRAME_TYPE type;
    bool isfinal, ismask;
    bool is_type(FRAME_TYPE type, unsigned char t);
public:
    static size_t frame_fullsize(const unsigned char* indata = nullptr, size_t indata_len = 0);
    static std::pair<size_t, size_t> frame_startposition_size(const unsigned char* indata = nullptr, size_t indata_len = 0);
    WSocketFrame(FRAME_TYPE type, bool final = true, bool ismask = true, const unsigned char* indata = nullptr, size_t indata_len = 0);
    WSocketFrame(const unsigned char* indata, size_t indata_len, bool& ok, std::string& err);
    bool is_final() { return isfinal; }
    bool is_masked() { return ismask; }
    FRAME_TYPE get_type() { return type; }
    FrameData frame();
    static FrameData getframe(FRAME_TYPE type, bool final = true, bool ismask = true, const unsigned char* indata = nullptr, size_t indata_len = 0);
};

class WSocketFrames
{
    std::vector<FrameData> data;
    bool fin;
    std::string err;
    WSocketFrame::FRAME_TYPE type;
public:
    WSocketFrames(WSocketFrame::FRAME_TYPE type, const unsigned char* data, size_t len);
    WSocketFrames();
    std::vector<std::pair<unsigned char*, size_t>> getdata();
    std::string to_string();
    FrameData to_binary();
    bool add_frame(const unsigned char* data, size_t len);
    bool is_finished() { return fin; }
    void clear();
    std::string error();
};
NAMESPACE_BAO_END
