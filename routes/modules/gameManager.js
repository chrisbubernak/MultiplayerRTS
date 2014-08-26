module.exports = function ( io ) {
  var sql = require( 'msnodesql' );
  var conn_str = process.env.ConnectionString || "Driver={SQL Server Native Client 11.0};Server=.\\SQLEXPRESS;Database=RTS;Trusted_Connection={Yes}";

  this.reportGameStart = function( hostId, clientId, gameId ) {
    var query = "INSERT INTO Game (Guid, Player1, Player2, StartTime) VALUES( '" +
      gameId + "', '" +
      hostId + "', '" +
      clientId + "', " +
      "GETUTCDATE())";

    sql.query( conn_str, query, function ( err, results ) {
      if ( err ) {
        console.log( err );
        return;
      }
    });
  }

  this.reportGameEnd = function() {
    sql.query( conn_str, "exec dbo.Game_ReportEnd '" + client.id + "'", function ( err, results ) {
      if ( err ) {
        console.log( err );
        return;
      }
      broadcastClientList(); //on a successful remove broadcast out the new contents of the lobby
    });
  }

  return this;
}