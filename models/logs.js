/**
 * Created by Raj Chandra on 9/3/2017.
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var logSchema = new Schema({
    player : {type: String},
    points:{ type: Number},
    time:{type:Date},
    qno:{type: Number},
    answer:{type:String},
    correct:{type:Boolean}
});

var logs = module.exports = mongoose.model('logs', logSchema);