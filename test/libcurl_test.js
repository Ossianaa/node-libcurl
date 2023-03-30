const { LibCurl, fetch, requests } = require('../dist/index');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';
async function main() {
    //     const session = requests.session({
    //         httpVersion: 1,
    //         redirect: true,
    //         verbose: true,
    //         interface: 'eth0',
    //         cookies: "clientid=3; soft_did=1619580708547; didv=1672905504494; did=web_3dfd672741201eac0b0a53ea7ea55ead; userId=2274726791; kuaishou.web.cp.api_st=ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0EqABgYwF2a0BFvaHRDwOGLq0klhBfMMWjV7wyZmN8Z59-sXln68jwvtyhxZzn892vDHH1dzOwA2yG0o8DzMbqCTvR263CrjWAGRRJe_KJuP-tBvP2IyXuU_a0hSwbyuFs2w7yZq_5DcIbWW9K8cnD64z6I6-n4muQk6tzeF_re1F-dV5U_aHf-fAjiWzMMxAUqJgM5n0wmPPTRczBkztOByfWBoSaE3EqfmqkMz_szxZl-DeEj5lIiBX_WXo6QXlZSCtMiMSdrILE-8QjLBdh-7bxvchVE6-kigFMAE; kuaishou.web.cp.api_ph=845048d01d87bcab624601688ae0cfcc2633"
    //     });
    //     const resp = await session.post('https://cp.kuaishou.com/rest/v2/creator/pc/notification/unReadCount?__NS_sig3=f0e0a7976871acc7c6adaeaf8b66c247759139d5b1b1b3b3bcbdbea4', {
    //         headers: `Accept: application/json, text/plain, */*
    // Accept-Language: zh-CN,zh;q=0.9
    // Content-Type: application/json;charset=UTF-8
    // Origin: https://cp.kuaishou.com
    // Referer: https://cp.kuaishou.com/profile
    // User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36`,
    //         json: { "kuaishou.web.cp.api_ph": "845048d01d87bcab624601688ae0cfcc2633" }
    //     })
    //     console.log(resp.json);
    //     debugger
    
    const curl = new LibCurl();
    // curl.printInnerLogger()
   
    /* curl.setJA3Fingerprint(
        '771,4865-4867-4866-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-34-51-43-13-45-28-21-41,29-23-24-25-256-257,0'
    ); */
    curl.setJA3Fingerprint(
        '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,35-23-43-51-45-5-13-65281-17513-10-16-18-0-11-27-21-41,29-23-24,0'
    );
    // curl.setHttpVersion(1);
    curl.open('GET', 'https://tls.peet.ws/api/clean')
    curl.setRequestHeader('user-Agent', USER_AGENT)
    await curl.send();
    console.log(curl.getResponseString());
    curl.open('GET', 'https://tls.peet.ws/api/clean')
    curl.setRequestHeader('user-Agent', USER_AGENT)
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