var user_auth	= require('../general/user_auth.js');
var mysql	= require('mysql');
var db_config	= require('../config/db_config.js');
var connection	= mysql.createConnection(db_config);

var USER_LEVEL		= 0;
var MEMBER_LEVEL	= 1;
var ADMIN_LEVEL		= 2;

var validate_read = async function (session, username, board_id) {
	
	return new Promise(async function(resolve, reject) {
		if(!await user_auth.validate_user(session, username)) {
			return resolve(false);
		}

		var sql		= "SELECT read_level FROM BOARD WHERE board_id=?";
		var q_param	= [board_id];

		connection.query(sql, q_param, async function (err, rows, fields) {
			if(err) {
				return resolve(false);
			}

			if(rows.length > 0) {
				var level = rows[0].read_level;
				var validated = await user_auth.validate_user_level(session, username, level);

				if(validated){
					return resolve(true);
				} else {
					return resolve(false);
				}

			} else {
				return resolve(false);
			}
		});
	});
};


var validate_write = function (session, username, board_id) {
	
	return new Promise(async function(resolve, reject) {
		if(!await user_auth.validate_user(session, username)) {
			return resolve(false);
		}

		var sql		= "SELECT write_level FROM BOARD WHERE board_id=?";
		var q_param	= [board_id];

		connection.query(sql, q_param, async function (err, rows, fields) {
			if(err) {
				return resolve(false);
			}

			if(rows.length > 0) {
				var level = rows[0].write_level;
				var validated = await user_auth.validate_user_level(session, username, level)

				if(validated){
					return resolve(true);
				} else {
					return resolve(false);
				}
			} else {
				return resolve(false);
			}
		});
	});	
};

module.exports = {
	validate_read	: validate_read,
	validate_write	: validate_write
}
