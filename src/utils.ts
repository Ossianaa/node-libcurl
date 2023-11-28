import { LibCurl, LibCurlCookieAttrArray, LibCurlCookiesInfo, LibCurlGetCookiesOption } from "./libcurl";
import crypto from 'node:crypto'

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
                    value: decodeURIComponent(value),
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

export const libcurlRandomJA3Fingerprint: () => string = () => {
    //default use chrome fp
    const extensions = '0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-65037'.split('-');
    const randomBytes = crypto.getRandomValues(new Uint32Array(extensions.length))
    for (let i = randomBytes.length - 1; i >= 0; i--) {
        const pos = randomBytes[i] % (i + 1);
        [extensions[i], extensions[pos]] = [extensions[pos], extensions[i]]
    }
    return `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${extensions.join('-')}-21-41,29-23-24,0`
}

export const md5 = (e: string) => {
    const hasher = crypto.createHash('md5');
    hasher.update(e);
    return hasher.digest('hex');
}

export const getUriTopLevelHost = (uri: string | URL) => {
    const getHost = (e:string) => e.split('.').slice(-2).join('.')
    let uri_ = uri + '';
    if (uri_.startsWith('http')) {
        return getHost(new URL(uri).hostname)
    }
    return getHost(uri_)
}