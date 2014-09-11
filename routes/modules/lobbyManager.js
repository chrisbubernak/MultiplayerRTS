module.exports = function ( io ) {
  var sql = require( 'msnodesql' );
  var conn_str = process.env.ConnectionString || "Driver={SQL Server Native Client 11.0};Server=.\\SQLEXPRESS;Database=RTS;Trusted_Connection={Yes}";


  this.clientDisconnect = function ( client ) {
    removeClientFromLobby( client );
    console.log( "Client: " + client.id + " disconnected" );
  }

  this.addClientToLobby = function ( username, socket ) {
    sql.query( conn_str, "exec dbo.User_AddToLobby '" + username + "', '" + socket + "'", function ( err, results ) {
      if ( err ) {
        console.log( err );
        return;
      }
      broadcastClientList(); //on a successful add broadcast out the new contents of the lobby
    });
  }

  this.removeStaleClients = function () {
    sql.query( conn_str, "exec LobbyUser_RemoveAll", function ( err, results) {
      if ( err ) {
        console.log( err );
        return;
      }
    });
  }


  function broadcastClientList() {
    sql.query( conn_str, "exec dbo.User_GetAllInLobby", function ( err, results ) {
      if ( err ) {
        console.log( err );
        return;
      }
      io.sockets.emit( 'ClientList', {
        clients: results
      });
    });
  }



  function removeClientFromLobby( client ) {
    sql.query( conn_str, "exec dbo.User_RemoveFromLobby '" + client.id + "'", function ( err, results ) {
      if ( err ) {
        console.log( err );
        return;
      }
      broadcastClientList(); //on a successful remove broadcast out the new contents of the lobby
    });
  }
  return this;
}