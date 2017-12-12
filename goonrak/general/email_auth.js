/* script for email verification */

const mysql = require('mysql');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db_config = require('../config/db_config.js');
const email_config = require('../config/email_config.js');
const connection = mysql.createConnection(db_config);

const send_response = require('./response_manager.js').send_response;

// interval for token expiration ( 10 HOUR )
const TOKEN_EXPIREATION_TIME = 36000000;

// TODO: add route, if SSL added, change http to https
const VERIFICATION_ADDRESS = 'http://goonrak.snucse.org:9999/auth/activate?';

const send_verification_email = function(username, address, res) {
    // token for email_verification
    const randomstring = function(length) {
        return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex')
            .slice(0, length);
    };

    let salt = randomstring(16);
    let token = crypto.createHash('sha256').update(salt).digest('hex');

    const smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: email_config,
    });

    let mail_text = VERIFICATION_ADDRESS + 'username='+ username + '&token='+ token;
    const mailOptions = {
        from: 'no_reply <snucsguard@gmail.com>',
        to: address,
        subject: '[Goonrak] Email Verification Token',
        text: '군락 이메일 인증을 위하여 다음의 링크를 클릭해주세요.\n' + mail_text,
    };


    // delete if there is previous token on same host
    connection.query('DELETE FROM EMAIL_TOKEN WHERE username=?', username, function(err, result) {
        if (err) {
            return send_response(res, 500, 'Internal server error');
        }
    });

    // insert token to DB
    const values = {username: username, token: token, expires: (Date.now() + TOKEN_EXPIREATION_TIME).toString()};
    connection.query('INSERT INTO EMAIL_TOKEN SET ?', values, function(err, result) {
        if (err) {
            return send_response(res, 500, 'Internal server error');
        }
    });

    // send_email
    smtpTransport.sendMail(mailOptions, function(err, mail_res) {
        if (err) {
            return send_response(res, 500, 'Internal server error');
        }

        smtpTransport.close();
        return send_response(res, 200, 'Successfully send mail');
    });
};

/* verify token
 *
 * host : user IP
 * token : user token input
 * res : response object
 */
const verify_token = function(username, token, res) {
    // delete expired tokens
    connection.query('DELETE FROM EMAIL_TOKEN WHERE expires < ?', Date.now(), function(err, result) {
        if (err) {
            console.log('[-] Error while deleting expired EMAIL_TOKEN rows');
        }
    });

    // compare token
    connection.query('SELECT username FROM EMAIL_TOKEN WHERE token=?', token, function(err, rows, fields) {
        if (err) {
            return send_response(res, 500, 'Internal server error');
        }

        if (rows.length==0) {
            return send_response(res, 401, 'Not valid token');
        }

        connection.query('UPDATE USER SET email_auth=true WHERE username=?', username, function(err, rows, field) {
            if (err) {
                console.log(err);
                return send_response(res, 500, 'Internal server error');
            }
            return send_response(res, 200, 'Successfully verified');
        });
    });
};

module.exports = {
    send_verification_email: send_verification_email,
    verify_token: verify_token,
};
