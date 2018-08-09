var config = require('./config.js')

var redis = require("redis"),
    client = redis.createClient();

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
var router = new Router();

app.use(bodyParser())

router.get('/fxxk-now-news', (ctx, next) => {
    // ctx.router available
    ctx.body = 'Fuck Now News'
});

router.get('/fxxk-now-news/redirect/:id', (ctx, next) => {
    if(!Number(ctx.params.id))
        return next()
    
    client.get(ctx.params.id, (err, url) => {
        if(err) {
            ctx.body = "Server Error"
        } else if(!url) {
            ctx.body = "ID not exists"
        } else {
            ctx.redirect(url)
        }
    })
})

router.post('/fxxk-now-news/add', (ctx, next) => {
    let postData = ctx.request.body
    if(typeof postData === 'object') {
        // Valid?
        if(postData.title && postData.url && postData.token === config.token) {
            //Valid
            client.zrank('news', postData.title, (err, response) => {
                if(response) {
                    // Fuck NOW NEWS & update url
                    client.get('url:' + postData.title, (err, id) => {
                        if(err || !id) {
                            ctx.body = JSON.stringify({
                                code: -1,
                                url: postData.url
                            })
                        } else {
                            // Change
                            client.set(id, postData.url)
                            console.log('changed ' + postData.title)
                            ctx.body = JSON.stringify({
                                code: 1,
                                url: 'https://service.rwong.cc/fxxk-now-news/redirect/' + id
                            })
                        }
                    })
                } else {
                // Alright
                    client.zadd(
                        ['news', Date.now(), postData.title],
                        (err, response) => {
                            if (err) {
                                ctx.body = JSON.stringify({
                                    code: -1,
                                    url: postData.url
                                })
                            } else {
                                // Get unique id
                                client.incr('id', (err, id) => {
                                    if (err) {
                                        ctx.body = JSON.stringify({
                                            code: -1,
                                            url: postData.url
                                        })
                                    } else {
                                        client.set(id, postData.url)
                                        client.set('url:' + postData.title, id)
                                        console.log('added ' + postData.title);
                                        ctx.body = JSON.stringify({
                                            code: 0,
                                            url: 'https://service.rwong.cc/fxxk-now-news/redirect/' + id
                                        })
                                    }

                                })
                            }
                        }
                    )
                }
            })

        }
    }

    next()
})

app
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(23456)