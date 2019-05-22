var express = require("express"),
    router = express.Router(),
    User = require("../models/user"),
    passport = require("passport");


//Landing Page
router.get('/', function(req, res) {
    res.render("landingpage", {message: req.flash("error")});
});

//Render User Signup Page
router.get('/users/newUser', function(req, res) {
    res.render("newUser", {message: req.flash("user-exists")});
});

//Render Admin Signup Page
router.get('/users/newAdmin', function(req, res) {
    res.render("newAdmin", {codeMessage: req.flash("code-error"), userExistsMessage:req.flash("user-exists")});
});

//Check if the username entered already exists in database. If it does, then flash a user already exists messsage.
//Otherwise, register the user Using Passport And Redirect To Landing Page.
router.post('/users/newUser', function(req, res) {
    User.findOne({username: req.body.username.toLowerCase()}, function(err, user) {
        if(err) {
            console.log(err);
        }
        else {
            if(user==null) {
                User.register(
                    new User({username: req.body.username, name: req.body.name, grade: req.body.grade, house:req.body.house}), 
                    req.body.password, 
                    function(err, user) {
                        if(err) {
                            console.log(err);
                        }
                        else {
                            passport.authenticate("local")(req, res, function() {
                                res.redirect("/");
                            }); 
                        }
                });
            }
            else {
                req.flash("user-exists", "A User With The Given Username Already Exists.");
                res.redirect("/users/newUser");
            }
        }
    });
});

//Check if the username entered already exists in database. If it does, then flash a user already exists messsage using req-flash
//and redirect to the sign up page which will display the message. Otherwise, check if admin code is incorrect, and if so 
//flash a message using req-flash and redirect to sign up page which will display this message.
//If there are no problems, register user Using Passport And Redirect To Landing Page. 
router.post('/users/newAdmin', function(req, res) {
    User.findOne({username: req.body.username.toLowerCase()}, function(err, user) {
        if(err) {
            console.log(err);
        }
        else {
            if(user==null) {
                if(req.body.adminCode == "9999") {
                    User.register(
                        new User({username: req.body.username, name: req.body.name, isAdmin: true}), 
                        req.body.password, 
                        function(err, user) {
                        if(err) {
                            console.log(err);
                        }
                        passport.authenticate("local")(req, res, function() {
                            res.redirect("/");
                        });
                    });
                }
                else {
                    req.flash('code-error', "Invalid Admin Code");
                    res.redirect("/users/newAdmin");
                }
            }
            else {
                req.flash("user-exists", "An Admin With The Given Username Already Exists.");
                res.redirect("/users/newAdmin");
            }
        }
    });
});

router.post('/login', passport.authenticate('local', { successRedirect: '/index', failureRedirect: '/', failureFlash:"Invalid Credentials"}));

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router;