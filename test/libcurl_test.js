const { LibCurl, fetch, requests } = require('../dist/index');

async function main() {
    const session = requests.session({
        httpVersion: 1,
        redirect: true,
        verbose: true,
    });
    session.setCookie('__Host-1', '1', 'localhost', '/');
    for (let i = 0; i < 3; i++) {
        const json = ((await session.get('https://tls.peet.ws/api/all', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
            }
        })).json);
        debugger
    }

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