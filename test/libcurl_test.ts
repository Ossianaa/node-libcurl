import { LibCurl } from "../dist/src/libcurl";
const curl: LibCurl = new LibCurl();
curl.open('GET', 'http://baidu.com')
curl.setRequestHeader('user-Agent', 'chrome')
curl.setRedirect(true);
curl.send().then(e => {
    console.log(curl.getResponseString());
})
