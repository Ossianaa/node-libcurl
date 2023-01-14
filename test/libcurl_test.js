const { LibCurl, fetch } = require('../index.js');

async function main() {
    const curl = new LibCurl();
    curl.open('GET', 'https://tls.peet.ws/api/clean')
    curl.setRequestHeader('user-Agent', 'chrome')
    await curl.send();
    console.log(curl.getResponseString());
    
    fetch('https://tls.peet.ws/api/clean', {
        headers: {
            'user-Agent': 'chrome',
        },
        instance: curl
    }).then(e => e.json()).then(e => {
        console.log(e);
    })
}
main()