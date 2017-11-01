var mysql = require('mysql');
var Promise = require('promise');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

var USER_LEVEL = 0;
var MEMBER_LEVEL = 1;
var ADMIN_LEVEL = 2;

// check user is logged in
var validate_login = async function(session){
	var login = session.login;

	return new Promise(function(resolve, reject){
		if(login){
			resolve(true);
		} else {
			resolve(false);
		}
	});
};

// check user's username
var validate_user = async function(session, username){
	var user = session.username;

	return new Promise(function(resolve, reject){
		if(user && user === username){
			resolve(true);
		} else {
			resolve(false);
		}
	});
};

// check user's level
var validate_user_level = async function(session, username, level){

	return new Promise(async function(resolve, reject){
		// if username is wrong, return false
		if(!await validate_user(session, username)){
			resolve(false);
		}

		// if level is USER_LEVEL ( open to all ) return true
		if(level == USER_LEVEL){
			resolve(true);
		}

		connection.query("SELECT is_club_member, is_admin FROM USER where username=?", username, async function(err, rows, fields){
			
			if (err){
				resolve(false);
			}
			
			if(rows.length > 0){
				if(level == MEMBER_LEVEL && (rows[0].is_club_member || rows[0].is_admin)){
					resolve(true);
				}
				else if(level == ADMIN_LEVEL && rows[0].is_admin){
					resolve(true);
				}
				else{
					resolve(false);
				}
			}
			else{
				resolve(false);
			}
		});
	});
}

// response for when auth failed
var auth_fail_response = { "resultcode": 403, "message": "user auth fail" };

module.exports = {
	validate_login		: validate_login,
	validate_user		: validate_user,
	validate_user_level : validate_user_level,
	auth_fail_response	: JSON.stringify(auth_fail_response),

	USER_LEVEL 			: USER_LEVEL,
	MEMBER_LEVEL		: MEMBER_LEVEL,
	ADMIN_LEVEL			: ADMIN_LEVEL,
};
