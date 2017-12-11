var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var mysql = require('mysql');
var db_config = require('../config/db_config.js');
var connection = mysql.createConnection(db_config);

var email_auth = require('../general/email_auth.js');
var send_response = require('../general/response_manager.js').send_response

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
        return send_response(res, 400, "Parameters not given");
	}

	if(sess.username){
        return send_response(res, 400, "Already signed in");
	}

	connection.query('SELECT l.username, l.salt, l.password, u.email_auth FROM LOGIN l, USER u WHERE u.username=l.username AND l.username=?', username, function(err, rows, field){
		
		if(err){
			console.log(err);
            return send_response(res, 200, "Internal server error");
		}

		// check username uniqueness
		if(rows && rows.length == 1){
			var salt = rows[0].salt;
			var pw_hash = rows[0].password;
			var user_hash = crypto.createHash('sha256').update(salt + password).digest('hex');
			var email_auth = rows[0].email_auth;
			
            // correct password given
			if(!email_auth){
                return send_response(res, 401, 'No email verification');
			}
			if(pw_hash == user_hash){
				sess.username=username;
                return send_response(res, 200, "Login successful");
			}

			// wrong password given
			else{
                return send_response(res, 401, "Wrong info");
			}
		}

		// no matching username
		else{
            return send_response(res, 401, "Wrong info");
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
                return send_response(res, 500, "Internal server error");
			}else{
            	res.status(301).redirect('/');
			}
        });
    }
    else{
		// better json?
        return send_response(res, 400, "Not logged in");
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
	var is_club_member=req.body.is_club_member;

	if(!username || !password || !email || !nickname){
	    return send_response(res, 400, "Parameters not given");
    }


    var salt=randomstring(16);
    var password_hash = crypto.createHash('sha256').update(salt + password).digest('hex');

    if(is_club_member) {
        if (!phone || !real_name) {
            return send_response(res, 400, "Parameters not enough");
        }
        var usertable_post = {
            username: username,
            nickname: nickname,
            email: email,
            is_club_member: is_club_member,
            is_admin: 0,
            real_name: real_name,
            phone: phone
        };
    }
	else {
        var usertable_post = {
            username: username,
            nickname: nickname,
            email: email,
            is_club_member: is_club_member,
            is_admin: 0
        };
    }
	var logintable_post={username:username,salt:salt,password:password_hash};

    connection.query('SELECT * FROM USER WHERE username=?', username, function(err, rows, field){
        if(err){
            console.log(err);
            return send_response(res, 500, "Internal server error");
        }
    	if(rows.length > 0){
            return send_response(res, 400, "Username exists");
        }

		connection.query('INSERT INTO USER SET ?', usertable_post, function(err, result){
			if(err){
				console.log(err);
                return send_response(res, 500, "Internal server error");
			}

			connection.query('INSERT INTO LOGIN SET ?', logintable_post, function(err, result){
				if(err){
					consolg.log(err);
                    return send_response(res, 400, "Internal server error");
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
