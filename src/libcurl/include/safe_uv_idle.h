#pragma once
#include "uv.h"

class SafeUvIdle {
public:
    SafeUvIdle(void* data, uv_idle_cb cb)
        : _cb(cb), _handle(new uv_idle_t)
    {
        if (!_handle) return;

        int ret = uv_idle_init(uv_default_loop(), _handle);
        if (ret != 0) {
            delete _handle;
            _handle = nullptr;
            return;
        }
        _handle->data = data;
    }

    ~SafeUvIdle() {
        if (!_handle) return;

        stop();
        uv_close((uv_handle_t*)_handle, [](uv_handle_t* h) {
            delete (uv_idle_t*)h;
        });
    }

    bool start() {
        if (!_handle || _active) return false;

        int ret = uv_idle_start(_handle, _cb);
        _active = (ret == 0);
        return _active;
    }

    void stop() {
        if (!_handle || !_active) return;

        uv_idle_stop(_handle);
        _active = false;
    }

    bool isActive() const {
        return _active;
    }
    bool isValid() const {
        return _handle != nullptr;
    }

private:
    uv_idle_t* _handle;
    uv_idle_cb _cb;
    bool _active = false;

    SafeUvIdle(const SafeUvIdle&) = delete;
    SafeUvIdle& operator=(const SafeUvIdle&) = delete;
};