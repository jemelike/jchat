
const config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

const opn = require('opn')
const cors = require('cors')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const proxyMiddleware = require('http-proxy-middleware')
const passport = require('passport')
const webpackConfig = (process.env.NODE_ENV === 'testing' || process.env.NODE_ENV === 'production')
  ? require('./webpack.prod.conf')
  : require('./webpack.dev.conf')

// default port where dev server listens for incoming traffic
const port = process.env.PORT || config.dev.port

// automatically open browser, if not set will be false
const autoOpenBrowser = !!config.dev.autoOpenBrowser

// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
const proxyTable = config.dev.proxyTable

const app = express()

const compiler = webpack(webpackConfig)

const devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

const hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: false,
  heartbeat: 2000
})

// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = { target: options }
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

//
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cors())
//Load Model
let User = require('../src/models/Users')
let Message = require('../src/models/Message')
// serve pure static assets
const staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))
if (process.env.NODE_ENV === "development") app.use(express.static('./dev-dist'))
const uri = (process.env.NODE_ENV === 'testing' || process.env.NODE_ENV === 'production') ? '' : 'http://' + config.dev.ipaddress + ':' + port

var _resolve
const readyPromise = new Promise(resolve => {
  _resolve = resolve
})

const session = require('express-session')
let sess = {
  secret: 'keyboard cat',
  cookie: {}
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess))

const server = app.listen(port)
//setup socket io
const io = require('socket.io')(server)
let chatIDs = []
let waitingQueue = []

const queue = io.of('queue')
const chat = io.of('chat')

chat.on('connection',
  (socket) => {

    socket.on('chat-message', (data) => {
      socket.emit('chat-message', data)
      socket.broadcast.emit('chat-message', data)
      // Chat API
      app.post('/messages', (req, res) => {
        const message = data.message;
        const sender = data.sender;
        const chatID = data.chatID;
        const post_message = new Message({
          message,
          sender,
          chatID,
        })
      })
    })

  })

queue.on('connection', function (socket) {

  socket.emit('load-queue', {line: waitingQueue.length})
  socket.on('enter', function (data) {
    waitingQueue.push({ data, arrivalTime: Date.now(), channelName: '' })
    socket.broadcast.emit('enter', { line: waitingQueue.length })

  })

  socket.on('take-chat', function (data) {
    let next = waitingQueue.shift()
    chatIDs.push(next)
    socket.emit('update-queue', { line: waitingQueue.length })
  })
})
//setup db connection
const db = require('../config/db/db.base.conf')

app.post('/login', (req, res) => {

  let username = req.body.username
  let password = req.body.password

  let User = require('../src/models/Users')

  User.findOne({ username: username, password: password }, (err, user) => {
    if (err) { return done(err); }
    if (user) {
      res.send('You logged in')
    } else {
      res.send('Congrats you have logged in')
    }
  })

});
app.post('/messages', (req, res) => {
  const body = req.body
  console.log(body)
  /*  const userAgent = req.get('user-agent')
  console.log(md)
   console.log('________________________________\nBODY')
   console.log(body)
   console.log('________________________________\nHEADER')
   console.log(userAgent)
   console.log('________________________________')  */
  const message = body.message
  const sender = body.sender
  const chatID = body.chatID

  var new_post = new Message({
    "messages": message,
    "sender": sender,
    "chatID": chatID
  })

  console.log(new_post)
  new_post.save(function (error) {
    if (error) {
      console.log(error)
    }
    res.send({
      success: true,
      message: 'Post saved successfully!'
    })
  })
})

app.get('/messages_sent', (req, res) => {
  Message.find({}, function (error, message) {
    if (error) { console.error(error); }
    res.send({
      message
    })
  }).sort({ _id: -1 })
})

app.post('/register', (req, res) => {
  let username = req.body.username
  let password = req.body.password
  let first = req.body.fname
  let last = req.body.lname
  let email = req.body.email

  name = first + " " + last

  let new_user = new User({
    username,
    email,
    password,
    name,
    available: "online"
  })

  new_user.save(err => console.error(err))
  res.send('User: ' + username + ' registered')
});

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')
  console
  // when env is testing, don't need open it
  if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
    //    opn(uri)
  }
  _resolve()
})

module.exports = {
  app: app,
  ready: readyPromise,
  close: () => { server.close() }
}
