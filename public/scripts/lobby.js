var myGame;
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
  sendChat = function() {
    var textAreaElement = document.getElementById('chatInput').children[0];
    var text = textAreaElement.value;
    textAreaElement.value = "";
    // no reason to send blank messages so verify it exists first
    if (text) {
      // send chat to the server
      socket.emit('ChatToServer', {
        player: username,
        text: text
      });
    }
  }

  writeToChat = function(text, player) {
    // receive chat from the server from a specific player
    var chatHistory = document.getElementById('chatHistory');
    chatHistory.innerHTML = ("<br>" + player + "> " + text) + chatHistory.innerHTML; 
  }

  writeDebugToChat = function(text) {
    writeToChat(text, 'DEBUG'); 
  }

  document.getElementById('sendChat').onclick = sendChat;

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

  socket.on('ChatFromServer', function (data) {
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
    document.getElementById('playerList').innerHTML = "<h3>Chat Room: </h3>\n";
    for (var c in data.clients) {
      var player = data.clients[c];
      writeDebugToChat(player.Username);
      if (data.clients[c].Socket !== mySocket) { // we can't play vs ourself...
        document.getElementById('playerList').innerHTML +=
          '<div class="playerListItem" onclick=\'chooseMap(' + player.Id + ', "' + player.Socket + '")\'>'
          + player.Username + '</div>';
      } else {
        id = player.Id;
        mySocket = player.Socket;
        document.getElementById('playerList').innerHTML += '<div class="currentPlayerListItem">' + player.Username + '</div>';
      }
    }
    writeDebugToChat("Client List Updated...");
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
      writeDebugToChat('Game started and I am the host');
    }
    else {
      enemyId = hostId;
      host = false;
      writeDebugToChat('Game started and I am the client');
    }
    // todo: remove the 999s here and make sure we use something more unique (maybe socket ids) than userIds
    // because these collide with things...especially when we don't have our own peer server
    window.location.href = '/game?host=' + host + '&id=' + id + '9&enemyId=' + enemyId + '9&gameId=' + gameId + '&mapId=' + mapId;
  });
}

