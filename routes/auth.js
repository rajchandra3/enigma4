/**
 * Created by IEEE on 7/26/2017.
 */
var express = require('express');
var router = express.Router();
var request = require('request');

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
    // res.json({code: 1, message: 'Registrations have been closed for a while. It will be up soon'});
    //Google Captcha
    if(
        req.body.googleCaptcha===undefined ||
        req.body.googleCaptcha===null ||
        req.body.googleCaptcha===''
    ){
        console.log("No re-CAPTCHA !!!!!!")
        return res.json({code: 1, message: 'Please select the reCaptcha'});
    }
    const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_SECRET_KEY}&response=${req.body.googleCaptcha}&remoteip=${req.connection.remoteAddress}`;

        //make a req to veryfy the url
    request(verifyUrl,(error,response,body)=>{
        body = JSON.parse(body);

        //if Not success
        if(body.success !== undefined && !body.success){
            console.log('Failed re-captcha verification.');
            return res.json({code: 1, message: 'Failed re-captcha verification.'});
        }
        var success = true;
        var rand = Math.random().toString(36).slice(2);
        var hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
        var data = new player({
            name: req.body.name,
            password: hash,
            email: req.body.email,
            hashcode: rand,
            reg_no: req.body.reg_no,
            organisation: req.body.organisation,
            phone: req.body.phone,
            authcomp: true
        });
        if (!req.body.name || req.body.name.length > 25) {
            res.json({code: 1, message: 'Invalid Name'});
            success = false;
        }
        else if (!check.email.test(req.body.email) || !req.body.email || req.body.email.length > 35 || req.body.email.includes('darkweb.com')) {
            res.json({code: 1, message: 'Invalid E-MAIL'});
            success = false;
        }
        else if (!check.reg_no.test(req.body.reg_no)) {
            res.json({code: 1, message: 'Invalid Registration Number'});
            success = false;
        }
        else if (!check.reg_no.test(req.body.organisation)) {
            res.json({code: 1, message: 'Invalid University name'});
            success = false;
        }
        else if (!check.phone.test(req.body.phone) || !req.body.phone) {
            res.json({code: 1, message: 'Invalid Contact detail'});
            success = false;
        }
        else if (!check.password.test(req.body.password) || !check.password.test(req.body.cpassword)) {
            res.json({code: 1, message: 'Invalid Password'});
            success = false;
        }
        else if (req.body.password !== req.body.cpassword) {
            success = false;
        }
        else if (req.body.coupon !== undefined) {
            req.body.coupon = req.body.coupon.toLowerCase();
            var couponCodes = ['techloop', 'turing', 'alan turing', 'alan mathison turing', 'enigma'];
            for (var i = 0; i < couponCodes.length; i++) {
                if (req.body.coupon == couponCodes[i]) {
                    data.hint = 3;
                    break;
                }
            }
        }
        else if (success) {
            var captchaAns = ['WCX52G', 'F48DY8', 'HB7HE9', '3JFZRC', '3THSD1', 'XJVT24', 'XX8LMH', 'WG3JZS', '3GNFV9', 'K5KF5W', 'JRB9HG','6L7787','5PSKXR','UXZ4T1','XYW55W','DG6JHU','SE73D7','V7FVD6','ZRDCJA','QFC73B','29J5Y7'];
            if (captchaAns[req.body.imageAlt[req.body.imageAlt.length -1]] == req.body.captcha) {
                data.save(function (err, doc) {
                    if (err && err.code == 11000)
                        res.json({code: 1, message: 'This Email is Already registered!'});
                    else if (err && err.code != 66)
                        res.json({code: 1, message: 'Something is not right.'});
                    else if (err)
                        res.json({code: 1, message: 'Something went wrong.'});
                    else {
                        console.log("SUCCESSFULL REGISTRATION !!",req.body.name);
                        res.json({code: 0, message: "Login Now! Enigma has already started."});
                    }
                    // sendVerificationEmail(req.body.email, req.headers.host, rand, function (result) {
                    //     res.json(result);
                    // });
                });
            }
            else {
                console.log("failed!!!!!!!!!!!!");
                res.json({code: 1, message: "Invalid Captcha"});
            }
        }
    });
});
router.get('/serveImage',function (req,res,next){
    var randomNumber = Math.floor(Math.random()*9);
    var imageUsed = path.join(__dirname, '../utilities/captchas/'+randomNumber+'.png');
    fs.readFile(imageUsed, (err, data)=>{
        //error handle
        if(err) console.log(err);

        //get image file extension name
        let extensionName = path.extname(imageUsed);

        //convert image file to base64-encoded string
        let base64Image = new Buffer(data, 'binary').toString('base64');

        //combine all strings
        let imgSrcString = `data:image/${extensionName.split('.').pop()};base64,${base64Image}`;

        //send image src string into jade compiler
        res.json({img : imgSrcString, imgAlt :bcrypt.hashSync(imgSrcString, bcrypt.genSaltSync(10))+randomNumber});
    });
});
router.get('/verifyMail', function (req, res, next) {
    getEmailVerificationResult(req.query.email, req.query.code, function (result) {
        res.render('update', result);
    });
});

function sendVerificationEmail(email, host, random, callback) {
    let myobj = {email: email, hashcode: random, authcomp: false};
    let smtpTransport = nodemailer.createTransport("smtps://" + process.env.EMAIL + ":" + encodeURIComponent(process.env.PASSWORD) + "@smtp.gmail.com:465");
    let mailOptions = {
        to: email,
        from: '"IEEE VIT" enigma.ieeevit@gmail.com',
        subject: 'Enigma Authentication',
        text: "Congratulations on getting registered for Enigma 4.0." + "\n\n" +
        "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
        "http://" + host + '/auth/' + "verifyMail?code=" + myobj.hashcode + "&email=" + myobj.email + "\n\n" +
        "If you did not intend to register for Enigma 4.0 kindly ignore this message."
    };

    //Sending the mail
    smtpTransport.sendMail(mailOptions, function (err) {
        if (err)
            throw err;
        else
            callback({
                code: 0,
                message: "Verify your email address using the link sent to you.Check spam if not found."
            });
    });
}

function getEmailVerificationResult(email, code, callback) {
    if (!check.email.test(email))
        callback({
            mainMessage: "Incorrect Link !!",
            trailingMessage: "Ask to resend the mail."
        });

    else {
        player.findOne({email: email}, function (err, result) {
            if (err) throw err;

            if (!result)
                callback({
                    mainMessage: "You have not yet registered",
                    trailingMessage: "Click here to Register"
                });

            else if (result.authcomp)
                callback({
                    mainMessage: "Already authorized",
                    trailingMessage: "Click here to Log In"
                });

            else {
                if (check.code.test(code)) {
                    if (code !== result.hashcode)
                        callback({
                            mainMessage: "Incorrect Hash Code/Hash Code expired",
                            trailingMessage: "Ask to resend the mail."
                        });

                    else {
                        let newValues = result;
                        newValues.authcomp = true;

                        //Successfully change the authcomp variable to true, in order to allow login
                        player.updateOne({_id: result._id}, newValues, function (err, res1) {
                            if (err) throw err;
                            else {
                                callback({
                                    mainMessage: "Email Verified",
                                    trailingMessage: "Click here to login"
                                });
                            }
                        });
                    }
                }
                else
                    callback({
                        mainMessage: "Incorrect Hash Code/Hash Code expired",
                        trailingMessage: "Ask to resend the mail."
                    });
            }
        });
    }
}

module.exports = router;