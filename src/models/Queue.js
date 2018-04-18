var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var QueueSchema = new Schema({
    position: Number,
    queue: String,
});

var Queue = mongoose.model("Queue", QueueSchema);
module.exports = Queue;
