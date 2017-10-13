var user_auth	= require('../general/auth.js');
var mysql	= require('mysql');
var db_config	= require('../config/db_config.js');
var connection	= mysql.createConnection(db_config);

var USER_LEVEL		= 0;
var MEMBER_LEVEL	= 1;
var ADMIN_LEVEL		= 2;

var validate_read = function (session, username, board_id) {
	
	//var user = session.username;

	if(!user_auth.validate_user(session, username)) {
		return false;
	}

	var sql	= "SELECT read_level FROM BOARD WHERE board_id=?";
	var q_param	= [board_id];

	//connection.connect();
	connection.query(sql, q_param, function (err, rows, fields) {
		if(err) {
			return false;
		}

		if(rows) {
			var level = rows[0].read_level;
			return user_auth.validate_user_level(session, username, level);
		} else {
			return false;
		}
	});

	//connection.end();

};


var validate_write = function (session, username, board_id) {
	
	//var user = session.username;

	if(!user_auth.validate_user(session, username)) {
		return false;
	}

	var sql	= "SELECT write_level FROM BOARD WHERE board_id=?";
	var q_param	= [board_id];

	//connection.connect();
	connection.query(sql, q_param, function (err, rows, fields) {
		if(err) {
			return false;
		}

		if(rows) {
			var level = rows[0].write_level;
			return user_auth.validate_user_level(session, username, level);
		} else {
			return false;
		}
	});

	//connection.end();

};

module.exports = {
	validate_read	: validate_read,
	validate_write	: validate_write
}
