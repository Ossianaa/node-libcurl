const { LibCurl, fetch, requests } = require('../dist/index');

async function main() {
    const session = requests.session({
        httpVersion: 1,
        proxy: '127.0.0.1:8888'
    });
    console.log((await session.get('https://www.baidu.com', {
        headers: {
            'user-Agent': 'chrome'
        },
        params: new URLSearchParams({
            a: 1
        })
    })).status);
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