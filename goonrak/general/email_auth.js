/* script for email verification */

var mysql = require('mysql');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var db_config = require('../config/db_config.js');
var email_config = require('../config/email_config.js');
var connection = mysql.createConnection(db_config);

// interval for token expiration ( 10 HOUR )
var TOKEN_EXPIREATION_TIME = 36000000;

// TODO: add route, if SSL added, change http to https
var VERIFICATION_ADDRESS = 'http://goonrak.snucse.org:9999/auth/activate?'

var send_verification_email = function(username, address, res){

    // token for email_verification

    var randomstring = function(length){
        return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex')
            .slice(0,length);
    };

    var salt=randomstring(16);
    var token = crypto.createHash('sha256').update(salt).digest('hex');

    var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: email_config,
    });

	var mail_text = VERIFICATION_ADDRESS + 'username='+ username + '&token='+ token;
    var mailOptions = {
        from: 'no_reply <snucsguard@gmail.com>',
        to: address,
        subject: '[Goonrak] Email Verification Token',
        text: '군락 이메일 인증을 위하여 다음의 링크를 클릭해주세요.\n' + mail_text,
    };


    // delete if there is previous token on same host
    connection.query("DELETE FROM EMAIL_TOKEN WHERE username=?", username, function(err, result){
        if (err){
            res.status(500).json({"resultcode":500, "message": "Internal server error"});
        }
    });

    // insert token to DB
    var values = {username:username, token:token, expires:(Date.now() + TOKEN_EXPIREATION_TIME).toString()};
    connection.query("INSERT INTO EMAIL_TOKEN SET ?", values, function(err, result){
        if(err){
            res.status(500).json({"resultcode":500, "message": "Internal server error"});
        }
    });

    // send_email
    smtpTransport.sendMail(mailOptions, function(err, mail_res){
        if(err){
            res.status(500).json({"resultcode":500, "message":"Internal server error"});
        }

    	res.status(200).json({"resultcode":200, "message": "successfully sent email"});
        smtpTransport.close();
    });
};

/* verify token
 *
 * host : user IP
 * token : user token input
 * res : response object
 */
var verify_token = function(username, token, res){
    // delete expired tokens
    connection.query("DELETE FROM EMAIL_TOKEN WHERE expires < ?", Date.now(), function(err, result){
        if(err){
            console.log("[-] Error while deleting expired EMAIL_TOKEN rows");
        }
    });

    // compare token
    connection.query("SELECT username FROM EMAIL_TOKEN WHERE token=?", token, function(err, rows, fields){
        if(err) {
            res.status(500).json({"resultcode": 500, "message": "Internal server error"});
        }

		if(rows.length==0) {
			res.status(401).json({"resultcode": 401, "message": "Not valid token"});
		}

        connection.query("UPDATE USER SET email_auth=true WHERE username=?",username,function(err, rows, field) {
            if (err) {
                console.log(err)
                return res.status(500).json({"resultcode": 500, "message": "Internal server error"});
            }
            res.status(200).json({"resultcode": 200, "message": "successfully verified"});
        });
    });
};

module.exports = {
    send_verification_email: send_verification_email,
    verify_token: verify_token,
};
