var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var DemographicsSchema = new Schema({
    id: String,
    age: Number,
    gender: String,
    user: String,
    whenAssaulted: String,
    frequency: String,
    service_provided: String,
    issues: String,
    location: String,
    sp_pop: String,
    service: String,
    session_type: String
});

var Demographics = mongoose.model("Demographics", DemographicsSchema);
module.exports = Demographics;
