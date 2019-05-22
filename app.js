var express               = require("express"),
    app                   = express(),
    bodyParser            = require("body-parser"),
    mongoose              = require("mongoose"),
    methodOverride        = require("method-override"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    expressSession        = require("express-session"),
    flash                 = require('req-flash'),
    cookieParser          = require('cookie-parser');
    
var authRoutes            = require("./routes/auth"),
    competitionRoutes     = require("./routes/competitions"),
    registrationRoutes    = require("./routes/registration");
    
    
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

app.use(expressSession({
    secret: "Lelouch Vi Brittania Is The Greatest Human Being Of All Time",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser());
app.use(flash());

app.all('*', isLoggedIn);

var User = require("./models/user");

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(authRoutes);
app.use(competitionRoutes);
app.use(registrationRoutes);

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated() && req.path=="/") {
        res.redirect("/index");
    }
    else if(req.isAuthenticated() || req.path=="/" || req.path=="/login" || req.path=="/users/newUser" || req.path=="/users/newAdmin" || req.path=="/thing") {
        return next();
    }
    else {
        res.redirect("/");
    }
}

mongoose.connect("mongodb://main:'password'/gmacompetitionhub")// Note that the password has been removed for security purposes.

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Server Started");
});



