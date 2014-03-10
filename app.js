/// <reference path="node.d.ts" />
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.session({ secret: process.env.SessionSecret || "secret" }));
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.configure('development', function () {
    app.use(express.errorHandler());
});

//routes
app.get('/', routes.index);
app.get('/login', routes.login);
app.get('/home', routes.home);
app.get('/signup', routes.signup);
app.post('/', routes.post);
app.post('/signup', routes.signUpPost);
app.get('/game', routes.game);

var server = http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
