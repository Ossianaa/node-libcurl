# node-libcurl

## different with Nodejs fetch api
* JA3 FingerPrint is the same as chrome 108,it modified the BoringSSL extension, set the custom cipher suite with Libcurl
* Now only support on Windows, linux and MacOS will be supported in the future

------------
## how to build
> npm i @ossiana/node-libcurl -g

#### Some Problems on Windows
You should install Python 2.7 and the Visual Studio compiler;
> npm i -g --production windows-build-tools



## Use Sample

### import
```javascript
import { default as Libcurl, fetch } from '@ossiana/node-libcurl'
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



### winhttp  style
```javascript
const curl = new Libcurl();
curl.open('POST', 'https://xxx.io/api/graphql/', true);
curl.setRequestHeaders(`Host: xxx.io
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36
Content-Type: application/octet-stream
Referer: https://opensea.io/
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.9
`);
curl.send(new Uint8Array([1, 255, 188]))
    .then(e => {
        console.log(curl.getResponseString());
    });
```