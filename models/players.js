/**
 * Created by Raj Chandra on 7/26/2017.
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
    name : {type:String},
    hashcode:{type : String},
    password: { type : String,required: true},
    reg_no:{type : String},
    organisation: {type : String,default: "VIT University"},
    email:{type : String,unique : true,lowercase : true,required: true},
    phone:{type : String, required : true, maxlength: 15},
    date:{type:Date, default: Date.now},//to track the time of registration
    authcomp:{type: Boolean, default: true},
    currqno : {type: Number, default : 1},
    hint: {type: Number, default : 2},
    lastHintUsed: { type: Number, default : 0},
    currentQueAttempts : {type : Number,default :0},
    score : {type: Number, default : 0},
    developer : {type : Boolean, default : false},
    resetPasswordToken : String,
    resetPasswordExpires : Date,
    gender: {type: String},
    answerLog :[{
        questionNumber : {type : Number},
        hintUsed : {type : Boolean},
        attempts : {type : Number},
        solved : {
            status : Boolean,
            rank : Number,
            time : Date
        }
    }],
    achievements : {
        status: {type : Array,default : [false,false,false,false,false]},
        progress: {type : Array, default : [0,0,0,0,0]}
    }
});

playerSchema.methods.verifyPassword = function (password, callback) {
    bcrypt.compare(password, this.password, function (err, res) {
        if (err) {
            callback(err, null);
        }
        else if (!res) {
            callback("Incorrect Password!", false);
        }
        else {
            callback(res, true);
        }
    });
};

var player = module.exports = mongoose.model('player', playerSchema);

//Finding the Player by Id
module.exports.findCurrentPlayerId = function (id, callback) {
    player.findOne({_id: id}, callback);
};

