
const config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

//open a file or uri with the users preferred application (browser, editor, etc), cross platform
const opn = require('opn')

//CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
const cors = require('cors')

// HTTP request logger middleware for node.js
const morgan = require('morgan')

// Node.js body parsing middleware
const bodyParser = require('body-parser')

//This is an exact copy of the NodeJS ’path’ module published to the NPM registry
const path = require('path')

//Fast, unopinionated, minimalist web framework for node.
const express = require('express')

//Helmet can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriate
//https://expressjs.com/en/advanced/best-practice-security.html#use-helmet
const helmet = require('helmet')
//webpack is a module bundler. Its main purpose is to bundle JavaScript files for usage in a browser, yet it is also capable of transforming, bundling, or packaging just about any resource or asset.
const webpack = require('webpack')

//Node.js proxying made simple. Configure proxy middleware with ease for connect, express, browser-sync and many more.
const proxyMiddleware = require('http-proxy-middleware')

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

const router = express.Router()

//An express-style development middleware for use with webpack bundles and allows for serving of the files emitted from webpack. This should be used for development only
const devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

/**
 Webpack hot reloading using only webpack-dev-middleware. This allows you to add hot reloading into an existing server without webpack-dev-server.

 This module is only concerned with the mechanisms to connect a browser client to a webpack server & receive updates. It will subscribe to changes from the server and execute those changes using webpack's HMR API. Actually making your application capable of using hot reloading to make seamless changes is out of scope, and usually handled by another library.

 If you're using React then some common options are react-transform-hmr and react-hot-loader
 */
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

// handle fallback for HTML5 history API https://www.npmjs.com/package/connect-history-api-fallback
app.use(require('connect-history-api-fallback')())
// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

app.use(helmet())

// serve pure static assets
const staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)

app.use(morgan('combined'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cors())

//Load Model
let User = require('../src/models/Users')
let Message = require('../src/models/Message')
let Queue = require('../src/models/Queue')
let Demographics = require('../src/models/Demographics')

app.use(staticPath, express.static('./static'))

const uri = (process.env.NODE_ENV === 'testing' || process.env.NODE_ENV === 'production') ? '' : 'http://' + config.dev.ipaddress + ':' + port

var _resolve
const readyPromise = new Promise(resolve => {
  _resolve = resolve
})

//sets up sessions
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
//Public Assets for RAIINN
app.use(express.static('./dist/RAINN_files'))

const server = app.listen(port)

//Setup socket io
const io = require('socket.io')(server)

//setup views
app.set('views', __dirname + '/views');
app.set('view engine', 'pug')

//setup db connection
const db = require('../config/db/db.base.conf')

// Channel set up
var chat = io.of('/chat');
var queue = io.of('/queue');

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

  });
let total = [];
queue.on('connection',
  (socket) => {
    socket.on('enter-eng-queue', (data) => {
      total.push(data)
      console.log(data)
      socket.broadcast.emit('new-person', total)
    })
  })

queue.on('disconnect', (socket) => {
  socket.on('')
})

//Demographics API stuffs
router.get("/demographics", (req, res) => {
  Demographics.find({}, function (error, demographics) {
    if (error) { console.error(error); }
    res.send(
      {
        demographics: demographics
      }
    )
  }).sort({ _id: -1 })
})

router.post('/posts', (req, res) => {
  var db = req.db;
  var age = Number(req.body.age);
  var id = req.body.id;
  var gender = req.body.gender;
  var user = req.body.user;
  var whenAssaulted = req.body.whenAssaulted;
  var frequency = req.body.frequency;
  var service_provided = req.body.service_provided;
  var issues = req.body.issues;
  var location = req.body.location;
  var sp_pop = req.body.sp_pop;
  var service = req.body.service;
  var session_type = req.body.session_type;

  var new_post = new Demographics({
    id: id,
    age: age,
    gender: gender,
    user: user,
    whenAssaulted: whenAssaulted,
    frequency: frequency,
    service_provided: service_provided,
    issues: issues,
    location: location,
    sp_pop: sp_pop,
    service: service,
    session_type: session_type

  })

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


router.get('/messages_sent', (req,res) => {
  Message.find({}, function(error, message){
    if(error) {console.error(error);}
    res.send({
      message
    })
  }).sort({_id: -1})
})

router.post('/messages', (req, res) => {
  const body = req.body
  console.log(body)
  const message = body.message
  const sender = body.sender
  const chatID = body.chatID
  
  var new_post = new Message ({
    "messages": message,
    "sender":sender,
    "chatID":chatID
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

app.use(router)
//Login  Stuff
app.get('/', (req, res) => {
  if(req.session)
    res.render('index', { title: 'JChat - ' + user.username, message: 'Hello there!', user:username })
      
})

app.post('/', (req, res) => {
  let sess = req.session

  if (sess.email) {
    /** This line checks for Session existence. */
  }
  else {
    console.log(req.body)

    let username = req.body.username
    let password = req.body.password



    let User = require('../src/models/Users')
    //For Registration
    if (req.body.fname && req.body.lname && req.body.email) {
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

      //res.render('index', { title: 'JChat ' + user, message: 'Hello there!' })
    }


    User.findOne({ username: username, password: password }, (err, user) => {
      if (err) { return Error(err); }
      if (!user) {

      } else {
        res.render('index', { title: 'JChat - ' + user.username, message: 'Hello there!', user:username })
      }
    })
  }

});

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')

  // when env is testing, don't need open it
  if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
    opn(uri)
  }
  _resolve()
})

module.exports = {
  app: app,
  ready: readyPromise,
  close: () => { server.close() }
}
