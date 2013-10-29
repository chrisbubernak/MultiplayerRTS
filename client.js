var myGame;

window.onload = function() {


  var socket = io.connect('http://localhost');
  socket.on('ClientJoined', function (data) {
    console.log("My user ID is: " + data.userId);
    socket.emit('ClientConfirmation', {userId: data.userId });
  });
   


  socket.on('startGame', function(data) {
  	  myGame = new Game(socket);
      myGame.run();
  });
}