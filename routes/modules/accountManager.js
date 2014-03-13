var sql = require('msnodesql');
var conn_str = process.env.ConnectionString || "Driver={SQL Server Native Client 11.0};Server=.\\SQLEXPRESS;Database=RTS;Trusted_Connection={Yes}";


exports.login = function(user, pass, callback) {
  sql.query(conn_str, "exec dbo.LobbyUser_Get null, '" + user + "'", function (err, results) {
    if (err) {
      callback(err, null);
      return;
    }
    if (results.length > 0) {
      callback('user already logged in', null);
      return;
    }

    sql.query(conn_str, "exec dbo.User_Login '" + user+ "', '" + pass + "'", function (err, results) {
      if (err) {
        callback(err, null);
      }
      else if (results.length > 0) {
        callback(null, user);
      }
      else {
        callback('invalid password or username', null);
      }
    });
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
}



