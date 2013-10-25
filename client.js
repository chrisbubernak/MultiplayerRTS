var myGame;

window.onload = function() {


  var socket = io.connect('http://localhost');
  socket.on('ClientJoined', function (data) {
    console.log("My user ID is: " + data.userId);
    socket.emit('ClientConfirmation', {userId: data.userId });
  });
   
  setInterval(function(data) {
      socket.emit('ClientTest', {time: new Date().getTime()});
      //fpsOut.innerHTML = Math.round(1000/diffTime)  + " fps";
  }, 1000);

  socket.on('ServerTest', function (data) {
    console.log("Heard back from server: " + (new Date().getTime() - data.time));
  });

  socket.on('startGame', function(data) {
  	  myGame = new Game();
      myGame.run();
  });
}