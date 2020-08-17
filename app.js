const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')

const index = require('./routes/index')
const test = require('./routes/test')
const api = require('./routes/api')
var Redis = require('./utils/RedisHelper')
var DataMongodbHelper = require('./utils/DataMongodbHelper');
var Web3 = require("web3")
var config = require('./config');
var Log = require('./utils/LogConsole');
var Cache = require('./system/Cache');



// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'ejs'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(test.routes(), test.allowedMethods())
app.use(api.routes(), api.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});


var chainAddress = config.httpProvider;
if(!chainAddress) {
    return;
}

// 创建web3对象
var web3 = new Web3();
Log.debug('web3.version:',web3.version);
// 连接到以太坊节点
Log.debug('chainAddress:'+chainAddress);
if(!web3.currentProvider) {
    Log.debug("connect...");
    web3.setProvider(new Web3.providers.HttpProvider(chainAddress));
} else {
    Log.debug("already connect!");
}

var mongodb = new DataMongodbHelper('ethereum');
Cache.cache('web3', web3);
Cache.cache('redis', new Redis());
Cache.cache('mongodb', mongodb);
mongodb.connect();

module.exports = app
