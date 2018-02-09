/**
 * Created by Raj Chandra on 7/26/2017.
 */

var jwt = require('jsonwebtoken');
var player = require('./models/players.js');

function authenticate(req, res) {
    if (req.body.email && req.body.password) {
        authenticate_user(req.body.email, req.body.password, function (err, user) {
            if(err){
                res.send({code: 0,message: "Something went wrong! Please try again."});
            }
            else if(user === 1){
                res.send({code: 0,message : 'You have not registered for this competition. Please register and try logging in.'});
            }
            else if(user === 2){
                res.send({code: 0,message : 'Incorrect Password !'});
            }
            else if(user === 3){
                res.send({code: 0,message : "You haven't verified your email ! Make sure You have verified your email."});
            }
            else {
                var token = jwt.sign(user, process.env.SECRET);
                user.password = '';
                //don't set cookies till the game begins

                res.cookie(process.env.TOKEN_NAME,token);

                // return the information including token as JSON
                res.json({
                    code: 1 ,
                    user : user
                });
            }
        })
    }
}

function authenticate_user(email, password, callback) {
    player.findOne({ email: email }, function (err, user) {
        if (err) {
            return callback(err, null);
        }
        else if (!user) {
            return callback(null, 1);
        }
        else if(!user.authcomp){
            return callback(null, 3);
        }
        user.verifyPassword(password, function (error, value) {
            if(value){return callback(null, user);}
            else {return callback(null, 2);}
        });
    });
}

function check_token(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.cookies[process.env.TOKEN_NAME];
    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, process.env.SECRET, function(err, decoded) {
            if (err) {
                res.redirect('/');
                // return res.json({code: 0,message: "Your session expired or You haven't logged in! Please try logging in :)"});
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    }
    else {
        return res.status(403).send('You do not belong here. Go back to hackerland ;)');
    //    json({code :0,message: "You are not authorized to visit this URL."});
    }
}

module.exports = {authenticate: authenticate, verify_token: check_token};