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
    /* Hostname */
    /* Include subdomains */
    /* Path */
    /* Secure */
    /* Expiry in epoch time format. 0 == Session */
    /* Name */
    /* Value */
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

const getSubdomains = (domain: string) => {
    const subdomains = domain.split('.');
    const subdomainList = [];

    for (let i = 0; i < subdomains.length - 1; i++) {
        const domain_ = subdomains.slice(i).join('.');
        subdomainList.push(domain_);
        if (!domain_.startsWith('.')) {
            subdomainList.push(`.${domain_}`);
        }
    }
    return subdomainList;
}

export const cookieOptFilter = (cookieOpt: LibCurlGetCookiesOption) => {
    const domainArr = cookieOpt?.domain && getSubdomains(cookieOpt.domain);
    return (e: LibCurlCookieAttrArray) => {
        if (domainArr && !domainArr.find(t => e[0] === t))//设置了domain 找上级所有域名cookie 没设置就不过滤
            return false;
        if (cookieOpt?.path) {
            if (cookieOpt.path != e[2])
                return false;
        }
        return true;
    }
}


export const libcurlSetCookies = (curl: LibCurl, cookies: LibCurlCookiesInfo, domain: string) => {
    if (typeof cookies == 'string') {
        cookies
            .replace(/\s+/g, '')
            .split(';')
            .filter(Boolean)
            .map(e => {
                const pos = e.indexOf('=');
                return [e.slice(0, pos), e.slice(pos + 1, e.length)]
            })
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