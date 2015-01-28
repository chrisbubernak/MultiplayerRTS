var myGame;
var start;
var peer;
var conn;
var id;
var mySocket;
var startGame;
function start(username) {
  chooseMap = function() {
    alert("Pick a map!");
  }
  startGame = function (enemyId, enemySocket) {
    chooseMap();
    // socket.emit('RequestGame', { hostId: id, hostSocket: mySocket, clientId: enemyId, clientSocket: enemySocket });
  }

  var socket = io.connect('/');
  socket.on('ClientJoined', function (data) {
    console.log(data);
    console.log("My user ID is: " + data.userId);
    mySocket = data.userId;
    socket.emit('SendUserInfoToServer', { socket: data.userId, username: username });
  });

  socket.on('ClientList', function (data) {
    console.log(data);
    document.getElementById('playerList').innerHTML = "Client List:\n";
    for (var c in data.clients) {
      if (data.clients[c].Socket !== mySocket) { //don't include ourself in the list
        document.getElementById('playerList').innerHTML +=
          '<div class="game" onclick=\'startGame(' + data.clients[c].Id + ', "' + data.clients[c].Socket + '")\'>'
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
    window.location.href = '/game?host=' + host + '&id=' + id + '&enemyId=' + enemyId + '&gameId=' + gameId + '&mapId=' + 1;
  });
}

