var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

/* login
 * - get username, password from user, authenticate it, and give sessions to user
 * POST form data
 * - username
 * - password
 */
router.post('/login', function(req, res, next) {

	// console.log(req.body);
	// if required fields are not given
	if(!req.body.username || !req.body.password){
		console.log("param not given");
		return res.sendStatus(404);
	}

	var sess = req.session;
	var username = req.body.username;
	var password = req.body.password;

	// better hide table name?...
	connection.query('SELECT * FROM LOGIN WHERE username=?', username, function(err, rows, field){
		
		//if(err){
		//	throw err;
		//	TODO : NEED SOME ERROR HANDLEING
		//}

		// check username uniqueness
		if(rows && rows.length == 1){
			var salt = rows[0].salt;
			var pw_hash = rows[0].password;
			var user_hash = crypto.createHash('sha256').update(salt + password).digest('hex');

			// correct password given
			if(pw_hash == user_hash){
				// TODO : login
				res.send("LOGIN SUCCESSFUL!");
			}

			// wrong password given
			else{
				// TODO : send JSON
				res.send("WRONG INFO");
			}
		}

		// no matching username
		else{
			// TODO : send JSON
			res.send("WRONG INFO");
		}
	});
});

/* logout
 * - remove sessions from user, and redirect to home directory
 *
 * POST form data
 */
router.post('/logout', function(req, res, next) {
	// TODO : implement
});

/* register
 * - register new user
 *
 * POST form data
 * - username, password, email, ... ( check database schema )
 */
router.post('/register', function(req, res, next) {
});

module.exports = router;
