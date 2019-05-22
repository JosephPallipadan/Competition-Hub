var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var userSchema= new mongoose.Schema({
    username: String,
    password: String,
    name: String,
    grade: String,
    house: String,
    isAdmin: {type: Boolean, default: false},
    competitions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Competition"}],
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);