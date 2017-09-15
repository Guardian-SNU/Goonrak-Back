
var validate_login = function(session){
	var login = session.login;

	if(login){
		return true;
	}
	else{
		return false;
	}
};

var validate_user = function(session, username){
	var user = session.username;

	if(user === username){
		return true;
	}
	else{
		return false;
	}
};

module.exports = {
	validate_login		: validate_login,
	validate_user			: validate_user,
};
