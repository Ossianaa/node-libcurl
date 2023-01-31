const { LibCurl, fetch } = require('../dist/index.js');

async function main() {
    const curl = new LibCurl();
    curl.setHttpVersion(1);
    curl.open('GET', 'https://tls.peet.ws/api/all')
    curl.setRequestHeader('user-Agent', 'chrome')
    await curl.send();
    console.log(curl.getResponseString());

    curl.open('GET', 'https://tls.peet.ws/api/all')
    curl.setRequestHeader('user-Agent', 'chrome')
    await curl.send();
    console.log(curl.getResponseString());
    return
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