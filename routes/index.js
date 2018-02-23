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

function sendVerificationEmail(email, random, callback) {
    let smtpTransport = nodemailer.createTransport("smtps://" + process.env.EMAIL + ":" + encodeURIComponent(process.env.PASSWORD) + "@smtp.gmail.com:465");
    let mailOptions = {
        to: email,
        from: '"IEEE VIT" enigma.ieeevit@gmail.com',
        subject: 'Enigma Authentication',
        text: "Congratulations on getting registered for Enigma 4.0." + "\n\n" +
        "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
        'http://enigma.ieeevit.com/auth/verifyMail?code='+random+'&email=' + email + "\n\n" +
        "If you did not intend to register for Enigma 4.0 kindly ignore this message."
    };

    //Sending the mail
    smtpTransport.sendMail(mailOptions, function (err) {
        if (err)
            throw err;
        else
            callback({
                code: 0,
                message: email
            });
    });
}
router.get('/resend', function (req, res) {
        // player.find({authcomp : false}, function (err, user) {
        //     if (err)
        //         throw err;
        //     else
        //         var check = [];
        //     for (var i = 0; i < user.length; i++) {
        //         check.push(user[i].hashcode);
        //         // sendVerificationEmail(user[i].email,user[i].hashcode,(result)=>{
        //         //     console.log(result);
        //         // });
        //     }
        //     console.log(check);
        //     fs.writeFileSync('hc.json',check,'utf8');
        // });
            var data = fs.readFileSync('emails.json','utf8').split(',');
            var hc = fs.readFileSync('hc.json','utf8').split(',');
            for(var i=20;i<30;i++){

                sendVerificationEmail(data[i],hc[i],(result)=>{
                    console.log(result);
                });
            }
            res.send("Done");
});

module.exports = router;