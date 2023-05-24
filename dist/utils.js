"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUriTopLevelHost = exports.md5 = exports.libcurlRandomJA3Fingerprint = exports.libcurlSetCookies = exports.cookieOptFilter = exports.httpCookiesToArray = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
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
    const domainArr = cookieOpt?.domain && getSubdomains(cookieOpt.domain);
    return (e) => {
        if (domainArr && !domainArr.find(t => e[0] === t))
            return false;
        if (cookieOpt?.path) {
            if (cookieOpt.path != e[2])
                return false;
        }
        return true;
    };
};
exports.cookieOptFilter = cookieOptFilter;
const libcurlSetCookies = (curl, cookies, domain) => {
    if (typeof cookies == 'string') {
        cookies
            .replace(/\s+/g, '')
            .split(';')
            .filter(Boolean)
            .map(e => {
            const pos = e.indexOf('=');
            return [e.slice(0, pos), e.slice(pos + 1, e.length)];
        })
            .forEach(([key, value]) => {
            curl.setCookie({
                name: key,
                value: decodeURIComponent(value),
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
const libcurlRandomJA3Fingerprint = () => {
    const extensions = '0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513'.split('-');
    const randomBytes = node_crypto_1.default.getRandomValues(new Uint32Array(extensions.length));
    for (let i = randomBytes.length - 1; i >= 0; i--) {
        const pos = randomBytes[i] % (i + 1);
        [extensions[i], extensions[pos]] = [extensions[pos], extensions[i]];
    }
    return `771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,${extensions.join('-')}-21-41,29-23-24,0`;
};
exports.libcurlRandomJA3Fingerprint = libcurlRandomJA3Fingerprint;
const md5 = (e) => {
    const hasher = node_crypto_1.default.createHash('md5');
    hasher.update(e);
    return hasher.digest('hex');
};
exports.md5 = md5;
const getUriTopLevelHost = (uri) => {
    const getHost = (e) => e.split('.').slice(-2).join('.');
    let uri_ = uri + '';
    if (uri_.startsWith('http')) {
        return getHost(new URL(uri).hostname);
    }
    return getHost(uri_);
};
exports.getUriTopLevelHost = getUriTopLevelHost;
//# sourceMappingURL=utils.js.map