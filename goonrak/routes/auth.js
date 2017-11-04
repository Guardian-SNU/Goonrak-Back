var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

var email_auth = require('../general/email_auth.js');

/* login
 * - get username, password from user, authenticate it, and give sessions to user
 * POST form data
 * - username
 * - password
 */


router.post('/login', function(req, res, next) {

    var sess = req.session;
    var username = req.body.username;
    var password = req.body.password;
    var send_data={};

	// if required fields are not given
	if(!username || !password){
		return res.status(400).json({"resultcode": 400, "message": "Parameters not given"});
	}

	if(sess.username){
        return res.status(400).json({"resultcode": 400, "message": "Already signed in"});
	}

	connection.query('SELECT l.username, l.salt, l.password, u.email_auth FROM LOGIN l, USER u WHERE u.username=l.username AND l.username=?', username, function(err, rows, field){
		
		if(err){
			console.log(err)
            return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
		}

		// check username uniqueness
		if(rows && rows.length == 1){
			var salt = rows[0].salt;
			var pw_hash = rows[0].password;
			var user_hash = crypto.createHash('sha256').update(salt + password).digest('hex');
			var email_auth = rows[0].email_auth;
			// correct password given
			if(!email_auth){
				send_data["resultcode"]=401;
				send_data["message"]='No email verification';
				return res.status(401).json(send_data);
			}
			if(pw_hash == user_hash){
                send_data["resultcode"]=200;
				send_data["success"]=1;
				send_data["message"]='Login successful';

				sess.username=username;

				return res.status(200).json(send_data);

			}

			// wrong password given
			else{
                send_data["resultcode"]=401;
				send_data["message"]='Wrong info';
				res.status(401).json(send_data);
			}
		}

		// no matching username
		else{
			send_data["resultcode"]=401;
			send_data["message"]='Wrong info';
			res.status(401).json(send_data);
		}
	});
});

/* logout
 * - remove sessions from user, and redirect to home directory
 *
 * POST form data
 */
router.post('/logout', function(req, res, next) {
	var sess=req.session;
	if(sess.username) {
        req.session.destroy(function (err) {
            if(err){
            	console.log(err);
                return res.status(500).json({"resultcode": 500, "message": "Internal server error"});

			}else{
            	req.session;
            	res.status(301).redirect('/');
			}
        });
    }
    else{
		// better json?
		res.status(400).json({"resultcode": 400, "message": "Login first"})
	}
});

/* register
 * - register new user
 *
 * POST form data
 * - username, password, email, ... ( check database schema )
 */
router.post('/register', function(req, res, next) {

	// TODO : exception handling
	// TODO : add captcha?
    var randomstring = function(length){
        return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex')
            .slice(0,length);
    };

	var username=req.body.username;
	var password=req.body.password;
	var email=req.body.email;
	var nickname=req.body.nickname;

	if(!username || !password || !email || !nickname){
        return res.status(400).json({"resultcode": 400, "message": "Parameters not Given"});
	}


    var salt=randomstring(16);
    var password_hash = crypto.createHash('sha256').update(salt + password).digest('hex');

	var usertable_post={username:username,nickname:nickname,email:email,is_club_member:0,is_admin:0};
	var logintable_post={username:username,salt:salt,password:password_hash};


    connection.query('SELECT * FROM USER WHERE username=?', username, function(err, rows, field){
        if(err){
            console.log(err)
            return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
        }
    	if(rows.length > 0){
            return res.status(400).json({"resultcode": 400, "message": "Exist username"});
        }

		connection.query('INSERT INTO USER SET ?', usertable_post, function(err, result){
			if(err){
				console.log(err);
				return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
			}

			connection.query('INSERT INTO LOGIN SET ?', logintable_post, function(err, result){
				if(err){
					consolg.log(err);
					return res.status(500).json({"resultcode": 400, "message": "Internal server error"});
				}

				// successfully regiestered, send verification email
				email_auth.send_verification_email(username, email, res);
			});
		});
    });
});

/* activate
 *	- activate account ( validating email )
 *
 * GET parameters
 * 	- username
 * 	- token
 */
router.get('/activate', function(req, res, next) {
	var token = req.query.token;
	var username = req.query.username;
	email_auth.verify_token(username, token, res);
});

module.exports = router;
