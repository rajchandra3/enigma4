/**
 * Created by IEEE on 7/26/2017.
 */
var express = require('express');
var router = express.Router();

var player = require('../models/players');
var check = require('../utilities/regex');

var authenticate = require('../authenticate');

var bcrypt = require('bcrypt-nodejs');
var cheerio = require('cheerio');
var extend = require('util')._extend;
var path = require('path');
var nodemailer = require('nodemailer');
var fs = require('fs');

router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//This is for verification on each login

router.post('/verifyPlayer', function (req, res) {
    authenticate.authenticate(req, res);
});

router.get('/enigmaVerification', function (req, res) {
    res.render('verified');
});

//Post Registration - EMAIL AUTHENTICATION (Sending EMAIL)
router.post('/save', function (req, res, next) {
    var success=true;
    var rand = Math.random().toString(36).slice(2);
    var hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    var data = new player({
        name:req.body.name,
        password: hash,
        email: req.body.email,
        hashcode : rand,
        reg_no: req.body.reg_no,
        organisation: req.body.organisation,
        phone: req.body.phone,
        authcomp : false
    });
    if (!check.username.test(req.body.name)) {
        res.json({code: '0', message: 'Invalid Name'});
        success=false;
    }
    if (!check.email.test(req.body.email)) {
        res.json({code: '0', message: 'Invalid E-MAIL'});
        success=false;
    }
    if (!check.reg_no.test(req.body.reg_no)) {
        res.json({code: '0', message: 'Invalid Register Number'});
        success=false;
    }
    if (!check.reg_no.test(req.body.organisation)) {
        res.json({code: '0', message: 'Invalid Organisation'});
        success=false;
    }
    if (!check.phone.test(req.body.phone)) {
        res.json({code: '0', message: 'Invalid PHONE NUMBER'});
        success=false;
    }
    if (!check.password.test(req.body.password) || !check.password.test(req.body.cpassword)) {
        res.json({code: '0', message: 'Invalid Password'});
        success=false;
    }
    if(req.body.password!==req.body.cpassword){
        success = false;
    }
    if(success) {
        data.save(function (err, doc) {
            if (err && err.code == 11000) {
                res.json({code: '0', message: 'This Email is Already registered!'})
            }
            else if (err && err.code != 66) {
                res.json({code: '0', message: err})
            }
            else if (err) {
                res.json({code: '0', message: err})
            }
            else {
                res.json({code: '1', message: "Verify your email address using the link sent to you."});
                var myobj = {email: req.body.email, hashcode: rand, authcomp: false};
                var htmlPath = __dirname + '/index1.html';
                var linkToSend = "https://" + req.headers.host + '/auth/' + "verifyMail?code=" + myobj.hashcode + "&email=" + myobj.email;
                // load in the json file with the replace values
                var data = fs.readFileSync(htmlPath);

                var $ = cheerio.load(data);
                // load in the HTML into cheerio
                // the keys are class names, use them to pick out what element
                // we are going to modify & then replace the innerHTML content
                // of that element


                //The button in the ind
                var inputs = $('#herehere');
                inputs.attr('href', function (i, id) {
                    return id.replace('http://jaadu.ieeevit.com',linkToSend);
                });

                var smtpTransport = nodemailer.createTransport("smtps://enigma.ieeevit%40gmail.com:" + encodeURIComponent('enigmadev_2017') + "@smtp.gmail.com:465");

                //If the html is loaded correctly and the link at the button location is successfully changed
                if ($.html() !== null) {
                    var mailOptions = {
                        to: req.body.email,
                        from: 'enigma.ieeevit@gmail.com',
                        subject: 'Enigma - Email Authentication',
                        html: $.html()
                    };
                }
                //If for any reason the html doesn't load, then text is sent instead
                else if ($.html() == null) {
                    var mailOptions = {
                        to: req.body.email,
                        from: 'enigma.ieeevit@gmail.com',
                        subject: 'Enigma - Email Authentication',
                        text: "You are receiving this because you have signed Up for Enigma 3.0." + "\n\n" +
                        "Please click on the following link, or paste this into your browser to complete the process:\n\n" + s + "\n\n" +
                        "If you did not request this, please ignore this email."
                    };
                }

                //Sending the mail
                smtpTransport.sendMail(mailOptions, function (err) {
                    if (err)
                        throw err;
                    else
                        console.log("Email Sent successfully !");
                });
                // Invoke the next step here however you like
                // Put all of the code here (not the best solution)
            }
        });
    }
});

router.get('/verifyMail', function(req, res, next) {
    if (!check.email.test(req.query.email)) {
        res.render('verified',{
            mainMessage : "Incorrect Link !!",
            trailingMessage : "Ask to resend the mail."
        });
        //res.json({code: '0', message: 'Incorrect Link!'});
    }
    else {
        player.findOne({email: req.query.email}, function (err, result) {
            if (err) throw err;
            if (!result) {
                res.render('verified',{
                    mainMessage : "You have not yet registered",
                    trailingMessage : "Click here to Register"
                });
                // res.json({code: '0', message: 'You have not yet registered!'});
            }
            else if(result.authcomp){
                res.render('verified',{
                    mainMessage : "Already authorized",
                    trailingMessage : "Click here to Log In"
                });
                // res.json({code: '0', message: 'Already Authorized'});
            }
            else {
                if (check.code.test(req.query.code)) {
                    if (req.query.code !== result.hashcode){
                        res.render('verified',{
                            mainMessage : "Incorrect Hash Code/Hash Code expired",
                            trailingMessage : "Ask to resend the mail."
                        });
                    }
                        // res.json({code: '0', message: 'Incorrect Hash Code/Hash Code expired'});
                    else {
                        var newValues = result;
                        newValues.authcomp=true;

                        //Successfully change the authcomp variable to true, in order to allow login
                        player.updateOne({_id:result._id}, newValues, function (err, res1) {
                            if (err) throw err;
                            else{
                                res.render('verified',{
                                    mainMessage : "Email Verified",
                                    trailingMessage : "Click here to login"
                                });
                            }
                            // res.redirect('/auth/enigmaVerification');
                        });
                    }
                }
                else{
                    res.render('verified',{
                        mainMessage : "Incorrect Hash Code/Hash Code expired",
                        trailingMessage : "Ask to resend the mail."
                    });
                }
                    // res.json({code: '0', message: 'Incorrect Hash Code/Hash Code expired'});
            }
        });
    }
});

module.exports = router;