const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/jchat');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function (callback) {
  console.log("Connection Succeeded");
});


module.exports = db; 