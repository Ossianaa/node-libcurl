import { LibCurl, LibCurlCookieAttrArray, LibCurlCookiesInfo, LibCurlGetCookiesOption } from "./libcurl";

export const httpCookiesToArray: (cookies: string) => LibCurlCookieAttrArray[] = (cookies) => {
    const stringBooleanToJsBoolean = (e: string) => {
        switch (e) {
            case 'TRUE':
                return true;
            case 'FALSE':
                return false;
            default:
                throw new Error(`unkonw type ${e}`)
        }
    }
    /*
     *          Domain         Secure  Path    CORS    TimeStamp       Name    Value
     * sample: .127.0.0.1      TRUE    /       FALSE   3000000000      a       b
     *         .127.0.0.1      TRUE    /api    FALSE   3000000000      c       d
     */
    const cookies_ = [];
    for (const it of cookies.split('\n')) {
        if (!it) {
            continue;
        }
        const [domain, secure, path, cors, timestamp, name, value] = it.split('\t');
        cookies_.push([domain.replace(/#HttpOnly_/i, ''), stringBooleanToJsBoolean(secure), path, stringBooleanToJsBoolean(cors), parseInt(timestamp), name, value])
    }
    return cookies_;
}

export const cookieOptFilter = (cookieOpt: LibCurlGetCookiesOption) => {
    return (e: LibCurlCookieAttrArray) => {
        if (cookieOpt) {
            if (cookieOpt.domain) {
                if (cookieOpt.domain != e[0])
                    return false;
            }
            if (cookieOpt.path) {
                if (cookieOpt.path != e[2])
                    return false;
            }
        }
        return true;
    }
}


export const libcurlSetCookies = (curl: LibCurl, cookies: LibCurlCookiesInfo, domain: string) => {
    if (typeof cookies == 'string') {
        cookies.replace(/\s+/g, '')
            .split(';')
            .reverse()//保证顺序不颠倒
            .map(e => e.split('=', 2))
            .forEach(([key, value]) => {
                curl.setCookie({
                    name: key,
                    value,
                    domain,
                    path: '/',
                })
            });
    } else {
        Object.keys(cookies).forEach(key => {
            curl.setCookie({
                name: key,
                value: cookies[key],
                domain,
                path: '/',
            });
        })
    }
}