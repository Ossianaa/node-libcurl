const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.raw({
    inflate: true,
    limit: '100kb',
    type: 'application/octet-stream'
}));
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cookieParser())

const port = 51053;
app.get('/unittest/getRawHeaders', (req, res) => {
    console.log(req.headers);
    res.send(req.headers)
})
app.get('/unittest/getCookies', (req, res) => {
    console.log(req.cookies);
    res.send(req.cookies)
})



app.get('/unittest/getIp', (req, res) => {
    console.log(req.ip);
    res.send(req.ip.split(':')[3])
})

app.get('/unittest/getJsonp', (req, res) => {
    const { cbname="__WX__" } = req.query;

    res.send(`${cbname}({a:1})`)
})


app.get('/unittest/setTimeout', (req, res) => {
    const usp = new URLSearchParams(req.query)
    const timeout = usp.get('timeout');
    setTimeout(() => {
        res.json({
            success: 'ok',
            timeout
        });
    }, ((timeout ^ 0) + 1) * 1000)
})
app.post('/unittest/getRawContent', (req, res) => {
    res.send(req.body)
})

app.post('/unittest/getRawContentRandomTime', (req, res) => {
    setTimeout(() => {
        res.send(req.body)
    }, Math.random() * 1e3 + 3000)
})

module.exports = {
    host: `http://127.0.0.1:${port}`,
    start() {
        app.listen(port, () => {
            console.log(`unitest server open on port ${port}`);
        })
    }
}