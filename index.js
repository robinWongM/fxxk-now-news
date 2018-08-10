var config = require('./config.js')

var redis = require("redis"),
    client = redis.createClient();

const {promisify} = require('util');
const getAsync = promisify(client.get).bind(client)
const setAsync = promisify(client.set).bind(client)
const zrankAsync = promisify(client.zrank).bind(client)
const zaddAsync = promisify(client.zadd).bind(client)
const incrAsync = promisify(client.incr).bind(client)

client.auth(config.password, (err, response) => {
    if(err) {
        console.error('Connect failed')
    } else {
        console.log('Connected')
    }
})

var Koa = require('koa');
var Router = require('koa-router');
var bodyParser = require('koa-bodyparser');

var app = new Koa();
var router = new Router({
    prefix: '/fxxk-now-news'
});

app.use(bodyParser())

router.get('/', (ctx, next) => {
    // ctx.router available
    ctx.body = 'Fuck Now News'
});

router.get('/redirect/:id', async (ctx, next) => {
    console.log('received redirect request')

    if(!Number(ctx.params.id)) {
        ctx.status = 400
        ctx.body = "Invalid Request"
    } else {
        let url
        try {
            url = await getAsync('url:' + ctx.params.id)
        } catch (err) {
            ctx.status = 500
            ctx.body = "Server Error"
            return
        }
        
        if(!url) {
            ctx.status = 404
            ctx.body = "ID not exist"
        } else {
            console.log(url)
            await incrAsync('views:' + url)
            ctx.redirect(url)
        }

        next()
    }
})

router.post('/add', async (ctx, next) => {
    let postData = ctx.request.body
    if(typeof postData === 'object' && postData.title && postData.url && postData.token === config.token) {
        console.log('received add request: ' + postData.title)
        console.log('add the url is ' + postData.url)
        try {
            let id = await getAsync('postid:' + postData.title)
            console.log(id)
            if(id) {
                // Fuck Now News
                await setAsync('url:' + id, postData.url)
                await setAsync('lastmodified:' + id, Date.now())

                ctx.status = 200
                ctx.body = JSON.stringify({
                    code: 1,
                    url: 'https://service.rwong.cc/fxxk-now-news/redirect/' + id
                })
            } else {
                id = await incrAsync('counter')
                await setAsync('postid:' + postData.title, id, 'EX', 604800) // expire after 1 week
                await setAsync('url:' + id, postData.url)
                await setAsync('created:' + id, Date.now())

                ctx.status = 200
                ctx.body = JSON.stringify({
                    code: 0,
                    url: 'https://service.rwong.cc/fxxk-now-news/redirect/' + id
                })
            }
        } catch (err) {
            console.error(err)
            ctx.status = 500
            ctx.body = JSON.stringify({
                code: -1,
                url: postData.url
            })
        }
    }

    next()
})

app
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(23456)