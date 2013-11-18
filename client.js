var myGame;

window.onload = function() {
var id;

  var socket = io.connect('/');
  socket.on('ClientJoined', function (data) {
    console.log("My user ID is: " + data.userId);
    id = data.userId;
  });
   


  socket.on('startGame', function(data) {
  	  myGame = new Game(socket, id, data.clients);
      myGame.run();
  });
}