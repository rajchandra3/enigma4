/**
 * Created by Raj Chandra on 9/1/2017.
 */

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var questionsSchema = new Schema({
    questionDesc: {type:String}, //question
    questionNumber: {type:Number}, //question number
    correctAnswer : {type : [String]}, //correct answer pool
    closeAnswer : {
            shortAnswer : [String],
            mediumAnswer : [String]
        },//close answer
    hint : {type : String},//When asked for hint..this is to be displayed
    imageUrl : [{type : String}],// to store the image url form cloudinary
    audioUrl : {type : String},// to store the audio url form cloudinary
    special :{type : Boolean, default : false},// make it tue if the question special
    solved : {type : Boolean, default : false}, //give bonus when solved the first time
    solvedBy : {type : Number, default: 0}
});

var questions = module.exports = mongoose.model( 'questions' , questionsSchema );

//Add  data
module.exports.addData = function (data, callback) {
    questions.create(data,callback);
}

//Show data
module.exports.getData=function (callback,limit) {
    questions.find(callback).limit(limit);
}
//Find data by id
module.exports.findDataById=function (id, callback) {
    questions.findOne({_id : id}, callback);
}

//finding Question by qno
module.exports.findQuestion=function (qno, callback) {
    questions.findOne({qno : qno}, callback);
}

//Update data using id
module.exports.updateData = function(id, data, options, callback) {
    var query = {_id: id};
    var update = {
        que:data.que,
        qno: data.qno,
        imageUrl : data.imageUrl,
        audioUrl : data.audioUrl,
        ans : data.ans,
        cans:data.cans,
        hint : data.hint,
        special: data.special,
        solved: data.solved
    }
    console.log(update,query);
    questions.findOneAndUpdate(query, update, options, callback);
}

//delete data
module.exports.removeData = function (id, callback) {
    var query = {_id : id};
    questions.remove(query,callback);
}