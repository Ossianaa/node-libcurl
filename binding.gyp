{
    "targets": [
        {
            "target_name": "bao_curl_node_addon",
           
            "sources": [
                "./src/libcurl/bao_curl_node_addon.cpp",
                "./src/libcurl/bao_curl.cpp",
                "./src/libcurl/bao_curl_multi.cpp",
                "./src/libcurl/bao_curl_websocket.cpp",
                "./src/libcurl/async_worker_websocket.cpp",
                "./src/libcurl/utils.cpp",
            ],
            "include_dirs": [
                "<!@(node -p \"require('node-addon-api').include\")",
                "./src/libcurl/include"
            ],
            'defines': ["NAPI_CPP_EXCEPTIONS",
                        "CURL_STATICLIB",
                        "NGHTTP2_STATICLIB"],
            'conditions':[
                ['OS=="win"', {

                    "configurations": {
                        'Release': {
                            'msvs_settings': {
                                'VCCLCompilerTool': {
                                    'DisableSpecificWarnings':['4530','4819'],
                                    'RuntimeLibrary': '1',
                                }
                            }
                        },
                        'Debug': {
                            'msvs_settings': {
                                'VCCLCompilerTool': {
                                    'DisableSpecificWarnings':['4530','4819'],
                                    'RuntimeLibrary': '3',
                                }
                            }
                        },
                    },
                    'libraries': [
                        # "<(module_root_dir)/lib/Debug/libcurl-d_imp.lib"
                        "<(module_root_dir)/lib/Release/win32-x64/libcurl_imp.lib"
                    ],
                    "copies": [
                        # {
                        #     "destination": "<(module_root_dir)/build/Debug/",
                        #     "files": [
                        #         "<(module_root_dir)/lib/Debug/libcurl-d.dll"
                        #     ]
                        # },
                        {
                            "destination": "<(module_root_dir)/build/Release/",
                            "files": [
                                "<(module_root_dir)/lib/Release/win32-x64/libcurl.dll"
                            ]
                        }
                    ]

                }],
                ['OS=="linux"', {

                    "configurations": {
                        'Release': {
                            'cflags': [ '-std=c++14', '-fexceptions', '-frtti', '-Wno-deprecated', '-Wno-unused-variable', '-Wno-unused-but-set-variable', '-Wno-maybe-uninitialized', '-Wno-sign-compare', '-Wno-reorder', '-Wno-extra', '-Wno-switch' ,'-fPIC'],
                            'cflags_cc': [ '-std=c++14', '-fexceptions', '-frtti', '-Wno-deprecated', '-Wno-unused-variable', '-Wno-unused-but-set-variable', '-Wno-maybe-uninitialized', '-Wno-sign-compare', '-Wno-reorder', '-Wno-extra', '-Wno-switch','-fPIC']
                        },
                        'Debug': {
                            
                        },
                    },
                    'libraries': [
                        "<(module_root_dir)/lib/Release/linux-x64/libcurl.a",
                        "<(module_root_dir)/lib/Release/linux-x64/libssl.a",
                        "<(module_root_dir)/lib/Release/linux-x64/libcrypto.a"
                    ],
                
                }],
                ['OS=="mac"', {
                    "configurations": {
                        'Release': {
                            'cflags': [ '-std=c++14', '-fexceptions', '-frtti', '-Wno-deprecated', '-Wno-unused-variable', '-Wno-unused-but-set-variable', '-Wno-maybe-uninitialized', '-Wno-sign-compare', '-Wno-reorder', '-Wno-extra', '-Wno-switch' ,'-fPIC'],
                            'cflags_cc': [ '-std=c++14', '-fexceptions', '-frtti', '-Wno-deprecated', '-Wno-unused-variable', '-Wno-unused-but-set-variable', '-Wno-maybe-uninitialized', '-Wno-sign-compare', '-Wno-reorder', '-Wno-extra', '-Wno-switch','-fPIC'],
                        },
                    },
                    'libraries': [
                        "/System/Library/Frameworks/CoreFoundation.framework",
                        "/System/Library/Frameworks/SystemConfiguration.framework",
                        "<(module_root_dir)/lib/Release/darwin-x64/libcurl.a",
                        "<(module_root_dir)/lib/Release/darwin-x64/libssl.a",
                        "<(module_root_dir)/lib/Release/darwin-x64/libcrypto.a"
                    ],
                    'xcode_settings': {
                        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
                        'CLANG_CXX_LIBRARY': 'libc++',
                        'MACOSX_DEPLOYMENT_TARGET': '10.7',
                    },
                }]
            ],
        }
    ]
}
