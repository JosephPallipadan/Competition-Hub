var mongoose = require("mongoose");

var competitionSchema = new mongoose.Schema({
    name: String,
    category: String,
    grades: String,
    houses: String,
    description: String,
    registrations: {type: Array, "default" : []},
    postedBy: String,
    postedOn: String,
    registrationOpen: {type: Boolean, default: true}
});

module.exports = mongoose.model("Competition", competitionSchema);