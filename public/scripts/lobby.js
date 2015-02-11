var myGame;
var start;
var peer;
var conn;
var id;
var mySocket;
var startGame;
var sendChat;
var receiveChat;
var launchSinglePlayer;

// gets called on doc ready...
function documentReady(username) {
  launchSinglePlayer = function(enemyId, enemySocket, mapId) {
    window.location.href = '/localGame?mapId=' + mapId;
  }

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
          '<div class="playerListItem" onclick=\'showMapDialog(' + player.Id + ', "' + player.Socket + '", startGame)\'>'
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


  /*
   * Click Handlers
   */

  document.getElementById('sendChat').onclick = sendChat;

  document.getElementById('singlePlayerButton').onclick = function() {
    showMapDialog(/* enemyId */ undefined, /* enemySocket*/ undefined, launchSinglePlayer);
  }
  document.getElementById('settingsButton').onclick = function() {
    writeDebugToChat('Settings Button not enabled!!!!');
  }
  document.getElementById('signOutButton').onclick = function() {
    writeDebugToChat('Sign Out Button not enabled!!!!');
  }
  document.getElementById('replayButton').onclick = function() {
    window.location.href = '/gameReports';
  }

  /*
   * Dialogs
   */

  showMapDialog = function(enemyId, enemySocket, callback) {
    var maps = document.getElementById("chooseMap");
    maps.style.display = 'block';
    // todo: can we find this by just searching children instead of 
    // the entire doc?
    var chooseMapSubmitBtn = document.getElementById('chooseMapSubmit');
    chooseMapSubmitBtn.onclick = function() {
      var mapId = document.getElementById('chooseMapSelection').value;
      if (mapId !== null && mapId !== undefined && mapId !== '') {
        callback(enemyId, enemySocket, mapId);
      }
    };
  }

  hideMapDialog = function() {
    var maps = document.getElementById("chooseMap");
    maps.style.display = 'none'; 
  } 
}

