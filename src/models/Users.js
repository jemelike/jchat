var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UsersSchema = new Schema({
    username: String,
    email: String,
    password: String, 
    name: String,
    available: String
});


var Users = mongoose.model("User", UsersSchema);
module.exports = Users;
