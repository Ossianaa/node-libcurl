import {
    LibCurl,
    LibCurlCookieAttrArray,
    LibCurlCookiesInfo,
    LibCurlGetCookiesOption,
} from "./libcurl";
import crypto from "node:crypto";

export const httpCookiesToArray: (
    cookies: string,
) => LibCurlCookieAttrArray[] = (cookies) => {
    const stringBooleanToJsBoolean = (e: string) => {
        switch (e) {
            case "TRUE":
                return true;
            case "FALSE":
                return false;
            default:
                throw new Error(`unkonw type ${e}`);
        }
    };
    /* Hostname */
    /* Include subdomains */
    /* Path */
    /* Secure */
    /* Expiry in epoch time format. 0 == Session */
    /* Name */
    /* Value */
    const cookies_ = [];
    for (const it of cookies.split("\n")) {
        if (!it) {
            continue;
        }
        const [domain, secure, path, cors, timestamp, name, value] =
            it.split("\t");
        cookies_.push([
            domain.replace(/#HttpOnly_/i, ""),
            stringBooleanToJsBoolean(secure),
            path,
            stringBooleanToJsBoolean(cors),
            parseInt(timestamp),
            name,
            value,
        ]);
    }
    return cookies_;
};

const getSubdomains = (domain: string) => {
    const subdomains = domain.split(".");
    const subdomainList = [];

    for (let i = 0; i < subdomains.length - 1; i++) {
        const domain_ = subdomains.slice(i).join(".");
        subdomainList.push(domain_);
        if (!domain_.startsWith(".")) {
            subdomainList.push(`.${domain_}`);
        }
    }
    return subdomainList;
};

export const cookieOptFilter = (cookieOpt: LibCurlGetCookiesOption) => {
    const domainArr = cookieOpt?.domain && getSubdomains(cookieOpt.domain);
    return (e: LibCurlCookieAttrArray) => {
        if (domainArr && !domainArr.find((t) => e[0] === t))
            return false;
        if (cookieOpt?.path) {
            if (cookieOpt.path != e[2]) return false;
        }
        return true;
    };
};

export const libcurlSetCookies = (
    curl: LibCurl,
    cookies: LibCurlCookiesInfo,
    domain: string,
) => {
    if (typeof cookies == "string") {
        cookies
            .replace(/\s+/g, "")
            .split(";")
            .filter(Boolean)
            .map((e) => {
                const pos = e.indexOf("=");
                return [e.slice(0, pos), e.slice(pos + 1, e.length)];
            })
            .forEach(([key, value]) => {
                curl.setCookie({
                    name: key,
                    value: decodeURIComponent(value),
                    domain,
                    path: "/",
                });
            });
    } else {
        Object.keys(cookies).forEach((key) => {
            curl.setCookie({
                name: key,
                value: cookies[key],
                domain,
                path: "/",
            });
        });
    }
};

export const md5 = (e: string) => {
    const hasher = crypto.createHash("md5");
    hasher.update(e);
    return hasher.digest("hex");
};

export const getUriTopLevelHost = (uri: string | URL) => {
    const getHost = (e: string) => e.split(".").slice(-2).join(".");
    let uri_ = uri + "";
    if (uri_.startsWith("http")) {
        return getHost(new URL(uri).hostname);
    }
    return getHost(uri_);
};

export class CaseInsensitiveMap {
    private map: Map<
        string,
        {
            originalKey: string;
            value: string;
        }
    >;
    constructor() {
        this.map = new Map();
    }

    set(key: string, value: string) {
        const lowerKey = key.toLowerCase();
        this.map.set(lowerKey, { originalKey: key, value });
    }

    get(key: string) {
        const lowerKey = key.toLowerCase();
        const entry = this.map.get(lowerKey);
        return entry ? entry.value : undefined;
    }

    has(key: string) {
        return this.map.has(key.toLowerCase());
    }

    delete(key: string) {
        return this.map.delete(key.toLowerCase());
    }

    keys() {
        return Array.from(this.map.values()).map((entry) => entry.originalKey);
    }

    entries() {
        return Array.from(this.map.values()).map(({ originalKey, value }) => [
            originalKey,
            value,
        ]);
    }

    clear() {
        this.map.clear();
    }

    forEach(fn) {
        this.map.forEach((value, key) => fn(value.value, value.originalKey));
    }

    get size() {
        return this.map.size;
    }

    *[Symbol.iterator]() {
        for (const { originalKey, value } of this.map.values()) {
            yield [originalKey, value];
        }
    }
}

export const parseHeadersLine = (line) => {
    const match = line.match(/^([^:\r\n]+):\s*([\s\S]*)/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].replace(/^\s+|\s+$/g, "");
        if (key) {
            return { key, value };
        }
    }
    throw new Error(`parseHeadersLine error`);
};
