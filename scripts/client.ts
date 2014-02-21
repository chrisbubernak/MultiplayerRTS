/// <reference path="game.ts" />

var myGame;
var start;
var peer;
var conn;
var id;
window.onload = function() {
  var id;

  start = function (enemy) {
    socket.emit('RequestGame', { host: id, client: enemy });
  }

  var socket = io.connect('/');
  socket.on('ClientJoined', function (data) {
    console.log("My user ID is: " + data.userId);
    id = data.userId;
    peer = new Peer(id, { key: 'vgs0u19dlxhqto6r' });

  });
  socket.on('ClientList', function (data) {
    document.getElementById('gameList').innerHTML = "Client List:\n";
    for (var c in data.clients) {
      if (data.clients[c] != id) { //don't include ourself in the list
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
    }
    else {
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
    peer.on('error', function (err) {
      console.log('error!');
      console.log(err);
    });

  });
}



/*class Client {
  private myGame: string;
  private id: string;
  private peer;
  private conn;
  private socket;
  private game: Game;

  constructor() {
    this.socket = io.connect('/');
    this.socket.on('ClientJoined', function (data) {
      console.log("My user ID is: " + data.userId);
      this.id = data.userId;
      this.peer = new Peer(this.id, { key: 'vgs0u19dlxhqto6r' });

    });
    this.socket.on('ClientList', function (data) {
      document.getElementById('gameList').innerHTML = "Client List:\n";
      for (var c in data.clients) {
        if (data.clients[c] != this.id) { //don't include ourself in the list
          document.getElementById('gameList').innerHTML += '<div class="game" onclick=\'c.start("' + data.clients[c] + '")\'>' + data.clients[c] + '</div>';
        }
      }
    });
    this.socket.on('StartGame', function (data) {
      if (data.host == this.id) {
        console.log('Game started and I am the host');
      }
      else {
        console.log('Game started and I am the client');
      }
      this.socket.disconnect();

      if (this.id == data.host) {
        this.conn = this.peer.connect(data.client);
      }
      else {
        this.conn = this.peer.connect(data.host);
      }
      this.conn.on('open', function () {
        this.conn.send('Hey from player: ' + this.id);
      });

      //Game.conn.send({ actions: that.actions, simTick: that.simTick, game: that.gameId });
      this.peer.on('connection', function (conn) {
        conn.on('data', function (data) {
          console.log('Recieved Data: ' + data);
        });
      });
      //myGame = new Game(socket, id, data.clients, data.gameId);
      //this.game = new Game(host, id, enemyId); //am i host? what is my id? what is the enemies id?
      //this.game.run();
    });
  }


  public start(enemy) {
    this.socket.emit('RequestGame', { host: id, client: enemy });
  }
}*/