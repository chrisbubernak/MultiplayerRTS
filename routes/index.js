var AM = require( './modules/accountManager' );
var GM = require( './modules/gameManager' );


exports.index = function ( req, res ) {
  res.render( 'login' );
};

exports.post = function ( req, res ) {
  AM.login( req.param( 'user' ), req.param( 'pass' ), function ( error, user ) {
    if ( !user ) {
      res.send( error, 400 );
    }
    else {
      req.session.user = user;
      res.send( user, 200 );
    }
  });
};

exports.game = function ( req, res ) {
  var host = req.param( 'host' );
  var id = req.param( 'id' );
  var enemyId = req.param( 'enemyId' );
  var gameId = req.param( 'gameId' );
  res.render( 'game', { id: id, enemyId: enemyId, host: host, gameId: gameId });
};

exports.lobby = function ( req, res ) {
  if ( req.session.user == null ) { //redirect if user is not logged in
    res.redirect( '/' );
  } else {
    res.render( 'lobby', {
      udata: req.session.user
    });
  }
};

exports.login = function ( req, res ) {
  res.render( 'login' );
};

exports.signup = function ( req, res ) {
  res.render( 'signup' );
};

exports.localGame = function ( req, res ) {
  res.render( 'localGame' );
};

//signs up user and logs them in
exports.signUpPost = function ( req, res ) {
  var user = req.param( 'user' );
  var pass = req.param( 'pass' );
  var email = req.param( 'email' );
  AM.signUp( user, pass, email, function ( error, user ) {
    if ( !user ) {
      res.send( error, 400 );
    }
    else {
      req.session.user = user;
      res.redirect( 'lobby' );
    }
  });
};


//let the server know the game ended and report the result
exports.gameEnd = function ( req, res ) {
  var game = req.param( 'gameId' );
  var reporter = req.param( 'reporter' );
  var winner = req.param( 'winner' );
  var actions = req.param('actions'); 
  GM.reportGameEnd(game, reporter, winner, actions);
};

exports.gameReports = function ( req, res ) {
  GM.getGameReports(function (error, results) {
    if (!results) {
      res.send(error, 400);
    }
    else {
      console.log(results);
      console.log('$$$$$$$$$');
      res.render('gameReports', {
        reports: results
      });
    }
  });
};

exports.replay = function (req, res) {
  var game = req.param('gameId');
  GM.gameActionsGet(game, function ( error, actions ) {
    if ( !actions ) {
      res.send( error, 400 );
    }
    else {
      res.render( 'replay', {
        actions: actions
      });
    }
  });
};