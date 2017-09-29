var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

var USER_LEVEL = 0;
var MEMBER_LEVEL = 1;
var ADMIN_LEVEL = 2;

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

// check user's level
var validate_user_level = function(session, username, level){
	
	if(!validate_user(session, username){
		return false;
	}

	if(level == USER_LEVEL){
		return true;
	}
	
	connection.connect();
	connection.query("SELECT is_club_member, is_admin FROM USER where username=?", username, function(err, rows, fields){
			
		if (err){
			return false;
		}
			
		if(rows){
			if(level == MEMBER_LEVEL && (rows[0].is_club_member || rows[0].is_admin)){
				return true;
			}
			else if(level == ADMIN_LEVEL && rows[0].is_admin){
				return true;
			}
			else{
				return false;
			}
		}
		else{
			return false;
		}
	});
}

// response for when auth failed
var auth_fail_response = { "resultcode": 403, "message": "user auth fail" };

module.exports = {
	validate_login			: validate_login,
	validate_user				: validate_user,
	auth_fail_response	: JSON.stringify(auth_fail_response),
};
