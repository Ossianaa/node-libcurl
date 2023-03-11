const { LibCurl, fetch, requests } = require('../dist/index');

async function main() {
    const session = requests.session({
        // httpVersion: 1,
        redirect: true,
        verbose: true,
        cookies: 'authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3YWxsZXRBZGRyZXNzIjoiMHgwYTZmMzg5NmY2MGIzMGY4MTc2MmJkZGI2NDBhODAwZmJjZDgzYTI5Iiwic2lnbmF0dXJlIjoiMHhlNjg5YWI4ZjEwYTAwMWZlOTM3N2VmZTIzNzExNjE2N2M1ZTEwZDU4YTFmYjFlMmY0M2ZhZjI5ODhhZjBlZDY2MGEzNTVlN2Y0MjYzN2ZjZjdlOGZkYTI1N2QyNDEzY2NiOTI4YWM5NzQ2ZGEwOTMwNjg4MWFlN2E0Y2Q4MTVkODFiIiwiaWF0IjoxNjc2MzgwNzgxLCJleHAiOjE2Nzg5NzI3ODF9.AK49sn_0p9X0P5FOKsHUkuCVUCYDKtELk97Msq7aHZs',
    });
    session.setCookie('a', 'b', '.baidu.com', '/');
    console.log((await session.get('https://www.baidu.com/', {
        headers: {
        }
    })).text);
    return
    console.log((await session.post('https://www.baidu.com?a=2', {
        headers: {
            'user-Agent': 'chrome'
        },
        params: {
            a: 1
        },
        body: new URLSearchParams({
            a: 2
        })
    })).status);
    console.log(session.getCookies('.codecademy.com'));
    debugger
    /*  const curl = new LibCurl();
     curl.setHttpVersion(1);
     curl.open('GET', 'https://tls.peet.ws/api/clean')
     curl.setRequestHeader('user-Agent', 'chrome')
     await curl.send();
     console.log(curl.getResponseString());
 
     curl.open('GET', 'https://tls.peet.ws/api/clean')
     curl.setRequestHeader('user-Agent', 'chrome')
     await curl.send();
     console.log(curl.getResponseString());
     return */
    // curl.open('GET', 'http://127.0.0.1:51053/unittest/getRawHeaders')
    // curl.setRequestHeader('user-Agent', 'chrome')
    // curl.removeCookie("a", "127.0.0.1")
    // await curl.send();
    // console.log(curl.getCookies());
    // console.log(curl.getResponseString());
    // return

    // fetch('https://tls.peet.ws/api/clean', {
    //     cookies: 'a=b;c=d;e=f',
    //     headers: {
    //         "user-Agent":"1"
    //     }
    // }).then(e => e.json()).then(e => {
    //     console.log(e);
    // }).catch((e) => {
    //     console.log(e);
    // })
}
main()