/**
 * Created by Raj Chandra on 9/1/2017.
 */
var express = require('express');
var router = express.Router();
var path        = require('path');
var fs = require('fs');
//Environment variables not working in  /dashboard using manual value
var jwt = require('jsonwebtoken');
var player = require('../models/players');
var question = require('../models/question');
var Logs = require('../models/logs');
// to fetch taunts
let reqPath = path.join(__dirname, '../utilities/taunts.json');
var allTaunts = JSON.parse(fs.readFileSync(reqPath, 'utf8'));

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

/* middle ware to check the end time
* This will restrict the request from
* 1. get -> /dashboard/question  | This sends the question to the frontend
* 2. post -> /dashboard/question | This accepts the answer from the frontend
* 3. get -> /dashboard           | This sends the question page to the frontend
 */

var authenticateTime = function(req, res, next){
    var currentTime = new Date().getTime(); //getting time in milliseconds
    var playerId = req.decoded._doc._id;
    player.findCurrentPlayerId(playerId,function (err, playerData) {
        if (err) {
            throw err;
        }
        else if (playerData.developer) {
            next();
        }
        else if (currentTime < process.env.START_TIME) {
            res.render('timer');
        }
        else if(currentTime > process.env.END_TIME){
            res.render('update',{
                mainMessage : "Enigma has ended !",
                trailingMessage : "show leaderboard"
            });
        }
        else if (currentTime >= process.env.START_TIME && currentTime <= process.env.END_TIME) {
            next();
        }
    });
}
var authenticateDeveloper = function(req, res, next){
    var playerId = req.decoded._doc._id;
    player.findCurrentPlayerId(playerId,function (err, playerData) {
        if (err) {
            throw err;
        }
        else if (playerData.developer) {
            next();
        }
        else{
            res.send("Unauthorized Access!");
        }
    });
}

router.get('/leaderboard', function(req,res) {
    player.find({}).select('name organization score currqno').sort({score:-1}).limit(100).exec(function (err, playerData) { //to mentain security
        if (err) {
            throw err;
        }
        else{
            res.json(playerData);
        }
    });
});

/* GET stats page. */
router.get('/stats', function (req, res, next) {
    var count = player.find({}, (err, data) => {
    if (err)
        console.log(err);
    else
        res.render('stats', {
            playerCount: data.length
        });
    });
});

/* GET home page. */
router.get('/',authenticateTime, function(req, res, next) {
    var playerId = req.decoded._doc._id;
    player.findCurrentPlayerId(playerId,function (err, playerData) {
        if (err) {
            throw err;
        }
        else {
            res.render('question');
            // res.render('question',{
            //         timeRem : new Date(process.env.START_TIME - new Date()).toString(),
            //         timeNow : new Date().toString(),
            //         timeOfStart : new Date(1519383000000).toString()
            // });
        }
    });
});

router.get('/currentUser', function(req, res) {
    var id = req.decoded._doc._id;
    player.findCurrentPlayerId(id,function (err, data) {
        if (err) {
            throw err;
        }
        else {
            res.json(data);
        }
    });
});

router.get('/question',authenticateTime, function(req, res) {
    var id = req.decoded._doc._id;
    player.findOne({_id : id},'name currqno hint score',function (err, data) {
        if(err){
            throw err;
        }
        else{
            question.findOne({questionNumber : data.currqno},'questionNumber questionDesc imageUrl audioUrl special',function (err,que) {
                if(err){
                    console.log(err);
                    // throw err;
                }
                else
                    res.json({queData : que, playerData : data});
            });
        }
    });
});

