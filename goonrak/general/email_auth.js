/* script for email verification */

var mysql = require('mysql');
var nodemailer = require('nodemailer');
var db_config = require('../config/db_config.js');
var email_config = require('../config/email_config.js');
var connection = mysql.createConnection(db_config);

// interval for token expiration ( 10 HOUR )
var TOKEN_EXPIREATION_TIME = 36000000;

// TODO: add route, if SSL added, change http to https
var VERIFICATION_ADDRESS = 'http://goonrak.snucse.org:9999/<route>/?token='

/* send email
 *
 * host : user IP
 * address : user email address
 * res : response object
 */
var send_verification_email = function(host, address, res){

	// token for email_verification
	var token = Math.floor(Math.random()*10000).toString();

	var smtpTransport = nodemailer.createTransport({
		service: 'Gmail',
		auth: email_config,
	});

	var mailOptions = {
		from: 'no_reply <snucsguard@gmail.com>',
		to: address,
		subject: '[Goonrak] Email Verification Token',
		text: '군락 이메일 인증을 위하여 다음의 링크를 클릭해주세요.\n' + VERIFICATION_ADDRESS + token,
	};


	// delete if there is previous token on same host
	connection.query("DELETE FROM EMAIL_TOKEN WHERE id=?", host, function(err, result){
		if (err){
			res.status(500).json({"resultcode":500, "message": "Internal server error"});
		}
	});

	// insert token to DB
	var values = {id:host, token:token, expires:(Date.now() + TOKEN_EXPIREATION_TIME).toString()};
	connection.query("INSERT INTO EMAIL_TOKEN SET ?", values, function(err, result){
		if(err){
			res.status(500).json({"resultcode":500, "message": "Internal server error"});
		}
	});

	// send_email
	smtpTransport.sendMail(mailOptions, function(err, res){
		if(err){
			res.status(500).json({"resultcode":500, "message": "Internal server error"});
		}
		smtpTransport.close();
	});

	res.status(200).json({"resultcode":200, "message": "successfully sent email"});
};

/* verify token
 * 
 * host : user IP
 * token : user token input
 * res : response object
 */
var verify_token = function(host, token, res){
	// delete expired tokens
	connection.query("DELETE FROM EMAIL_TOKEN WHERE expires < ?", Date.now(), function(err, result){
		if(err){
			console.log("[-] Error while deleting expired EMAIL_TOKEN rows");
		}
	});

	// compare token
	connection.query("SELECT token FROM EMAIL_TOKEN WHERE id=?", host, function(err, rows, fields){
		if(err){
			res.status(500).json({"resultcode":500, "message": "Internal server error"});
		}

		// success
		if(rows[0].token == token){
			res.status(200).json({"resultcode":200, "message": "successfully verified"});
		} else {	
			res.status(400).json({"resultcode":400, "message": "wrong token"});
		}
	});
};

module.exports = {
	send_verification_email: send_verification_email,
	verify_token: verify_token,
};
