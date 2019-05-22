var express = require("express"),
    router = express.Router(),
    User = require("../models/user"),
    Competition = require("../models/competition");
    
function userRegistered(username, registrations) {
    for(var x=0; x<registrations.length; x++) {
        if(registrations[x].username==username) {
            return true;
        }
    }
    return false;
}

//View All Competitions
//Find User using username stored in session. If User is an admin, render adminIndex, else render userIndex.
router.get('/index', function(req, res) {
    //Populate function since object references are used.
    User.findOne({username: req.user.username}).populate("competitions").exec(function(err, foundUser) {
        if(err) {
            console.log(err);
        }
        else {
            //Reverse function used to convert competitions arrays in order to display in chronological order
            if(foundUser.isAdmin) {
                res.render("adminIndex", {competitions: foundUser.competitions.reverse(), name:foundUser.name});
            }
            else {
                Competition.find({}, function(err, competitions) {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        //Remove competitions that the user has already registered for, are not open for registration, 
                        // are not belonging to the users grade or, not belonging to the users house 
                        //from the array to be used in the ejs template.
                        for(var x = 0; x<competitions.length; x++) {
                            var shouldBeRemoved =   competitions[x].registrationOpen==false || competitions[x].grades.indexOf(req.user.grade)==-1 || 
                                                    userRegistered(req.user.username, competitions[x].registrations) || 
                                                    competitions[x].houses.indexOf(req.user.house)==-1;
                            if(shouldBeRemoved) {
                                competitions.splice(x--, 1);
                            }
                        }
                        res.render("userIndex", {competitions: competitions.reverse(), name:foundUser.name});
                    }
                })
            }
        }
    });
});

//ADD Competition POST
//Obtain competition details from form using body-parser. Set postedBy and postedOn. Add competition to competition database.
//Find admin using username stored in session. Add the competition to the users competition array. Save User. Redirect to index.
router.post('/competitions/new', function(req, res) {
    var grades = [];
    
    if(req.body["All"]!=null) {
        for(var x = 1; x<=14; x++) {
            if(x==13) {
                grades.push("IB1")
            }
            else if(x==14) {
                grades.push("IB2")
            }
            else {
                grades.push(x+'');
            }
        }
    }
    else {
        for(var x = 1; x<=14; x++) {
            if(req.body["grade"+x]!=null) {
                if(x==13) {
                    grades.push("IB1")
                }
                else if(x==14) {
                    grades.push("IB2")
                }
                else {
                    grades.push(x+'');
                }
            }
        }
    }
    
    var houses = [];
    
    if(req.body["Aquila"]!=null) {
        houses.push("Aquila");
    }
    
    if(req.body["Cygnus"]!=null) {
        houses.push("Cygnus");
    }
    
    if(req.body["Orion"]!=null) {
        houses.push("Orion");
    }
    
    if(req.body["Pegasus"]!=null) {
        houses.push("Pegasus");
    }
    
    var newCompetition = new Competition(req.body.competition);
    newCompetition.grades = grades;
    newCompetition.houses = houses;
    newCompetition.postedBy = req.user.username;
    newCompetition.postedOn = new Date(Date.now()).toJSON().slice(0,10).replace(/-/g,'/');
    
    newCompetition.save(function(err, competition) {
        if(err) {
            console.log(err);
        }
        else {
            console.log("Newly Added Competition: "+competition);
        }
    });
    
    User.findOne({username: req.user.username}, function(err, foundUser) {
        if(err) {
            console.log(err);
        }
        else {
            foundUser.competitions.push(newCompetition);
            
            foundUser.save(function(err, user) {
            if(err) {
                console.log(err);
            }
            else {
                console.log("Updated Admin After Adding Competiton: "+user);
            }
        });
        }
    });
    
    res.redirect("/index");
});

//DELETE Competition
//Because user has reference to deleted competition, the reference must be removed. User is found from session. 
//The reference to the competition to be deleted is removed from the competitions array and the user is updated. Relogin to update session.
//Find competition using id from path. Delete from competitions database. Redirect to index
router.delete('/competitions/:id', function(req, res) {
    //Updating Admin
    User.findOne({username: req.user.username}).populate("competitions").exec(function(err, admin) {
        if(err) {
            console.log(err);
        }
        else {
            //Check all elements of array till object with id of competition with id in req.params is found and 
            //then use splice function to remove it.
            for(var x = 0; x<admin.competitions.length; x++) {
                if(admin.competitions[x]._id == req.params.id) {
                    admin.competitions.splice(x, 1);
                    break;
                }
            }
           
            admin.save(function(err, updatedAdmin) {
                if(err) {
                  console.log(err);
                }
                else {
                    console.log("Updated Admin After Deleting Competition: "+updatedAdmin);
                }
            });
            
            // //Relogin to update session
            // req.login(admin, function(error) {
            //     if (!error) {
            //       console.log('Succcessfully updated Admin');
            //     }
            // });
            // res.end(); // This line is important to update session
        }
    });
    
    //Actually deleting the competition from competition collection.
    Competition.findByIdAndRemove(req.params.id, function(err, competition) {
        if(err) {
            console.log(err);
        }
        else {
            res.redirect("/index");
        }
    });
});

// app.get('/edit/:id', function(req, res) {
//     Competition.findById(req.params.id, function(err, competition) {
//         if(err) {
//             console.log(err);
//         }
//         else {
//             res.render("edit", {competition: competition})
//         }
//     });
// });

// app.put('/edit/:id', function(req, res) {
//     Competition.findByIdAndUpdate(req.params.id, req.body.competition, function(err, competition) {
//         if(err) {
//             console.log(err);
//         }
//         else {
//             console.log("Competition "+req.body.competition.name+" successfully updated.");
//             res.redirect("/"+competition.postedBy+"/index");
//         }
//     });

module.exports = router;