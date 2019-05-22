var express     = require("express"),
    router      = express.Router(),
    User        = require("../models/user"),
    Competition = require("../models/competition"),
    xl = require('excel4node'),
    email 	    = require("emailjs");
    
var server 	= email.server.connect({
       user:    "gmacompetitionhub@gmail.com", 
       password:"ycpzfegfeprmuxex", 
       host:    "smtp.gmail.com", 
       ssl:     true
    });
    
function nthIndexOf(string, n, of) {
	var pos = 0;
	while(n>0) {
		pos = string.indexOf(of, pos+1);
		n--;
    }
	return pos;
}

//View All Competitions That User Has Registered For.
//Get all competitions from database. Iterate through and put all which user has registered for into 
//another array by comparing usernames of registration and user. Render template with this array as variable.
router.get('/index/registered', function(req, res) {
    //If an admin requests this page, redirect him as an admin cannot register for competitions
    if(req.user.isAdmin) {
        res.redirect("/index");
    }
    else {
        Competition.find({}, function(err, competitions) {
            if(err) {
                console.log(err);
            }
            else {
                var registeredCompetitions = [];
                //Finding which competitions user has registered for.
                for(var x=0; x<competitions.length; x++) {
                    for(var y=0; y<competitions[x].registrations.length; y++) {
                        if(competitions[x].registrations[y].username == req.user.username) {
                            registeredCompetitions.push(competitions[x]);
                            break;
                        }
                    }
                }
                
                res.render("registered", {competitions:registeredCompetitions, name:req.user.name});
            }
        });
    }
});

//REGISTER

//Find competition using id in path. Check if the regstration is actually open. This is to handle the edge case that an admin closes 
//the registration for a competition in the time period between the user opening his index and registering.
//Render register form with user details filled in. 
//This is to allow user to enter any additional details requested by the competition admin.
router.get('/registrationClosed', function(req, res) {
    res.render("registrationClosedMessage");
});

//Find competition using id in path. Find competition using id in path. Check if the regstration is actually open. 
//This is to handle the edge case that an admin closes the registration for a competition in the time period between the user 
//opening his index and registering.Create registration using req.user and registration details from form body. 
//Add to registations array of competition. Update Competition. Send email to admin to notify. Redirect to index.
router.put('/competitions/:id/register', function(req, res) {
    Competition.findById(req.params.id, function(err, foundCompetition) {
        if(err) {
            console.log(err);
        }
        else {
            if(foundCompetition.registrationOpen) {
                
                var time = req.body.time;
                
                var registration = {};
                registration.name = req.user.name;
                registration.grade = req.user.grade;
                registration.username = req.user.username;
                registration.details = req.body.details;
                registration.time = time.substring(nthIndexOf(time, 1, " ")+1, nthIndexOf(time, 5, " ")+1);//new Date().toJSON().slice(0,10).replace(/-/g,'/');
                
                foundCompetition.registrations.push(registration);
                foundCompetition.save(function(err, updatedCompetition) {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        console.log("Updated Competition After Adding Registration: "+updatedCompetition);
                    }
                });
                
                server.send({
                   text:    "This email was automatically sent to notify you that "+req.user.name+" has registered for "
                            +foundCompetition.name+". The total number of registrations is now "+foundCompetition.registrations.length+
                            ". Do not reply to this email.", 
                   from:    "The Competition Hub", 
                   to:      foundCompetition.postedBy,
                   subject: "Competition Hub | "+foundCompetition.name+" | Registration Added"
                }, function(err, message) { console.log(err || message); });
                
                res.redirect("/index");
                }
            else {
                res.redirect("/registrationClosed");
            }
            
        }
    });
});

//Find competition using id in path. Iterate through registrations of competition till user with username of req.user is found. 
//Remove registration from competition. Update Competition. Send email to admin to notify. Redirect to index.
router.put('/competitions/:id/deregister', function(req, res) {
    Competition.findById(req.params.id, function(err, foundCompetition) {
        if(err) {
            console.log(err);
        }
        else {
            
            //Removing registration from competition.
            for(var x=0; x<foundCompetition.registrations.length; x++) {
                if(foundCompetition.registrations[x].username==req.user.username) {
                    foundCompetition.registrations.splice(x, 1);
                }
            }
            
            foundCompetition.save(function(err, updatedCompetition) {
                if(err) {
                    console.log(err);
                }
                else {
                    console.log("Updated Competition After Removing Registration: "+updatedCompetition);
                }
            });
            
            server.send({
               text:    "This email was automatically sent to notify you that "+req.user.name+" has deregistered from "
                        +foundCompetition.name+". The total number of registrations for this competition is now "+foundCompetition.registrations.length+
                        ". Do not reply to this email.", 
               from:    "The Competition Hub", 
               to:      foundCompetition.postedBy,
               subject: "Competition Hub | "+foundCompetition.name+" | Registration Added"
            }, function(err, message) { console.log(err || message); });
        }
        res.redirect("/index/registered");
    });
});


