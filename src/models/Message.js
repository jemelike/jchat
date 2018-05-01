var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
    sender: String,
    messages: String,
    chatID: String
});

var Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
