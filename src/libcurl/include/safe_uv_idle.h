
#pragma once
#include "uv.h"

class SafeUvIdle {
public:
    SafeUvIdle(void* data, uv_idle_cb cb): _cb(cb) {
        _handle = new uv_idle_t;
        uv_idle_init(uv_default_loop(), _handle);
        _handle->data = data;
    }
    ~SafeUvIdle() {
        uv_close((uv_handle_t*)_handle, [](uv_handle_t* h) {
            delete (uv_idle_t*)h;
        });
    }

    void start() {
        _active = true;
        uv_idle_start(_handle, _cb);
    }

    void stop() {
        _active = false;
        uv_idle_stop(_handle);
    }

    bool isActive() {
        return _active;
    }

private:
    uv_idle_t* _handle;
    uv_idle_cb _cb;
    bool _active = false;
};
