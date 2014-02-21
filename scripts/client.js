/// <reference path="game.ts" />
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
        document.getElementById('gameList').innerHTML = "Client List:\n";
        for (var c in data.clients) {
            if (data.clients[c] != id) {
                document.getElementById('gameList').innerHTML += '<div class="game" onclick=\'start("' + data.clients[c] + '")\'>' + data.clients[c] + '</div>';
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
            myGame = new Game(conn, host, id, enemyId, gameId); //am i host? what is my id? what is the enemies id?
            myGame.run();
        });
    });
};