router.post('/question',authenticateTime,function(req,res){
    var answer = req.body.answer;
    var curr = Date.now();
    var playerId = req.decoded._doc._id;
    var code = 0;
    var taunt = '';
    player.findCurrentPlayerId(playerId,function (err, playerData) {
        if (err) {
            throw err;
        }
        else {
            question.findQuestion(playerData.currqno, function (err, queData) {
                if (err) {
                    throw err;
                }
                else {

                    var playerUpdate = playerData;
                    var currAnswerLog = playerData.answerLog.filter(function (obj) {
                        return obj.questionNumber == playerData.currqno;
                    })[0];

                    var caseCode = 0;
                    if(queData.correctAnswer.includes(answer)) caseCode = 1;

                    switch(caseCode){
                            case 0: // For wrong answer
                            //checking for correct answer
                                var shortAnsPool = queData.closeAnswer.shortAnswer;
                                var newstr = answer.replace( /[^a-zA-Z]/, ""); //Remove all non-alpha chars
                                if (shortAnsPool.indexOf(newstr.toLowerCase()) > -1) {
                                    code = 1;
                                }
                                if(code!=1){
                                    var mediumAnsPool = queData.closeAnswer.mediumAnswer;
                                    if (mediumAnsPool.indexOf(newstr.toLowerCase()) > -1) {
                                        code = 2;
                                    }
                                    code = (code!==2)?3:2;
                                }
                                //update the playerData
                                player.update(
                                    {"_id": playerData._id, "answerLog.questionNumber" : playerData.currqno},
                                    {$inc: {"answerLog.$.attempts" : 1},$inc : {currentQueAttempts : 1}},
                                    function (err, data) {
                                        if (err) throw(err);
                                    });
                                break;

                        case 1: // for correct answer
                            var new_hint = (playerData.currqno%5==0)? playerData.hint+2:playerData.hint;
                            var new_qno = playerData.currqno+1;
                            //achievements
                            var badge = playerData.achievements;
                            var badgeUpdate = badge;

                            for(var i = 0;i < badge.status.length;i++){
                                if(!badge.status[i]){
                                    switch(i){
                                        case 0://Achievement 1: Welcome!
                                            if(new_qno > 1){
                                                badgeUpdate.status[i] = true;
                                                badgeUpdate.progress[i] = 1;
                                            }
                                            break;
                                        case 1://Achievement 2: Early Bird
                                            var topCounter = 0;
                                            topCounter += (queData.solved)?0:1;

                                            if(topCounter==1) {
                                                badgeUpdate.status[i] = true;
                                                badgeUpdate.progress[i] = 1;
                                            }
                                            break;
                                        case 2://Achievement 3: On a Roll
                                            var topCounter = 0;
                                            if(playerData.answerLog.length>=3){
                                                for(var j=1;j<new_qno;j++){
                                                    topCounter += (playerData.answerLog[j].solved.rank ==1)?1:0;
                                                }
                                                topCounter += (queData.solved)?0:1;
                                                if(topCounter==3) {
                                                    badgeUpdate.status[i] = true;
                                                    badgeUpdate.progress[i] = 3;
                                                } else {
                                                    badgeUpdate.progress[i] = topCounter;
                                                }
                                            }
                                            break;
                                        case 3://Achievement 4: Cruise Control
                                            if((new_qno == 11) && (((Date.now() - process.env.START_TIME)/3600000) <= 10)){
                                                badgeUpdate.status[i] = true;
                                                badgeUpdate.progress[i] = 10;
                                            } else if (new_qno<11 && (((Date.now() - process.env.START_TIME)/3600000) <= 10)){
                                                badgeUpdate.progress[i] =new_qno-1;
                                            } else {
                                                badgeUpdate.progress[i] = new_qno;
                                            }
                                            break;
                                        case 4://Achievement 5: Hintless
                                            var hintless = 0;
                                            if(playerData.answerLog>=5){
                                                for(var j=1;j<new_qno;j++){
                                                    (playerData.answerLog[j].solved.hintUsed)?hintless =0:hintless+=1;
                                                }
                                                if(hintless==5) {
                                                    badgeUpdate.status[i] = true;
                                                    badgeUpdate.progress[i] = 5;
                                                } else {
                                                    badgeUpdate.progress[i] = hintless;
                                                }
                                            }
                                            break;
                                    }
                                }
                            }

                            //checking whether the user is first to solve
                            if (!queData.solved) {
                                var new_score = 110+ playerData.score;

                                //update the question data if solved by anyone
                                question.update(
                                    {_id: queData._id},
                                    {$set: {solved: true}},
                                    function (err, data) {
                                        if (err) throw(err);
                                    });
                            }
                            else {
                                var new_score = 100 + playerData.score;
                            }

                            var solvedBy = queData.solvedBy;

                            question.update({_id: queData._id}, {$inc: {solvedBy:1}},
                                function (err, data) {
                                    if (err) throw(err);
                                });


                            var hintUsedStatus = (playerData.lastHintUsed==playerData.currqno)?false:true;

                            //update the player answer log
                            answerLogsUpdate = {
                                questionNumber : playerData.currqno,
                                hintUsed :hintUsedStatus,
                                attempts: playerData.currentQueAttempts+1,
                                "solved.status": true,
                                "solved.rank" : solvedBy+1,
                                "solved.time" : Date.now()
                            };

                            //update the playerData
                            player.update(
                                {"_id": playerData._id},
                                {$set: {currqno: new_qno,currentQueAttempts : 0, score: new_score, hint : new_hint, achievements: badgeUpdate},$push: { answerLog: answerLogsUpdate} },
                                function (err, data) {
                                    if (err) throw(err);
                                });
                            break;
                    }

                    //FETCH TAUNT
                    if(code==1){
                        taunt = allTaunts.short[Math.floor(Math.random()*allTaunts.short.length)];
                    }
                    else if(code==2){
                        taunt = allTaunts.medium[Math.floor(Math.random()*allTaunts.medium.length)];
                    }
                    else if(code==3){
                        taunt = allTaunts.long[Math.floor(Math.random()*allTaunts.long.length)];
                    }
                    //UPDATE THE LOGS
                    if(taunt.indexOf('[name]') !== -1)
                    {
                        taunt = taunt.replace("[name]", playerData.name);
                    }
                    var post = new Logs({
                        player: playerData.name,
                        points: playerData.score,
                        time: curr,
                        answer: answer,
                        qno: playerData.currqno,
                        correct: code
                    });
                    post.save(function (err) {
                        if (err) {
                            return err;
                        }
                        else {
                            switch (code) {
                                case 0:
                                    res.json({code : 0, msg: "Correct",taunt:"Awesome !"});
                                    break;
                                case 1:
                                    res.json({code : 1, msg: "very close",taunt:taunt});
                                    break;
                                case 2:
                                    res.json({code : 1, msg: "Close",taunt:taunt});
                                    break;
                                case 3:
                                    res.json({code : 2, msg: "Wrong",taunt:taunt});
                                    break;
                            }
                        }
                    });
                }
            });
        }
    });
});


