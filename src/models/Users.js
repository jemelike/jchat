var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UsersSchema = new Schema({
    email: String,
    password: String, 
    name: String,
    available: Boolean
});

var Users = mongoose.model("User", UsersSchema);
module.exports = Users;
