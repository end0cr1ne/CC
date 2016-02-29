var mongoose = require('mongoose');
var auth = require('passport-local-mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    projects: [{name:String,files:[{
        name:String,
        doc:String
    }]}]
});
User.plugin(auth,{digestAlgorithm:'sha256'});
module.exports = mongoose.model('User', User);
