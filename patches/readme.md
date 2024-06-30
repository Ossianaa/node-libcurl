## libcurl module patches

> Some of the patch reference [curl-impersonate](https://github.com/lwthiker/curl-impersonate)

## module version
|      module       | version |
| :-----------------: | :-----: |
| curl | [d755a5f7c009dd63a61b2c745180d8ba937cbfeb](https://github.com/curl/curl/tree/d755a5f7c009dd63a61b2c745180d8ba937cbfeb) |
|  boringssl  | [23824fa0fed94f4660ffafb15aaea8b317f2c8a6](https://github.com/google/boringssl/blob/23824fa0fed94f4660ffafb15aaea8b317f2c8a6)  |
|  nghttp2  | [05b792901933664e7aeb7ebb8c87db81123d484a](https://github.com/nghttp2/nghttp2/tree/05b792901933664e7aeb7ebb8c87db81123d484a)  |
| zlib | [04f42ceca40f73e2978b50e93806c2a18c1281fc](https://github.com/madler/zlib/tree/04f42ceca40f73e2978b50e93806c2a18c1281fc) |
| zstd  | [a58b48ef0e543980888a4d9d16c9072ff22135ca](https://github.com/facebook/zstd/tree/a58b48ef0e543980888a4d9d16c9072ff22135ca) |
|  brotli  | [71fe6cac061ac62c0241f410fbd43a04a6b4f303](https://github.com/google/brotli/tree/71fe6cac061ac62c0241f410fbd43a04a6b4f303)  |
------------

## docker build

```bash
docker build . -f Dockerfile-arm64-apple-darwin -t curl_arm64-apple-darwin

docker run --rm -v /path/to/your:/output curl_arm64-apple-darwin
```

Now `libcrypto.a` `libssl.a` `libzstd.a` `libcurl.a` are generated in `/path/to/your`.

### Windows
```bash
docker build . -f Dockerfile-x86_64-pc-windows-msvc -t curl_x86_64-pc-windows-msvc

docker run --rm -v /path/to/your:/home/wine/.wine/drive_c/output curl_x86_64-pc-windows-msvc
```

Now `libcurl.dll` `libcurl_imp.lib` are generated in `/path/to/your`.
