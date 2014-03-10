/// <reference path="game.ts" />
/// <reference path="../../../node.d.ts" />
var myGame;
var start;
var peer;
var conn;
var id;
window.onload = function () {
    var id;

    start = function (enemy) {
        socket.emit('RequestGame', { host: id, client: enemy });
    };

    var socket = io.connect('/');
    socket.on('ClientJoined', function (data) {
        console.log("My user ID is: " + data.userId);
        id = data.userId;
        peer = new Peer(id, { key: 'vgs0u19dlxhqto6r' });
    });
    socket.on('ClientList', function (data) {
        console.log(data);
        document.getElementById('gameList').innerHTML = "Client List:\n";
        for (var c in data.clients) {
            if (data.clients[c].Socket != id) {
                document.getElementById('gameList').innerHTML += '<div class="game" onclick=\'start("' + data.clients[c].Socket + '")\'>' + data.clients[c].Socket + " " + data.clients[c].UserId + '</div>';
            }
        }
    });

    socket.on('StartGame', function (data) {
        document.getElementById('gameList').innerHTML = "";
        var host;
        var enemyId;
        var gameId = 'test game';

        socket.disconnect();
        if (id == data.host) {
            enemyId = data.client;
            host = true;
            console.log('Game started and I am the host');
        } else {
            enemyId = data.host;
            host = false;
            console.log('Game started and I am the client');
        }
        conn = peer.connect(enemyId);

        peer.on('connection', function (conn) {
            conn.on('open', function () {
                conn.send('Hey from player: ' + id);
            });
            conn.on('close', function () {
                myGame.end('Enemy Quit');
            });
            myGame = new Game(conn, host, id, enemyId, gameId); //am i host? what is my id? what is the enemies id?
            myGame.run();
        });
        peer.on('error', function (err) {
            console.log('error!');
            console.log(err);
        });
    });
};