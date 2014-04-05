var AM = require('./modules/accountManager');


exports.index = function(req, res){
    res.render('login');
};

exports.post = function(req, res) {
  AM.login(req.param('user'), req.param('pass'), function(error, user){
	  if (!user){
			res.send(error, 400);
		}	
    else{
      req.session.user = user;
			res.send(user, 200);
		}
	});
};

exports.game = function(req, res){
  var host = req.param('host');
  var id = req.param('id');
  var enemyId = req.param('enemyId');
  res.render('game', {id: id, enemyId: enemyId, host: host});
};

exports.lobby = function(req, res){
  if (req.session.user == null) { //redirect if user is not logged in
    res.redirect('/');
  } else {
    res.render('lobby', {
      udata: req.session.user
    });
  }
};

exports.login = function(req, res){
  res.render('login');
};

exports.signup = function(req, res){
  res.render('signup');
};

//signs up user and logs them in
exports.signUpPost = function (req, res) {
  var user = req.param('user');
  var pass = req.param('pass');
  var email = req.param('email');
  AM.signUp(user, pass, email, function(error, user) {
	  if (!user){
			res.send(error, 400);
		}	
    else{
		  req.session.user = user;
			res.redirect('lobby');
		}
	});
};
