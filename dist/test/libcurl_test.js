"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = __importDefault(require("../src"));
const curl = new src_1.default();
curl.open('GET', 'http://baidu.com');
curl.setRequestHeader('user-Agent', 'chrome');
curl.setRedirect(true);
curl.send().then(e => {
    console.log(curl.getResponseString());
});
//# sourceMappingURL=libcurl_test.js.map