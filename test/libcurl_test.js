const { LibCurl, fetch } = require('../index.js');

async function main() {
    // const curl = new LibCurl();
    // curl.open('GET', 'http://127.0.0.1:51053/unittest/getRawHeaders')
    // curl.setRequestHeader('user-Agent', 'chrome')
    // curl.setCookie("a", "b", "127.0.0.1")
    // await curl.send();
    // console.log(curl.getResponseString());

    fetch('http://127.0.0.1:51053/unittest/getRawHeaders', {
        cookies: 'a=b;c=d;e=f',
        headers: {
        }
    }).then(e => e.json()).then(e => {
        console.log(e);
    })
}
main()