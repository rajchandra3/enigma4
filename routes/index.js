var express = require('express');
var router = express.Router();
var extend = require('util')._extend;
var path = require('path');
var fs = require('fs');
var cheerio = require('cheerio');
var async = require('async');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var nodemailer = require('nodemailer');


var player = require('../models/players');
var Logs = require('../models/logs');

/* GET index page. */
router.get('/', function (req, res, next) {
    res.render('index');
});

router.post('/player/forgot', function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            player.findOne({email: req.body.email}, function (err, user) {
                if (!user) {
                    res.json({code: 1, message: 'No account with that email address exists.'});
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
        function (token, user, done) {
            var smtpTransport = nodemailer.createTransport("smtps://" + process.env.EMAIL + ":" + encodeURIComponent(process.env.PASSWORD) + "@smtp.gmail.com:465");
            var mailOptions = {
                to: user.email,
                from: '"IEEE VIT" enigma.ieeevit@gmail.com',
                subject: 'Enigma - Reset Password',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                if (err) {
                    console.log(err);
                    res.json({code: 1, message: 'Failed to send e-mail. Please try again.'});
                }
                else {
                    res.json({code: 0, message: 'An e-mail has been sent with further instructions.'});
                }
            });
        }
    ], function (err) {
        if (err) return next(err);
    });
});


router.get('/reset/:token', function (req, res) {
    player.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
    }, function (err, user) {
        if (!user) {
            // res.send('Password reset token is invalid or has expired.');
            res.json('update', {
                mainMessage: 'Password reset token is invalid or has expired.',
                trailingMessage: 'Go back'
            });
        }
        else
            res.redirect('/#!resetPassword/' + req.params.token);
    });
});

router.post('/reset/:token', function (req, res) {
    async.waterfall([
        function (done) {
            player.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: {$gt: Date.now()}
            }, function (err, user) {
                if (!user) {
                    res.json({code: 1, message: 'Password reset token is invalid or has expired.'});
                }
                else if (req.body.password !== req.body.confirm) {
                    res.json({code: 1, message: 'Passwords do not match.'});
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
        function (user, done) {
            var smtpTransport = nodemailer.createTransport("smtps://" + process.env.EMAIL + ":" + encodeURIComponent(process.env.PASSWORD) + "@smtp.gmail.com:465");
            var mailOptions = {
                to: user.email,
                from: '"IEEE VIT" enigma.ieeevit@gmail.com',
                subject: 'Enigma - Your password has been changed',
                text: 'Hello,\n\n' +
                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                if (err)
                    console.log(err);
                else
                    console.log("Email Sent !");
            });
        }
    ], function (err) {
        res.redirect('/');
    });
});

// router.get('/resend', function(req, res, next) {
//     res.render('resend');
// });

router.get('/resend', function (req, res) {
    // var email = req.body.email;
    var success = true;
    // var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    // if (!re.test(email)) {
    //     res.json({code: 1, message: 'Invalid email!'});
    //     success = false;
    // }
    if (success) {
        player.find({authcomp: false}, function (err, user) {
            if (!user) {
                res.json({code: 1, message: 'No account with this email address exists.'});
            }
            else {
                for (var i = 0; i < user.length; i++) {
                    if (!user[i].authcomp) {
                        var s = req.headers.host + '/auth/' + "verifyMail?code=" + user[i].hashcode + "&email=" + user[i].email;
// load in the json file with the replace values

                        var smtpTransport = nodemailer.createTransport("smtps://" + process.env.EMAIL + ":" + encodeURIComponent(process.env.PASSWORD) + "@smtp.gmail.com:465");
                        var mailOptions = {
                            to: user[i].email,
                            from: '"IEEE VIT" enigma.ieeevit@gmail.com',
                            subject: 'Enigma Authentication',
                            text: "Congratulations on getting registered for Enigma 4.0." + "\n\n" +
                            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                            "http://" + req.headers.host + '/auth/' + "verifyMail?code=" + user[i].hashcode + "&email=" + user[i].email + "\n\n" +
                            "If you did not intend to register for Enigma 4.0 kindly ignore this message."
                        };
                        smtpTransport.sendMail(mailOptions, function (err) {
                            if (err)
                                throw err;
                            else
                                res.json({code: 0, message: "Verify your email address using the link sent to you."});
                            console.log("Email Sent");
                        });
                        // Invoke the next step here however you like
                        // Put all of the code here (not the best solution)
                    }
                    else {
                        res.json({code: 1, message: 'You have already verified this Email-ID'});
                    }
                }
            }
        });
    }
});

module.exports = router;