// VIEW REGISTRATIONS FOR COMPETITION
//Find competition using id in path. Render registrations page.
router.get('/competitions/:id/registrations', function(req, res) {
    Competition.findById(req.params.id, function(err, foundCompetition) {
        if(err) {
            console.log(err);
        }
        else {
            res.render("registrationIndex", 
            {
                registrations: foundCompetition.registrations, 
                competition_name: foundCompetition.name, 
                competition_id: req.params.id
            });
        }
    });
});

// GET REGISTRATIONS FOR COMPETITION AS EXCEL FILE
//Find competition using id in path. Create excel file from registrations. 
router.get('/competitions/:id/registrations/file', function(req, res) {
    Competition.findById(req.params.id, function(err, foundCompetition) {
        if(err) {
            console.log(err);
        }
        else {
            var wb = new xl.Workbook();
            var ws = wb.addWorksheet('Registrations');
            
            ws.cell(1, 1).string('Name');
            ws.cell(1, 2).string('Grade');
            ws.cell(1, 3).string('Email');
            ws.cell(1, 4).string('Details');
            ws.cell(1, 5).string('Time');
            
            for(var x=0; x<foundCompetition.registrations.length; x++) {
                ws.cell(x+2, 1).string(foundCompetition.registrations[x].name);
                ws.cell(x+2, 2).string(foundCompetition.registrations[x].grade);
                ws.cell(x+2, 3).string(foundCompetition.registrations[x].username);
                ws.cell(x+2, 4).string(foundCompetition.registrations[x].details);
                ws.cell(x+2, 5).string(foundCompetition.registrations[x].time);
            }
            
            wb.write(foundCompetition.name+"_registrations.xlsx", res);
        }
    });
});


//TOGGLE COMPETITION REGISTRATION STATUS
//Find competition using id from path. Toggle registration status by inverting registrationOpen property. Redirect to index.
router.put('/competitions/:id/registrations/toggle', function(req, res) {
    Competition.findById(req.params.id, function(err, foundCompetition) {
        if(err) {
            console.log(err);
        }
        else {
            foundCompetition.registrationOpen = !foundCompetition.registrationOpen;
            foundCompetition.save(function(err, updatedCompetition) {
                if(err) {
                    console.log(err);
                }
                else {
                    console.log("Updated Competition after toggling registration status: "+updatedCompetition);
                    res.redirect("/index");
                }
            });
        }
    });
});


//DELETE REGISTRATION FROM COMPETITION
//Find competition using id in req.params.id Iterate through registrations and delete the 
//registration with username req.params.username. Update competition in database and 
//then redirect to registration index of the competition.
router.put("/competitions/:id/registrations/delete/:username", function(req, res) {
    Competition.findById(req.params.id, function(err, foundCompetition) {
        if(err) {
            console.log(err);
        }
        else {
            
            var toEmail = "";
            
            for(var x=0; x<foundCompetition.registrations.length; x++) {
                if(foundCompetition.registrations[x].username==req.params.username) {
                    toEmail = foundCompetition.registrations[x].username;
                    foundCompetition.registrations.splice(x, 1);
                    break;
                }
            }
            
            server.send({
               text:    "This email was automatically sent to notify you that the admin of "+foundCompetition.name+
                        " has deleted your registration. You can contact them using their email "+foundCompetition.postedBy+". Do not reply to this email.", 
               from:    "The Competition Hub", 
               to:      toEmail,
               subject: "Competition Hub | "+foundCompetition.name+" | Registration Deleted"
            }, function(err, message) { console.log(err || message); });
            
            foundCompetition.save(function(err, updatedCompetition) {
                if(err) {
                    console.log(err);
                }
                else {
                    console.log("Updated Competition after deleting registration: "+updatedCompetition);
                    res.redirect("/competitions/"+req.params.id+"/registrations");
                }
            });
        }
    });
});

router.post("/competitions/:id/registrations/contact", function(req, res) {
    Competition.findById(req.params.id, function(err, foundCompetition) {
        if(err) {
            console.log(err);
        }
        else {
            console.log("Lol: "+foundCompetition)
            var emailList = "";
            foundCompetition.registrations.forEach(function(item) {
               emailList+=item.username+","; 
            });
            emailList=emailList.substring(0, emailList.length-1);

            server.send({
               text:    req.body.message, 
               from:    "The Competition Hub", 
               to:      emailList,
               subject: "Message From "+foundCompetition.name+" Admin"
            }, function(err, message) { console.log(err || message); });
            
            res.redirect("/index");
        }
    });
});

module.exports = router;