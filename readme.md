# node-libcurl

## Different with Nodejs fetch api
* JA3 FingerPrint is the same as chrome 108,it modified the BoringSSL extension, set the custom cipher suite with Libcurl
------------

## Build Status

|      Platform       | Support |
| :-----------------: | :-----: |
|  __Windows (x64)__  | __Yes__ |
|  __Windows (x86)__  | __No__  |
|  __Windows (ARM)__  | __No__  |
| __Ubuntu (x86_64)__ | __Yes__ |
| __MacOS (x86_64)__  | __Yes__ |
|  __MacOS (arm64)__  | __No__  |
------------

## How to build
> npm i -g @ossiana/node-libcurl

#### Some Problems on Windows
You should install Python 3.x and the Visual Studio compiler;
> npm i -g --production windows-build-tools
------------



## Use Sample

### import
```javascript
import { LibCurl, fetch, requests} from '@ossiana/node-libcurl'
```

### browser fetch  style
```javascript
fetch("https://xxx.io/api/graphql/", {
    proxy: "127.0.0.1:8888",
	method: "POST",
    headers: {
        "Host": "xxx.io",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        "Referer": "https://xxx.io/",
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9",
    },
	cookies: 'a=b&c=d',//{ a : 'b' ,c : 'd'},
	redirect: true,//if like http status code 302 redirect to 200, then content with status code 200 is returned
    body: { type : "GetStyle" },
	httpVersion: 0,//0 is http1.1, 1 is http2
	openInnerLog: false,//open curl logger
	//instance:curl,  //curl connect persistent
}).then(e => e.json()).then(e => {
    console.log('style is %s', e.style);
}).catch((err) => {
	console.error('fetch error : %s', err.message);
});
```
### requests  style
```javascript
const session = requests.session();

session.setCookie('ua', '123=/1a', '.baidu.com', '/');

const res = await session.get('https://www.baidu.com', {
    headers: {
        "user-Agent": "1"
    }
});
console.log(res.headersMap);
console.log(session.getCookiesMap().get('ua'));
console.log(res.text);
```



### winhttp  style
```javascript
const curl = new LibCurl();
curl.open('POST', 'https://xxx.io/api/graphql/', true);
curl.setRequestHeaders(`Host: xxx.io
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36
Content-Type: application/octet-stream
Referer: https://xxx.io/
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.9
`);
curl.send(new Uint8Array([1, 255, 188]))
    .then(e => {
        console.log(curl.getResponseString());
    });
```