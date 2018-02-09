/**
 * Created by IEEE on 9/2/2017.
 */
var express = require('express');
var router = express.Router();


var jwt = require('jsonwebtoken');
var player = require('../models/players');
var question = require('../models/question');
var logs = require('../models/logs');

var authenticate = require('../authenticate');
router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, enigmaPlayer-access-token");
    if (req.method === 'OPTIONS') {
        var headers = {};
        headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = false;
        res.writeHead(200, headers);
        res.end();
    } else {
        authenticate.verify_token(req, res, next);
    }
});

//middleware this is
var adminAuthentication = function(req, res, next){
    var playerId = req.decoded._doc._id;
    player.findCurrentPlayerId(playerId,function (err, playerData) {
        if (err) {
            throw err;
        }
        else if(playerData.developer){
            next();
        }
        else
            res.send('<h1><b>Not Found</b></h1>');
    });
}

//to let the admin access member data
router.get('/players',adminAuthentication, function (req, res) {
    player.find()
        .sort({num: -1, score: -1, answer_time: 1})
        .select('username score')
        .limit(100)
        .exec(function (err, docs) {
            res.json(docs);
        });
});


router.get('/',adminAuthentication,function (req,res) {
    res.render('admin');
})

// <---- the data  ---->
router.get('/q',adminAuthentication,function (req,res) {
    question.getData(function (err, data) {
        if(err){
            throw err;
        }
        res.json(data);
    });
});
// <---- This is for find data by Id  ---->
router.get('/q/data/:_id',adminAuthentication,function (req,res) {
    var playerId = req.decoded._doc._id;
    question.findDataById(req.params._id,function (err, data) {
        if(err){
            throw err;
        }
        res.json(data);
    });
});
// <---- This is for Adding  data ---->
router.post('/q/add',adminAuthentication,function (req,res) {
    var data = req.body;
    var playerId = req.decoded._doc._id;
    data.solved = false;
    question.addData(data, function (err) {
        if (err) {
            res.send("an error occured!");
        }
        else {
            res.redirect('/#!q');
        }
    });
});

// <---- This is for updating a DATA---->
router.put('/q/update/:_id',adminAuthentication,function (req,res) {
    var qid = req.params._id;
    var info=req.body;
    var playerId = req.decoded._doc._id;
    question.updateData(qid,info,{}, function (err, data) {
        if(err){
            throw err;
        }
        res.json(data);
    });
});

// <---- This is for removing users by Admin ---->
router.delete('/q/delete/:_id',adminAuthentication,function (req,res) {
    var id = req.params._id;
    question.removeData(id, function (err, data) {
        if(err){
            throw err;
        }
        res.json(data);
    });
});


// <---- This is for getting user responses by Admin ---->
router.post('/playerLog',adminAuthentication,function (req,res) {
    var playerName = req.body.name;
        player.find({'name' : playerName},function (err, playerData) { //to mentain security
            if (err) {
                throw err;
            }
            else if(!playerData){
                res.send("No player with this name found !");
            }
            else{
                logs.find({'player' : playerName}).sort({time : -1,qno: 1}).exec(function(error,log){
                    if(error)
                        throw error;
                    else if(log)
                        res.json(log);
                    else
                        res.send("player has no attempts");
                });
            }
    });
});

// <---- This is for getting top 20 players ---->
router.get('/leaders',adminAuthentication,function (req,res) {
    player.find({}).sort({score:-1}).limit(20).exec(function (err, playerData) { //to mentain security
        if (err) {
            throw err;
        }
        else{
            res.json(playerData);
        }
    });
});

// <---- This is for getting graph ---->
router.get('/graph',adminAuthentication,function (req,res) {
    logs.find({}).sort({time : 1}).select('time correct').exec(function (err, logs) { //to mentain security
        if (err) {
            throw err;
        }
        else{
            res.json(logs);
        }
    });
});

module.exports = router;