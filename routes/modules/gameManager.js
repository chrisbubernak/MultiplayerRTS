var sql = require( 'msnodesql' );
var conn_str = process.env.ConnectionString || "Driver={SQL Server Native Client 11.0};Server=.\\SQLEXPRESS;Database=RTS;Trusted_Connection={Yes}";


exports.reportGameStart = function ( hostId, clientId, gameId ) {
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

  exports.reportGameEnd = function ( game, reporter, winner, actions ) {
  sql.query( conn_str, "exec dbo.GameReport_Add '" + game + "', '" + reporter + "', '" + winner + "', '" + actions + "'", function ( err, results ) {
    if ( err ) {
      console.log( err );
      return;
    }
  });
}
  exports.gameActionsGet = function ( gameGuid, callback ) {
  sql.query( conn_str, "exec dbo.GameActions_Get '" + gameGuid + "'", function ( err, results ) {
    if ( err ) {
      callback( err, null );
      return;
    }
      callback( null, results[0].Actions );
      return;
  });
}
