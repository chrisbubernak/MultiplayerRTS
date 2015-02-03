﻿var myGame;
var start;
var peer;
var conn;
var id;
var mySocket;
var startGame;
var sendChat;
var receiveChat;
// gets called on doc ready...
function start(username) {
  sendChat = function(text) {
    // send chat to the server
  }

  writeToChat = function(text, player) {
    // receive chat from the server from a specific player
    var chatHistory = document.getElementById('chatHistory');
    chatHistory.innerHTML += ("<br>" + player + "> " + text); 
  }

  writeDebugToChat = function(text) {
    writeToChat(text, 'DEBUG'); 
  }

  chooseMap = function(enemyId, enemySocket) {
    var mapId = prompt('Please enter a map Id (0-2): ');
    if (mapId != null) {
        startGame(enemyId, enemySocket, mapId);
    }
  }
 
  startGame = function (enemyId, enemySocket, mapId) {
    socket.emit('RequestGame', { hostId: id, hostSocket: mySocket, clientId: enemyId, clientSocket: enemySocket, mapId: mapId });
  }

  var socket = io.connect('/');

  socket.on('ChatReceived', function (data) {
    if (data.text && data.player) {
      writeToChat(data.text, data.player);
    } else {
      writeDebugToChat("Error in ChatReceived. data.text = " + data.text + " data.player = " + data.player);
    }
  });

  socket.on('ClientJoined', function (data) {
    writeDebugToChat(data);
    writeDebugToChat("My user ID is: " + data.userId);
    mySocket = data.userId;
    socket.emit('SendUserInfoToServer', { socket: data.userId, username: username });
  });

  socket.on('ClientList', function (data) {
    console.log(data);
    document.getElementById('playerList').innerHTML = "Client List:\n";
    for (var c in data.clients) {
      if (data.clients[c].Socket !== mySocket) { //don't include ourself in the list
        document.getElementById('playerList').innerHTML +=
          '<div class="playerListItem" onclick=\'chooseMap(' + data.clients[c].Id + ', "' + data.clients[c].Socket + '")\'>'
          + data.clients[c].Username + '</div>';
      } else {
        id = data.clients[c].Id;
        mySocket = data.clients[c].Socket;
      }
    }
  });
   
  socket.on('StartGame', function (data) {
    var hostId = data.host;
    var clientId = data.client;
    var gameId = data.gameId;
    var mapId = data.mapId;
    socket.disconnect();
    var host = false;
    if (id === data.host) {
      enemyId = clientId;
      host = true;
      console.log('Game started and I am the host');
    }
    else {
      enemyId = hostId;
      host = false;
      console.log('Game started and I am the client');
    }
    //todo: remove hard coded map id = 1
    window.location.href = '/game?host=' + host + '&id=' + id + '&enemyId=' + enemyId + '&gameId=' + gameId + '&mapId=' + mapId;
  });
}

