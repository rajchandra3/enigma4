/**
 * Created by Raj Chandra on 9/1/2017.
 */
var express = require('express');
var router = express.Router();

//Environment variables not working in  /dashboard using manual value
var jwt = require('jsonwebtoken');
var player = require('../models/players');
var question = require('../models/question');
var Logs = require('../models/logs');

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


/* GET home page. */
router.get('/',authenticateTime, function(req, res, next) {
    var playerId = req.decoded._doc._id;
    player.findCurrentPlayerId(playerId,function (err, playerData) {
        if (err) {
            throw err;
        }
        // else if(current_TIME <= Start_time) //start time is not defined
        //     res.send('Access denied till Enigma Begins !!');
        else {
            res.render('question',{
                    timeRem : new Date(process.env.START_TIME - new Date()).toString(),
                    timeNow : new Date().toString(),
                    timeOfStart : new Date(1519383000000).toString()
            });
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
                    throw err;
                }
                que.ans = que.cans = que.hint = "";

                if(que.qno == 8){
                    if(data.mode == 1){ //for good imageUrl[0]
                        que.imageUrl[1] = "";
                    }
                    else if(data.mode == 2){ //for evil imageUrl[1]
                        que.imageUrl[0] = "";
                    }
                }
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
            question.findQuestion(playerData.currqno, function (err, que) {
                if (err) {
                    throw err;
                }
                else {
                    var f = 1;
                    if (f) {
                        //checking for correct answer
                        cans_pool = (que.cans).split(',');
                        for (var i = 0; i < cans_pool.length; i++) {
                            if (answer === cans_pool[i]) {
                                code = 1;
                                f = 0;
                                if(playerData.currqno % 5 == 0){ //need to change this to 5
                                    var new_hint = playerData.hint + 2;
                                }
                                else{
                                    var new_hint = playerData.hint;
                                }
                                var new_qno = playerData.currqno + 1;
                                var new_solvedFirst = playerData.solvedFirst +1;
                                var new_score = playerData.score;
                                var lastcorrect = {
                                    date: Date.now(),
                                    qno: playerData.qno
                                };
                                hintless =  max(playerData.solvedHintless, new_qno - playerData.lastHintUsed);

                                if (!que.solved) {
                                    new_score += 110;
                                    player.update(
                                        {"_id": playerData._id},
                                        {$set: {currqno: new_qno, score: new_score,hint : new_hint, solvedFirst : new_solvedFirst, lastcorrect: lastcorrect, solvedHintless: hintless}},
                                        function (err, data) {
                                            if (err) throw(err);
                                        });
                                    question.update(
                                        {"_id": que._id},
                                        {$set: {solved: true}},
                                        function (err, data) {
                                            if (err) throw(err);
                                        });
                                }
                                else {
                                    new_score += 100;
                                    player.update(
                                        {"_id": playerData._id},
                                        {$set: {currqno: new_qno, score: new_score,hint : new_hint, lastcorrect: lastcorrect, solvedHintless: hintless}},
                                        function (err, data) {
                                            if (err) throw(err);
                                        });
                                }
                                break;
                            }
                        }
                        if (f)
                            f++;
                    }
                    if (f == 2) {
                        //checking for nearest correct answer
                        ans_pool = (que.ans).split(',');
                        for (var i = 0; i < ans_pool.length; i++) {
                            if (answer === ans_pool[i]) {
                                code = 2;
                                f = 0;
                                break;
                            }
                        }
                        //for wrong answer
                        if (f==2) {
                            var words = ["fuck this shit","shit","crap","chutiya","chut","madarchod","fuck","fucked","fuck off", "maa chuda", "lauda", "luda", "fuck enigma", "motherfucker", "mother fucker","behenchod","kutta","teri maa ki chut","bhosada","randi","wtf","what the fuck"];
                            for (var i = 0; i < words.length; i++) {
                                if (answer === words[i]) {
                                    code = 3;
                                    f = 0;
                                    break;
                                }
                            }
                        }
                        //if enitrely wrong
                        if (f==2) {
                            code = 0;
                        }
                    }
                    if (code === 1)
                        status = true;
                    else
                        status = false;
                    //UPDATE THE LOGS
                    var post = new Logs({
                        player: playerData.name,
                        points: playerData.score,
                        time: curr,
                        answer: answer,
                        qno: playerData.currqno,
                        correct: status
                    });
                    post.save(function (err) {
                        if (err) {
                            return err;
                        }
                        else {
                            switch (code) {
                                case 0:
                                    res.json({code: 0, msg: "Wrong"});
                                    break;
                                case 1:
                                    res.json({code: 1, msg: "Correct"});
                                    break;
                                case 2:
                                    res.json({code: 2, msg: "You are close"});
                                    break;
                                case 3:
                                    res.json({code: 3, msg: "Cool down"});
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
