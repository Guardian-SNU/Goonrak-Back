var user_auth = require('./auth.js');
var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

var USER_LEVEL = 0;
var MEMBER_LEVEL = 1;
var ADMIN_LEVEL = 2;

// check if user can read the board
var validate_readable = function(session, username, board_id){

	var user = session.username;
	
	// if username is wrong or not logged in
	if(!user_auth.validate_user(session, username)){
		return false;
	}

	connection.connect();
	connection.query("SELECT read_level FROM BOARD WHERE board_id=?", board_id, function (err, rows, field){
			if(err) {
				return false;
			}

			if(rows){
				var level = rows[0].read_level;
				return user_auth.validate_user_level(level);
			} else {
				return false;
			}
	}

	connection.end();
};

// check if user can write to the board
var validate_writeable = function(session, username, board_id){
	var user = session.username;
	
	// if username is wrong or not logged in
	if(!user_auth.validate_user(session, username)){
		return false;
	}

	connection.connect();
	connection.query("SELECT write_level FROM BOARD WHERE board_id=?", board_id, function (err, rows, field){
			if(err) {
				return false;
			}

			if(rows){
				var level = rows[0].write_level;
				return user_auth.validate_user_level(level);
			} else {
				return false;
			}
	}

	connection.end();
};

module.exports = {
	validate_readable			: validate_readable,
	validate_writeable		: validate_writeable,
}
