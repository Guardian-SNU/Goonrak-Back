
// check user is logged in
var validate_login = function(session){
	var login = session.login;

	if(login){
		return true;
	}
	else{
		return false;
	}
};

// check user's username
var validate_user = function(session, username){
	var user = session.username;

	if(user === username){
		return true;
	}
	else{
		return false;
	}
};

// response for when auth failed
var auth_fail_response = { "resultcode": 403, "message": "user auth fail" };

module.exports = {
	validate_login			: validate_login,
	validate_user				: validate_user,
	auth_fail_response	: JSON.stringify(auth_fail_response),
};
