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
var genderize = require('genderize');

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
    if (!req.body.name) {
        res.json({code: 0, message: 'Invalid Name'});
        success=false;
    }
    if (!check.email.test(req.body.email) || !req.body.email) {
        res.json({code: 0, message: 'Invalid E-MAIL'});
        success=false;
    }
    if (!check.reg_no.test(req.body.reg_no)) {
        res.json({code: 0, message: 'Invalid Registration Number'});
        success=false;
    }
    if (!check.reg_no.test(req.body.organisation)) {
        res.json({code: 0, message: 'Invalid University name'});
        success=false;
    }
    if (!check.phone.test(req.body.phone) || !req.body.phone) {
        res.json({code: 0, message: 'Invalid Contact detail'});
        success=false;
    }
    if (!check.password.test(req.body.password) || !check.password.test(req.body.cpassword)) {
        res.json({code: 0, message: 'Invalid Password'});
        success=false;
    }
    if(req.body.password!==req.body.cpassword){
        success = false;
    }
    if(req.body.coupan.toLowerCase() === "palette"){
        data.hint = 3;
    }
    if(success) {
        genderize(req.body.name.split(' ')[0], function (err, obj) {

            if(obj.gender!=null){
                data.gender = obj.gender;
            }

            data.save(function (err, doc) {
                if (err && err.code == 11000) {
                    res.json({code: 0, message: 'This Email is Already registered!'})
                }
                else if (err && err.code != 66) {
                    res.json({code: 0, message: err})
                }
                else if (err) {
                    res.json({code: 0, message: err})
                }
                else {
                    var myobj = {email: req.body.email, hashcode: rand, authcomp: false};
                    var smtpTransport = nodemailer.createTransport("smtps://"+process.env.EMAIL+":" + encodeURIComponent(process.env.PASSWORD) + "@smtp.gmail.com:465");
                    var mailOptions = {
                        to: req.body.email,
                        from: '"IEEE VIT" enigma.ieeevit@gmail.com',
                        subject: 'Enigma Authentication',
                        text: "Congratulations on getting registered for Enigma 4.0." + "\n\n" +
                        "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                        "http://" + req.headers.host + '/auth/' + "verifyMail?code=" + myobj.hashcode + "&email=" + myobj.email + "\n\n" +
                        "If you did not intend to register for Enigma 4.0 kindly ignore this message."
                    };

                    //Sending the mail
                    smtpTransport.sendMail(mailOptions, function (err) {
                        if (err)
                            throw err;
                        else {
                            res.json({
                                code: 1,
                                message: "Verify your email address using the link sent to you.Check spam if not found."
                            });
                            //console.log("Email Sent successfully !");
                        }
                    });
                    //Invoke the next step here however you like
                    //Put all of the code here (not the best solution)
                }
            });
        });


    }
});

router.get('/verifyMail', function(req, res, next) {
    if (!check.email.test(req.query.email)) {
        res.render('update',{
            mainMessage : "Incorrect Link !!",
            trailingMessage : "Ask to resend the mail."
        });
        //res.json({code: '0', message: 'Incorrect Link!'});
    }
    else {
        player.findOne({email: req.query.email}, function (err, result) {
            if (err) throw err;
            if (!result) {
                res.render('update',{
                    mainMessage : "You have not yet registered",
                    trailingMessage : "Click here to Register"
                });
                // res.json({code: '0', message: 'You have not yet registered!'});
            }
            else if(result.authcomp){
                res.render('update',{
                    mainMessage : "Already authorized",
                    trailingMessage : "Click here to Log In"
                });
                // res.json({code: '0', message: 'Already Authorized'});
            }
            else {
                if (check.code.test(req.query.code)) {
                    if (req.query.code !== result.hashcode){
                        res.render('update',{
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
                                res.render('update',{
                                    mainMessage : "Email Verified",
                                    trailingMessage : "Click here to login"
                                });
                            }
                            // res.redirect('/auth/enigmaVerification');
                        });
                    }
                }
                else{
                    res.render('update',{
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