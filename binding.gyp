{
    'variables': {
        'libcurl_libraries%': '',
    },
    "targets": [
        {
            "target_name": "bao_curl_node_addon",
            "cflags!": [],
            "cflags_cc!": [],
            "sources": [
                "./src/libcurl/bao_curl_node_addon.cpp",
                "./src/libcurl/bao_curl.cpp",
                "./src/libcurl/utils.cpp",
                "./src/libcurl/curlAsyncWorker.cpp",
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
                                    'RuntimeLibrary': '2',
                                }
                            }
                        },
                        'Debug': {
                            'msvs_settings': {
                                'VCCLCompilerTool': {
                                    'RuntimeLibrary': '3',
                                }
                            }
                        },
                    },
                    'libraries': [
                        # "<(module_root_dir)/src/libcurl/lib/Debug/libcurl-d_imp.lib"
                        "<(module_root_dir)/src/libcurl/lib/Release/libcurl_imp.lib"
                    ],
                    "copies": [
                        # {
                        #     "destination": "<(module_root_dir)/build/Debug/",
                        #     "files": [
                        #         "<(module_root_dir)/src/libcurl/lib/Debug/libcurl-d.dll"
                        #     ]
                        # },
                        {
                            "destination": "<(module_root_dir)/build/Release/",
                            "files": [
                                "<(module_root_dir)/src/libcurl/lib/Release/libcurl.dll"
                            ]
                        }
                    ]

                }]
            ],

            # "configurations":{
            #     "Release": {
            #         "msvs_settings": {
            #             "VCCLCompilerTool": {
            #                 # 多线程 DLL (/MD)
            #                 #'RuntimeLibrary': '2',
            #                 'ExceptionHandling': '1',
            #                 'Optimization': 2,                  # /O2 safe optimization
            #                 'FavorSizeOrSpeed': 1,              # /Ot, favour speed over size
            #                 'InlineFunctionExpansion': 2,       # /Ob2, inline anything eligible
            #                 # /GL, whole program optimization, needed for LTCG
            #                 'WholeProgramOptimization': 'true',
            #                 'OmitFramePointers': 'true',
            #                 'EnableFunctionLevelLinking': 'true',
            #                 'EnableIntrinsicFunctions': 'true',
            #                 'AdditionalOptions':[
            #                 ]
            #             }
            #         }
            #     }
            # }
        }
    ]
}
