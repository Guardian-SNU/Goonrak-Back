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

	// if required fields are not given
	if(!req.body.username || !req.body.password){
		console.log("param not given");
		return res.sendStatus(404);
	}

	if(!req.body.password)

	var sess = req.session;
	var username = req.body.username;
	var password = req.body.password;
    var send_data={};
	// better hide table name?...
	connection.connect();
	connection.query('SELECT * FROM LOGIN WHERE username=?', username, function(err, rows, field){
		
		if(err){
			//connection.release()
			console.log(err)
			throw err;
			// TODO : NEED SOME ERROR HANDLEING
		}

		// check username uniqueness
		if(rows && rows.length == 1){
			var salt = rows[0].salt;
			var pw_hash = rows[0].password;
			var user_hash = crypto.createHash('sha256').update(salt + password).digest('hex');

			// correct password given
			if(pw_hash == user_hash){
				// TODO : login
				send_data["success"]=1;
				send_data["log"]='login successful';

				sess.username=username;

				res.json(send_data);
				//res.send("LOGIN SUCCESSFUL!");

			}

			// wrong password given
			else{
				// TODO : send JSON
				send_data["success"]=0;
				send_data["log"]='wrong password';
				res.json(send_data);
				//res.send("WRONG INFO");
			}
		}

		// no matching username
		else{
			// TODO : send JSON
			send_data["success"]=0;
			send_data["log"]='no username';
			res.json(send_data);
			//res.send("WRONG INFO");
		}
	});
	connection.end();
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
				throw err;
			}else{
            	res.redirect('/');
			}
        });
    }
    else{
		// better json?
		res.send('first login');
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

    var randomstring = function(length){
        return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
    };

	var username=req.body.username;
	var password=req.body.password;
	var email=req.body.email;
	var nickname=req.body.nickname;
	var registertime=req.body.registretime; // in backend?


    var salt=randomstring(16);
    var password_hash = crypto.createHash('sha256').update(salt + password).digest('hex');

	var usertable_post={username:username,nickname:nickname,registertime:registertime,email:email,is_club_member:0,is_admin:0};
	var logintable_post={username:username,salt:salt,password:password};

	connection.connect();

	connection.query('INSERT INTO USER SET ?',usertable_post,function(err,result){
		console.log(result);
	})
    connection.query('INSERT INTO LOGIN SET ?',logintable_post,function(err,result){
        console.log(result);
    })

	connection.end();

});

module.exports = router;
