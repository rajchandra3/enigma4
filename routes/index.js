var express   = require('express');
var router    = express.Router();
var extend    = require('util')._extend;
var path      = require('path');
var fs        = require('fs');
var cheerio   = require('cheerio');
var async = require('async');
var crypto = require('crypto');
var bcrypt      = require('bcrypt-nodejs');
var nodemailer = require('nodemailer');


var player = require('../models/players');
var Logs = require('../models/logs');

/* GET index page. */
router.get('/', function(req, res, next) {
    res.render('index');
});


router.post('/player/forgot', function(req, res, next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            player.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    res.json({code: o,message:'No account with that email address exists.'});
                }
                else {
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                    user.save(function (err) {
                        done(err, token, user);
                    });
                }
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport("smtps://enigma.ieeevit%40gmail.com:" + encodeURIComponent('enigmadev_2017') + "@smtp.gmail.com:465");
            var mailOptions = {
                to: user.email,
                from: '"IEEE VIT" enigma.ieeevit@gmail.com',
                subject: 'Enigma - Reset Password',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                res.json({code: 1, message:'An e-mail has been sent with further instructions.'});
                done(err, 'done');
            });
        }
    ], function(err) {
        if (err) return next(err);
    });
});


router.get('/reset/:token', function(req, res) {
    player.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
             // res.send('Password reset token is invalid or has expired.');
            res.json('update',{
                mainMessage:'Password reset token is invalid or has expired.',
                trailingMessage : 'Go back'
            });
        }
        else
            res.redirect('/#!resetPassword/'+req.params.token);
    });
});

router.post('/reset/:token', function(req, res) {
    async.waterfall([
        function(done) {
            player.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                    res.json({code: 0, message: 'Password reset token is invalid or has expired.'});
                }
                else if (req.body.password !== req.body.confirm) {
                    res.json({code: 0, message: 'Confirm Password not same as Password'});
                }
                else {
                    var hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
                    user.password = hash;
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;

                    user.save(function (err) {
                        res.json({code: 0, message: 'Your password has been successfully changed.'});
                    });
                }
            });
        },
        function(user, done) {
            var smtpTransport = nodemailer.createTransport("smtps://enigma.ieeevit%40gmail.com:" + encodeURIComponent('enigmadev_2017') + "@smtp.gmail.com:465");
            var mailOptions = {
                to: user.email,
                from: '"IEEE VIT" enigma.ieeevit@gmail.com',
                subject: 'Enigma - Your password has been changed',
                text: 'Hello,\n\n' +
                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                res.json({code: 1,message:'Success! Your password has been changed.'});
                done(err);
            });
        }
    ], function(err) {
        res.redirect('/');
    });
});

router.get('/resend', function(req, res, next) {
    res.render('resend');
});

router.post('/resend', function(req, res) {
    var email = req.body.email;
    var success = true;
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(email)) {
        res.json({code: 0, message: 'Invalid email!'});
        success = false;
    }
    if (success) {
        player.findOne({email: email}, function (err, user) {
            if (!user) {
                res.json({code: 0, message: 'No account with this email address exists.'});
            }
            else {
                if (!user.authcomp) {
                    var s = req.headers.host + '/auth/' + "verifyMail?code=" + user.hashcode + "&email=" + user.email;
// load in the json file with the replace values

                    var smtpTransport = nodemailer.createTransport("smtps://enigma.ieeevit%40gmail.com:" + encodeURIComponent('enigmadev_2017') + "@smtp.gmail.com:465");
                    var mailOptions = {
                        to: req.body.email,
                        from: '"IEEE VIT" enigma.ieeevit@gmail.com',
                        subject: 'Enigma - Email Authentication',
                        text: "You are receiving this because you have requested us to resend the mail." + "\n\n" +
                        "Please click on the following link, or paste this into your browser to complete the process:\n\n" + s + "\n\n" +
                        "If you did not request this, please ignore this email."
                    };
                    smtpTransport.sendMail(mailOptions, function (err) {
                        if (err)
                            throw err;
                        else
                            res.json({code: 1, message: "Verify your email address using the link sent to you."});
                            console.log("Email Sent");
                    });
                    // Invoke the next step here however you like
                    // Put all of the code here (not the best solution)
                }
                else {
                    res.json({code: 0, message: 'You have already verified this Email-ID'});
                }
            }
        });
    }
});

//leaderboard put here for time being

router.post('/leaderboard', (req, res) => {
    player.find({authcomp: true}).select("name organisation score currqno date").sort({score: -1}).limit(100).exec(function(err, docs){
    res.json(docs);
});
});


// <---- This is for getting user responses by Admin ---->
router.post('/playerLog',function (req,res) {
    var playerName = req.body.name;
    player.find({'name' : playerName},function (err, playerData) { //to mentain security
        if (err) {
            throw err;
        }
        else if(!playerData){
            res.send("No player with this name found !");
        }
        else{
            Logs.find({'player' : playerName},(error,log)=>{
                if(error)
                throw error;
        else if(log)
                res.json({
                    name:playerName,
                    attempts:log.length
                });
            else
                res.send("player has no attempts");
        });
        }
    });
});




module.exports = router;
