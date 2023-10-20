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

describe('BaoCurl mix test', () => {
    it('check setRequestHeader validatiy', () => {
        const curl = new BaoLibCurl();
        curl.open("GET", `${unittestHost}/unittest/getRawHeaders`);
        curl.setRequestHeader('a', 'b');
        curl.send();
        const rawHeaders = JSON.parse(curl.getResponseString());

        expect(rawHeaders).to.own.include({ 'a': 'b' });
    })
    it('check setRequestHeaders validatiy', () => {
        const curl = new BaoLibCurl();
        curl.open("GET", `${unittestHost}/unittest/getRawHeaders`);
        curl.setRequestHeaders(
            `a: b
user-Agent: myUa####111
`);
        curl.send();
        const rawHeaders = JSON.parse(curl.getResponseString());
        expect(rawHeaders.hasOwnProperty('a')).to.be.equal(true);
        expect(rawHeaders['a']).to.be.equal('b');

        expect(rawHeaders).to.have.own.property('user-agent');
        expect(rawHeaders['user-agent']).to.be.equal('myUa####111');
    })
    /* it('check setProxy validatiy', () => {
        const curl = new BaoLibCurl();
        curl.setProxy("127.0.0.1:10512")
        curl.open("GET", `${unittestHost}/unittest/getIp`);
        curl.send();
        const ip = curl.getResponseString();
        expect(ip).to.be.equal("127.0.0.1");
    }) */
    /* it('check timeout validatiy', () => {
        const curl = new BaoLibCurl();
        const maxTimeDelay = 4;
        curl.setTimeout(2, maxTimeDelay)
        curl.open("GET", `${unittestHost}/unittest/setTimeout?${new URLSearchParams({
            timeout: maxTimeDelay
        })}`);
        curl.send();
        expect(curl.getResponseStatus()).to.be.equal(0);
        expect(curl.getResponseString()).to.be.equal('');
    }) */
    it('check POST string body validatiy', () => {
        const curl = new BaoLibCurl();
        const body = "222AAA:::##";
        curl.open("POST", `${unittestHost}/unittest/getRawContent`);
        curl.setRequestHeader('Content-Type', 'application/octet-stream')
        curl.send(body);
        const stringRawContent = curl.getResponseString();
        expect(stringRawContent).to.be.equal(body);
    })
    it('check POST typedarray body validatiy', () => {
        const curl = new BaoLibCurl();
        const body = new Uint8Array([
            11, 22, 33, 44, 255
        ]);
        curl.open("POST", `${unittestHost}/unittest/getRawContent`);
        curl.setRequestHeader('Content-Type', 'application/octet-stream')
        curl.send(body);
        const u8buffer = curl.getResponseBody();
        expect(u8buffer).to.be.an('uint8array');
        expect(u8buffer).to.be.eql(body);
    })
    it('check POST formdata body validatiy', () => {
        const curl = new BaoLibCurl();
        const body = "a=b&c=d";
        curl.open("POST", `${unittestHost}/unittest/getRawContent`);
        curl.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        curl.send(body);
        const str = curl.getResponseString();
        expect(str).to.be.an('string');
        expect(str).to.be.eql(JSON.stringify(Object.fromEntries(new URLSearchParams(body))));
    })
    it('check POST without string or typedarray body then convert json string validatiy', () => {
        const curl = new BaoLibCurl();
        {
            const body = {
                a: 1,
                b: [
                    2, 3
                ]
            };
            curl.open("POST", `${unittestHost}/unittest/getRawContent`);
            curl.setRequestHeader('Content-Type', 'application/json');
            curl.send(body);
            const str = curl.getResponseString();
            expect(str).to.be.an('string');
            expect(str).to.be.eql(JSON.stringify(body));
        }
        {
            const body = {
                toJSON() {
                    return { "A": "B2" }
                }
            };
            curl.open("POST", `${unittestHost}/unittest/getRawContent`);
            curl.setRequestHeader('Content-Type', 'application/json');
            curl.send(body);
            const str = curl.getResponseString();
            expect(str).to.be.an('string');
            expect(str).to.be.eql(JSON.stringify(body));
        }
    })

    it('check sendAysnc validatiy', (done) => {
        const curl = new BaoLibCurl();
        const body = {
            a: 1,
            b: [
                2, 3
            ]
        };
        curl.open("POST", `${unittestHost}/unittest/getRawContent`);
        curl.setRequestHeader('Content-Type', 'application/json');
        curl.sendAsync(body, () => {
            if (curl.getResponseString() == JSON.stringify(body)) {
                done();
            } else done('response str different');
        });
    })
    
})
