var myGame;
var start;
var peer;
var conn;
var id;
function start(username) {
  var id;
  start = function (enemy) {
    socket.emit('RequestGame', { host: id, client: enemy });
  }

  var socket = io.connect('/');
  socket.on('ClientJoined', function (data) {
    console.log("My user ID is: " + data.userId);
    id = data.userId;
    socket.emit('SendUserInfoToServer', { socket: data.userId, username: username });
  });
  socket.on('ClientList', function (data) {
    console.log(data);
    document.getElementById('playerList').innerHTML = "Client List:\n";
    for (var c in data.clients) {
      if (data.clients[c].Socket != id) { //don't include ourself in the list
        document.getElementById('playerList').innerHTML += '<div class="game" onclick=\'start("' + data.clients[c].Socket + '")\'>' + data.clients[c].Username + '</div>';
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
    window.location.href = '/game?host=' + host + '&id=' + id + '&enemyId=' + enemyId + '&gameId=' + gameId;
  });
}

