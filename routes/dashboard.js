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
            res.render('questionwhite');
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
    player.findCurrentPlayerId(id,function (err, data) {
        if(err){
            throw err;
        }
        else{
            question.findQuestion(data.currqno,function (err,que) {
                if(err){
                    console.log(err);
                    // throw err;
                }

                // console.log(que);
                que.correctAnswer = que.closeAnswer = que.hint = "";
                res.json({queData : que, playerData : data});
            })
        }
    });
});

router.post('/question',authenticateTime,function(req,res){
    var answer = req.body.answer;
    var curr = Date.now();
    var playerId = req.decoded._doc._id;
    var code = 0;
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
                    for(var i=0;i<queData.correctAnswer.length;i++){
                        if(answer == queData.correctAnswer[i]){
                            var caseCode = 1;
                            break;
                        }
                    }

                    switch(caseCode){
                        case 0: // For wrong answer
                            //checking for correct answer
                            var shortAnsPool = queData.closeAnswer.shortAnswer;
                            var newstr = answer.replace( /[^a-zA-Z]/, ""); //Remove all non-alpha chars
                            var wordsInAnswer = newstr.split(' ');  //Extracting each word
                            for (var i = 0; i < wordsInAnswer.length; i++) {
                                if (shortAnsPool.indexOf(wordsInAnswer[i].toLowerCase()) > -1) {
                                    code = 1;
                                    break;
                                }
                            }
                            if(code!=1){
                                mediumAnsPool = queData.closeAnswer.mediumAnswer;
                                for (var i = 0; i < wordsInAnswer.length; i++) {
                                    if (mediumAnsPool.indexOf(wordsInAnswer[i].toLowerCase()) > -1) {
                                        code = 2;
                                        break;
                                    }
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
                            var new_qno = ++playerData.currqno;
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
                                            break;
                                        case 3://Achievement 4: Cruise Control
                                            if((new_qno == 11) && (((Date.now() - process.env.START_TIME)/3600000) <= 10)){
                                                badgeUpdate.status[i] = true;
                                                badgeUpdate.progress[i] = 10;
                                            } else if (new_qno<11 && (((Date.now() - process.env.START_TIME)/3600000) <= 10)){
                                                badgeUpdate.progress[i] = --new_qno;
                                            } else {
                                                badgeUpdate.progress[i] = new_qno;
                                            }
                                            break;
                                        case 4://Achievement 5: Hintless
                                            var hintless = 0;
                                            for(var j=1;j<new_qno;j++){
                                                (playerData.answerLog[j].solved.hintUsed)?hintless =0:hintless+=1;
                                            }
                                            if(hintless==5) {
                                                badgeUpdate.status[i] = true;
                                                badgeUpdate.progress[i] = 5;
                                            } else {
                                                badgeUpdate.progress[i] = hintless;
                                            }
                                            break;
                                    }
                                }
                            }

                            //checking whether the user is first to solve
                            if (!queData.solved) {
                                var new_score = 110;

                                //update the question data if solved by anyone
                                question.update(
                                    {_id: queData._id},
                                    {$set: {solved: true}},
                                    function (err, data) {
                                        if (err) throw(err);
                                    });
                            }
                            else {
                                var new_score = 100;
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
                                attempts: playerData.currentQueAttempt+1,
                                "solved.status": true,
                                "solved.rank" : solvedBy+1,
                                "solved.time" : Date.now()
                            };

                            newAnswerLog = {
                                questionNumber: playerData.currqno + 1,
                                hintUsed: false,
                                attempts: 0,
                                "solved.status": false
                            };
                            //update the playerData
                            player.update(
                                {"_id": playerData._id, "answerLog.questionNumber" : playerData.currqno},
                                {$set: {currqno: new_qno,currentQueAttempts : 0, score: new_score, hint : new_hint, achievements: badgeUpdate, "answerLog.$" : answerLogsUpdate},$push: { answerLog: newAnswerLog} },
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
                                    res.json({code, msg: "Correct",taunt:taunt});
                                    break;
                                case 1:
                                    res.json({code, msg: "Short",taunt:taunt});
                                    break;
                                case 2:
                                    res.json({code, msg: "Medium",taunt:taunt});
                                    break;
                                case 3:
                                    res.json({code, msg: "Long",taunt:taunt});
                                    break;
                            }
                        }
                    });
                }
            });
        }
    });
});


router.get('/hint', function(req, res) {
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
router.get('/mini', function(req, res) {
    player.find({authcomp: true}).select("name score currqno date").sort({score: -1}).exec(function(err, docs){
        res.json(docs);
    });
});

router.get('/achievements', function(req,res){
    var playerId = req.decoded._doc._id;
    var enigmaStart = new Date(2018, 2, 23, 16, 20, 0, 0).getTime();
    var enigmaTenHours = new Date(2018, 2, 24, 2, 30, 0, 0).getTime();

    var achievementsJson = {
        "a1": {
            status: false,
            progress: 0
        },
        "a2": {
            status: false,
            progress: 0
        },
        "a3": {
            status: false,
            progress: 0
        },
        "a4": {
            status: false,
            progress: 0
        },
        "a5": {
            status: false,
            progress: 0
        },
    };

    player.findCurrentPlayerId(playerId,function (err, playerData) {
        if(err){
            throw(err);
        }

        if(playerData.currqno >= 2){
            achievementsJson.a1.status = true;
            achievementsJson.a1.progress = 1;
        }

        if(playerData.solvedFirst >= 1){
            achievementsJson.a2.status = true;
            achievementsJson.a2.progress = playerData.solvedFirst;
            achievementsJson.a3.progress = playerData.solvedFirst;
        }

        if(playerData.solvedFirst >= 3){
            achievementsJson.a3.status = true;
            achievementsJson.a3.progress = playerData.solvedFirst;
        }

        //Update a4 here (solved 10 questions before 10 hours)

        achievementsJson.a5.progress = playerData.solvedHintless;
        if(playerData.solvedHintless >= 5){
            achievementsJson.a5.status = true;
        }
    });

    res.json(achievementsJson);
});

module.exports = router;
