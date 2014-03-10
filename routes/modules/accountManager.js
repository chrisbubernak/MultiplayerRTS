var sql = require('msnodesql');
var conn_str = process.env.ConnectionString || "Driver={SQL Server Native Client 11.0};Server=.\\SQLEXPRESS;Database=RTS;Trusted_Connection={Yes}";


exports.login = function(user, pass, callback) {
  sql.query(conn_str, "exec dbo.User_Login '" + user+ "', '" + pass + "'", function (err, results) {
    if (err) {
      callback(err, null);
    }
    else if (results.length > 0) {
      callback(null, results[0].Username);
    }
    else {
      callback('invalid password or username', null);
    }
  });
}

exports.signUp = function(user, pass, email, callback) {
  sql.query(conn_str, "exec dbo.User_Get '" + user + "'", function (err, results) {
    if (err) {
      callback(err, null);
    }
    else if (results.length > 0){
      callback("Signup Failed - " + user + " already exists", null);
    }
    else {
      sql.query(conn_str, "exec dbo.User_Add '" + user + "', '" + pass + "', '" + email + "'", function (err, results) {
        if (err) {
          callback(err, nul);
        }
        else {
          callback(null, user);
        }
      });
    }
  });





  var io = require('socket.io').listen(server);

io.sockets.on('connection', function (client) {
  client.emit('ClientJoined', { userId: client.id });
  addClientToLobby(client);


  //when a client requests a game, try and start it
  client.on('RequestGame', function (data) {
    var host = data.host;
    var client = data.client;
    io.sockets.socket(host).emit('StartGame', { host: host, client: client });
    io.sockets.socket(client).emit('StartGame', { host: host, client: client });
  });


  client.on('disconnect', function () {
    clientDisconnect(client);
  });

});


function clientDisconnect(client) {
  removeClientFromLobby(client);
  console.log("Client: " + client.id + " disconnected");
}


function broadcastClientList() {
  sql.query(conn_str, "exec dbo.User_GetAllInLobby", function (err, results) {
    if (err) {
      console.log(err);
      return;
    }
    io.sockets.emit('ClientList', {
      clients: results
    });
  });
}

function addClientToLobby(client) {
  sql.query(conn_str, "exec dbo.User_AddToLobby 1, '" + client.id + "'", function (err, results) {
    if (err) {
      console.log(err);
      return;
    }
    broadcastClientList(); //on a successful add broadcast out the new contents of the lobby
  });
}


function removeClientFromLobby(client) {
  sql.query(conn_str, "exec dbo.User_RemoveFromLobby '" + client.id + "'", function (err, results) {
    if (err) {
      console.log(err);
      return;
    }
    broadcastClientList(); //on a successful remove broadcast out the new contents of the lobby
  });
}