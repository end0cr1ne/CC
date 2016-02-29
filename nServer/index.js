var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var server = require('http').Server(app);
var io = require('socket.io')(server);
var ot = require('ot');
var jwt = require('jsonwebtoken');
var sjwt = require('socketio-jwt');
var mongoose = require('mongoose');
var User = require('./models/user.js');
var fs = require('fs');
var util = require('util');
//process.__defineGetter__('stderr', function() { return fs.createWriteStream(__dirname + '/error.log', {flags:'w'}) })

server.listen(3000);
app.use(express.static('public'));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(passport.initialize());
app.use(bodyParser.urlencoded({extended: true}));

passport.use(User.createStrategy());

var servers = {};

mongoose.connect('mongodb://heroku:motoxt720@ds058048.mongolab.com:58048/crosscompile');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {

    /*var denise = new User({name:'warr',password:'denise',files:[]});
     denise.save(function(err){
     console.log('saved');
     });*/
    /*User.find({projects:{$elimMatch:{name:"War"}}},function(data){
        console.log(data);
    });*/
    User.register(new User({username: 'warrr', projects: []}), 'Denise', function (err, account) {
        if (err) {
            console.log(err);
        }
        console.log(account);
    });

    app.post('/signup', function(req,res){
        console.log(req.body);
        User.register(new User({username: req.body.username, projects: []}), req.body.password, function (err, account) {
            if (err) {
                console.log(err);
                res.send(err.message);
                return;
            }
            console.log(account);
            res.send("All good!")
        });
    });

    app.post('/login', passport.authenticate('local', {failureRedirect: 'err.json'}),
        function (req, res) {
            console.log(req.user);
            res.json({token: jwt.sign({payload: req.user.username}, 'muchkey')});
        });

    io.on('connection', sjwt.authorize({
        secret: 'muchkey',
        timeout: 15000
    })).on('authenticated', function (socket) {
        socket.on('init', function (file) {
                socket.emit('project').on('project', function (project) {
                    socket.project = project = project.substr(project.lastIndexOf('\\') + 1);
                    if ((socket.server=servers[project + '\\' + file])) {
                        var state = {revision: socket.server.operations.length, doc: socket.server.document};
                        socket.join(project + '\\' + file);
                        socket.room=project + '\\' + file;
                        socket.emit('conn', state);
                    }
                    else {
                        User.findByUsername(socket.decoded_token.payload, true, function (err, user) {
                            if (err)console.log(err);
                            else {
                                var proj = user.projects.find(function (e) {
                                    return e.name == socket.project;
                                });

                                var doc = proj.files.find(function (e) {
                                    if(e)
                                    return e.name == file;
                                    return false;
                                });

                                if(doc) {
                                    servers[project + '\\' + file] = new ot.Server(doc.doc);
                                    socket.server = servers[project + '\\' + file];
                                    var state = {revision: socket.server.operations.length, doc: socket.server.document};
                                    socket.join(project + '\\' + file);
                                    socket.room = project + '\\' + file;
                                    socket.emit('conn', state);
                                }
                            }
                        });
                    }
                });
            console.log(servers);
           // var state = {revision: server.operations.length, doc: server.document};
           // console.log('server: connection', JSON.stringify(state), socket.decoded_token.payload);
        });

        socket.on('change', function (revision, operation) {
            operation = ot.TextOperation.fromJSON(operation);
            console.log('server:', revision, operation, servers);
            socket.emit('ack');
            socket.server.receiveOperation(revision, operation);
            socket.broadcast.to(socket.room).emit('change', operation);
        });
        socket.on('cursor', function (selection) {
            socket.broadcast.to(socket.room).emit('cursor', {selection: selection, id: socket.id});
        });
        socket.on('newProject', function (name) {
            console.log(name);
            User.findByUsername(socket.decoded_token.payload, true, function (err, user) {
                if (err)console.log(err);
                else {
                    user.projects.push({
                        name: name,
                        files: []
                    });
                    user.save(function (err) {
                        if (err)console.log(err);
                        else console.log(user);
                    });
                }
            });
        });
        socket.on('newFile', function (name) {
            console.log(name);
            if (socket.project == null) {
                socket.emit('project').on('project', function (project) {
                    socket.project = project;

                    User.findByUsername(socket.decoded_token.payload, true, function (err, user) {
                        if (err)console.log(err);
                        else {
                            var proj = user.projects.find(function (e) {
                                console.log(e.name, socket.project.substr(socket.project.lastIndexOf('\\') + 1));
                                return e.name == socket.project.substr(socket.project.lastIndexOf('\\') + 1);
                            });
                            console.log(proj);
                            proj.files.push({name: name, doc: ''});
                            user.save(function (err) {
                                if (err)console.log(err);
                                else console.log(user);
                            });
                        }
                    });
                });
            }
        });
    });
});