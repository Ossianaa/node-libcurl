#define REQUEST_TLS_METHOD_THROW(env,className,methodName,reason) {\
    Napi::TypeError::New(##env,StringFormat("Failed to execute '%s' on '%s': %s",##methodName,##className,##reason)).ThrowAsJavaScriptException();\
    return (##env).Undefined();\
}

#define REQUEST_TLS_METHOD_ARGS_CHECK(env,className,methodName,needLen,getLen) {\
    if ( ##getLen !=  ##needLen){\
        Napi::TypeError::New(##env,StringFormat("Failed to execute '%s' on '%s': %d arguments required, but only %d present.",##methodName,##className,##needLen,##getLen)).ThrowAsJavaScriptException();\
        return (##env).Undefined();\
	}\
}

#define REQUEST_TLS_METHOD_ARGS_TOO_MUCH_CHECK(env,className,methodName,maxLen,getLen) {\
    if ( ##getLen >  ##maxLen){\
        Napi::TypeError::New(##env,StringFormat("Failed to execute '%s' on '%s': maximum of %d arguments required, but only %d present.",##methodName,##className,##maxLen,##getLen)).ThrowAsJavaScriptException();\
        return (##env).Undefined();\
	}\
}

#define REQUEST_TLS_METHOD_ARGS_NO_CONFIG(env,className,methodName,reqNums,getLen) {\
    Napi::TypeError::New(##env,StringFormat("Failed to execute '%s' on '%s': [%s] arguments required, but only %d present.",##methodName,##className,##reqNums,##getLen)).ThrowAsJavaScriptException();\
    return (##env).Undefined();\
}

#define REQUEST_TLS_METHOD_CHECK(env,condition,message) {\
    if (!(condition)){\
        Napi::TypeError::New(##env,##message).ThrowAsJavaScriptException();\
        return (##env).Undefined();\
	}\
}