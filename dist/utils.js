"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.libcurlSetCookies = exports.cookieOptFilter = exports.httpCookiesToArray = void 0;
const httpCookiesToArray = (cookies) => {
    const stringBooleanToJsBoolean = (e) => {
        switch (e) {
            case 'TRUE':
                return true;
            case 'FALSE':
                return false;
            default:
                throw new Error(`unkonw type ${e}`);
        }
    };
    const cookies_ = [];
    for (const it of cookies.split('\n')) {
        if (!it) {
            continue;
        }
        const [domain, secure, path, cors, timestamp, name, value] = it.split('\t');
        cookies_.push([domain.replace(/#HttpOnly_/i, ''), stringBooleanToJsBoolean(secure), path, stringBooleanToJsBoolean(cors), parseInt(timestamp), name, value]);
    }
    return cookies_;
};
exports.httpCookiesToArray = httpCookiesToArray;
const getSubdomains = (domain) => {
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
};
const cookieOptFilter = (cookieOpt) => {
    const domainArr = (cookieOpt === null || cookieOpt === void 0 ? void 0 : cookieOpt.domain) ? getSubdomains(cookieOpt.domain) : void 0;
    return (e) => {
        if (domainArr && !domainArr.find(t => e[0] === t))
            return false;
        if (cookieOpt === null || cookieOpt === void 0 ? void 0 : cookieOpt.path) {
            if (cookieOpt.path != e[2])
                return false;
        }
        return true;
    };
};
exports.cookieOptFilter = cookieOptFilter;
const libcurlSetCookies = (curl, cookies, domain) => {
    if (typeof cookies == 'string') {
        cookies.replace(/\s+/g, '')
            .split(';')
            .reverse()
            .map(e => e.split('=', 2))
            .forEach(([key, value]) => {
            curl.setCookie({
                name: key,
                value,
                domain,
                path: '/',
            });
        });
    }
    else {
        Object.keys(cookies).forEach(key => {
            curl.setCookie({
                name: key,
                value: cookies[key],
                domain,
                path: '/',
            });
        });
    }
};
exports.libcurlSetCookies = libcurlSetCookies;
//# sourceMappingURL=utils.js.map