router.post('/hint', function(req, res) {
    var playerId = req.decoded._doc._id;
    player.findCurrentPlayerId(playerId,function (err, playerData) {
        if (err) {
            throw err;
        }
        else if(playerData.hint <= 0){
            res.json({msg : "You have used all your hints.", hintRem :playerData.hint});
        }
        else {
            question.findQuestion(playerData.currqno, function (err, que) {
                if (err) {
                    throw err;
                }
                else if(playerData.currqno === playerData.lastHintUsed){
                    res.json({msg : que.hint, hintRem : playerData.hint});
                }
                else{
                    var new_hint = playerData.hint -1;
                    var new_lastHintUsed = playerData.currqno;
                    player.update(
                        {"_id": playerData._id},
                        {$set: {hint: new_hint , lastHintUsed : new_lastHintUsed}},
                        function (err, data) {
                            if (err) throw(err);
                        });
                    res.json({msg : que.hint, hintRem : new_hint});
                }
            });
        }
    });
});


router.get('/achievements', function(req, res) {
    var playerId = req.decoded._doc._id;
    player.find({_id : playerId},'achievements',function(err, docs){
        res.json(docs);
    });
});

router.get('/mini', function(req, res) {
    player.find({authcomp: true}).select("name score currqno date").sort({score: -1,date : 1}).exec(function(err, docs){
        res.json(docs);
    });
});

//leaderboard put here for time being
router.post('/leaderboard', (req, res) => {
    player.find({authcomp: true}).select("name organisation score currqno date").sort({score: -1,date : 1}).limit(100).exec(function (err, docs) {
        res.json(docs);
    });
});

// <---- This is for getting user responses by Admin ---->
router.post('/playerLog', function (req, res) {
    var playerName = req.body.name;
    player.find({'name': playerName}, function (err, playerData) { //to mentain security
        if (err) {
            throw err;
        }
        else if (!playerData) {
            res.send("No player with this name found !");
        }
        else {
            Logs.find({'player': playerName}, (error, log) => {
                if (error)
                throw error;
        else if (log)
                res.json({
                    name: playerName,
                    attempts: log.length
                });
            else
                res.send("player has no attempts");
        });
        }
    });
});

// router.get('/achievements', function(req,res){
//     var playerId = req.decoded._doc._id;
//     player.findCurrentPlayerId(playerId,function (err, playerData) {
//         if(err){
//             throw(err);
//         }
//         res.json(playerData.achievements);
// });

module.exports = router;
