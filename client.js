var myGame;

window.onload = function() {
  myGame = new Game();
  //myGame.viewport = document.getElementById('viewport');
  myGame.run();

  var socket = io.connect('http://localhost');
  socket.on('ClientJoined', function (data) {
    console.log("My user ID is: " + data.userId);
    socket.emit('ClientConfirmation', {userId: data.userId });
  });
}