const { BaoLibCurl } = require('../scripts/bindings');
const { expect, assert, should } = require('chai');
const { host: unittestHost } = require('./server/server.js');

describe('BaoCurl.open', () => {
    it('arg check should throw error', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.open())
            .to.throw();
        expect(() => curl.open("GET"))
            .to.throw();
        expect(() => curl.open("GET", "", ""))
            .to.throw();
        expect(() => curl.open({}, ""))
            .to.throw();
        expect(() => curl.open("GET", null))
            .to.throw();
    });
    it('arg check should be ok', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.open("GET", "https://baidu.com"))
            .to.be.ok;
    })
});

describe("BaoCurl setRequestHeader/setRequestHeaders", () => {
    it('arg check should throw error', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.setRequestHeader())
            .to.throw();
        expect(() => curl.setRequestHeader(''))
            .to.throw();
        expect(() => curl.setRequestHeader('', ''))
            .to.throw();
        expect(() => curl.setRequestHeader(null, ''))
            .to.throw();
        expect(() => curl.setRequestHeader('', []))
            .to.throw();
        expect(() => curl.setRequestHeader('', '', ''))
            .to.throw();
        expect(() => curl.setRequestHeaders())
            .to.throw();
        expect(() => curl.setRequestHeaders(null))
            .to.throw();

    });
    it('arg check should be ok', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.setRequestHeader('a', ''))
            .to.ok;
        expect(() => curl.setRequestHeader('a', 'b'))
            .to.ok;
        expect(() => curl.setRequestHeaders(`a: b
        user-Agent: 111
        `)).to.ok;
    })
});

describe('BaoCurl setProxy', () => {
    it('arg check should throw error', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.setProxy())
            .to.throw();
        expect(() => curl.setProxy(null))
            .to.throw();
        expect(() => curl.setProxy("127.0.0.1:8888", ''))
            .to.throw();
        expect(() => curl.setProxy("127.0.0.1:8888", '', null))
            .to.throw();

    });
    it('arg check should be ok', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.setProxy("127.0.0.1:8888"))
            .to.ok;
        expect(() => curl.setProxy("127.0.0.1:8888", 'username', 'password'))
            .to.ok;
    })
})

describe('BaoCurl setTimeout', () => {
    it('arg check should throw error', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.setTimeout())
            .to.throw();
        expect(() => curl.setTimeout(null))
            .to.throw();
        expect(() => curl.setTimeout("1", ''))
            .to.throw();
        expect(() => curl.setTimeout(1500, {}))
            .to.throw();

    });
    it('arg check should be ok', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.setTimeout(15000, 15000))
            .to.ok;
    })
})

describe('BaoCurl setCookie', () => {
    it('arg check should throw error', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.setCookie())
            .to.throw();
        expect(() => curl.setCookie(null))
            .to.throw();
        expect(() => curl.setCookie("1", ''))
            .to.throw();
        expect(() => curl.setCookie('1', '1', null))
            .to.throw();

    });
    it('arg check should be ok', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.setCookie('a', 'b', '.baidu.com'))
            .to.ok;
    })
})


describe('BaoCurl removeCookie', () => {
    it('arg check should throw error', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.removeCookie())
            .to.throw();
        expect(() => curl.removeCookie(null))
            .to.throw();
        expect(() => curl.removeCookie("1"))
            .to.throw();
        expect(() => curl.removeCookie("1", null))
            .to.throw();

    });
    it('arg check should be ok', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.removeCookie('a', '.baidu.com'))
            .to.ok;
    })
})

describe('BaoCurl getCookies/getCookie/getResponseStatus/reset', () => {
    it('arg check should throw error', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.getCookie())
            .to.throw();
        expect(() => curl.getCookie(null))
            .to.throw();

    });
    it('arg check should be ok', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.getCookies())
            .to.ok;
        expect(() => curl.getCookie('a'))
            .to.ok;
        expect(() => curl.getResponseStatus())
            .to.ok;
        expect(() => curl.reset())
            .to.ok;
    })
})

describe('BaoCurl setRedirect/setHttpVersion', () => {
    it('arg check should throw error', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.setRedirect())
            .to.throw();
        expect(() => curl.setRedirect(1))
            .to.throw();
        expect(() => curl.setHttpVersion())
            .to.throw();
        expect(() => curl.setHttpVersion({}))
            .to.throw();
        expect(() => curl.setHttpVersion(3))
            .to.throw();
        expect(() => curl.setHttpVersion(2.1))
            .to.throw();

    });
    it('arg check should be ok', () => {
        const curl = new BaoLibCurl();
        expect(() => curl.setRedirect(true))
            .to.ok;
        expect(() => curl.setHttpVersion(1.1))
            .to.ok;
        expect(() => curl.setHttpVersion(2))
            .to.ok;
    })
})