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
		return res.status(400).json({"resultcode": 400, "message": "Parameters not Given"});
	}

	if(sess.username){
        return res.status(400).json({"resultcode": 400, "message": "Already signed in"});
	}



	// better hide table name?...
	connection.query('SELECT * FROM LOGIN WHERE username=?', username, function(err, rows, field){
		
		if(err){
			console.log(err)
            return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
			// TODO : NEED SOME ERROR HANDLEING
		}

		// check username uniqueness
		if(rows && rows.length == 1){
			var salt = rows[0].salt;
			var pw_hash = rows[0].password;
			var user_hash = crypto.createHash('sha256').update(salt + password).digest('hex');
			var email_auth = rows[0].email_auth;
			// correct password given
			if(email_auth == false){
				send_data["resultcode"]=200;
				send_data["message"]='no email verification'
				res.status(200).json(send_data);
			}
			if(pw_hash == user_hash){
				// TODO : login
                send_data["resultcode"]=200;
				send_data["success"]=1;
				send_data["message"]='Login successful';

				sess.username=username;

				res.status(200).json(send_data);
				//res.send("LOGIN SUCCESSFUL!");

			}

			// wrong password given
			else{
				// TODO : send JSON
                send_data["resultcode"]=200;
				send_data["success"]=0;
				send_data["message"]='Wrong info';
				res.status(200).json(send_data);
				//res.send("WRONG INFO");
			}
		}

		// no matching username
		else{
			// TODO : send JSON
			send_data["resultcode"]=200;
			send_data["success"]=0;
			send_data["message"]='Wrong info';
			res.status(200).json(send_data);
			//res.send("WRONG INFO");
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
	var is_club_member=req.body.is_club_member;

	if(!username || !password || !email || !nickname){
        return res.status(400).json({"resultcode": 400, "message": "Parameters not Given"});
	}


    var salt=randomstring(16);
    var password_hash = crypto.createHash('sha256').update(salt + password).digest('hex');

    if(is_club_member) {
        if (!phone || !real_name) {
            return res.status(400).json({"resultcode": 400, "message": "Parameters not Enough"});
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
            console.log(err)
            return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
            // TODO : NEED SOME ERROR HANDLEING
        }
    	if(rows.length > 0){
            return res.status(400).json({"resultcode": 400, "message": "Exist username"});
        }
    }

	connection.query('INSERT INTO USER SET ?',usertable_post,function(err,result){
        if(err){
            console.log(err)
            return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
            // TODO : NEED SOME ERROR HANDLEING
        }
	})
    connection.query('INSERT INTO LOGIN SET ?',logintable_post,function(err,result){
        if(err){
            console.log(err)
            return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
            // TODO : NEED SOME ERROR HANDLEING
        }
    })
    email_auth.send_verification_email(username,email);

});

module.exports = router;
