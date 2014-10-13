﻿var express = require('express');
var routes = require('./routes');
var uuid = require('uuid');
var http = require('http');
var path = require('path');
var app = express();


// all environments
app.set('port', process.env.PORT || 3003);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.urlencoded());
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.session({ secret: process.env.SessionSecret || "secret" }));
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

if (app.settings.env === 'development') {
    app.use(express.errorHandler());
}

//routes
app.get('/', routes.index);
app.get('/login', routes.login);
app.get('/lobby', routes.lobby);
app.get('/signup', routes.signup);
app.post('/gameEnd', routes.gameEnd);
app.post('/', routes.post);
app.post('/signup', routes.signUpPost);
app.get('/game', routes.game);
app.get('/localGame', routes.localGame);
app.get('/replay', routes.replay);
app.get('/gameReports', routes.gameReports);

module.exports = app;

var server = http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

//socket stuff...might want to move this somewhere else in the future to keep this file small and encapsulate lobby code
var io = require('socket.io').listen(server);
var LM = require('./routes/modules/lobbyManager')(io);
var GM = require('./routes/modules/gameManager');

//TODO: remove all stale clients from lobby
LM.removeStaleClients();


io.sockets.on('connection', function (client) {
    client.emit('ClientJoined', { userId: client.id });

    client.on('SendUserInfoToServer', function (data) {
        LM.addClientToLobby(data.username, data.socket);
    });

    //when a client requests a game, try and start it
    client.on('RequestGame', function (data) {
        var host = data.host;
        var client = data.client;
        var gameId = uuid.v4();
        io.sockets.socket(host).emit('StartGame', { host: host, client: client, gameId: gameId });
        io.sockets.socket(client).emit('StartGame', { host: host, client: client, gameId: gameId });

        GM.reportGameStart(host, client, gameId);
    });

    client.on('disconnect', function () {
        LM.clientDisconnect(client);
    });
});
